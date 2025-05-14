import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, CheckCircleIcon, TrendingUp ,Scroll, ScrollText } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TopNav } from "@/components/TopNav";
import { useCurrency } from "../context/currencyContext.jsx";
import { toast } from "react-toastify";

// Import services
import { getAllRpPrice } from "../services/rpService.js";
import { getAllCurrencies } from "../services/currencyService.js";
import { getAllPaymentMethods } from "../services/payMethodService.js";
import { getAllRPPriceConversions } from "../services/rpConvertionService.js";
import { getAllPaymentMethodCurrencies } from "../services/paymentMethodCurrencyService.js";
import { 
  checkCuponUsage, 
  createPurchase, 
  simulatePurchaseProgress 
} from "../services/purcharseService.js";
import { validateCupon, validateRewardCoupon } from "../services/cuponServices.js";
import { useStore } from "../context/StoreContext.jsx";

// Modal para selección de skins para el reward coupon
import { CouponSkinsSelectionModal } from "@/components/CouponSkinsSelectionModal";

// Schema de validación del formulario
const formSchema = z.object({
  riotName: z
    .string()
    .min(3, "El Riot Name debe tener al menos 3 caracteres")
    .refine((value) => {
      if (!value.includes("#")) return false;
      const [name, tag] = value.split("#");
      if (!name || name.trim() === "") return false;
      if (!tag || tag.length < 3 || tag.length > 5) return false;
      return true;
    }, {
      message:
        "Tu Riot Name debe incluir un # seguido de 3 a 5 caracteres detras",
    }),
  discordName: z.string().min(3, "Tu Nombre de discord debe tener al menos 3 caracteres"),
  server: z.string().min(1, "Por favor selecciona un servidor"),
  paymentMethod: z.string().min(1, "Por favor selecciona un metodo de pago"),
  currency: z.string().min(1, "Por favor selecciona una divisa"),
  couponCode: z.string().optional()
});

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { cart, clearCart } = useStore();
  const [cartItems, setCartItems] = useState(cart);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [rpPrices, setRpPrices] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [paymentMethodCurrencies, setPaymentMethodCurrencies] = useState({});
  const [couponData, setCouponData] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  // Estados para la selección de skins para el reward coupon
  const [showCouponSelectionModal, setShowCouponSelectionModal] = useState(false);
  const [eligibleCouponItems, setEligibleCouponItems] = useState([]);
  // Nuevo estado para la simulación de progreso
  const [progressSimulation, setProgressSimulation] = useState(null);
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(false);
  
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riotName: "",
      discordName: "",
      server: "",
      paymentMethod: "",
      currency: "",
      couponCode: ""
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          currencyData,
          rpPriceData,
          paymentMethodData,
          conversionData,
          methodCurrenciesData
        ] = await Promise.all([
          getAllCurrencies(),
          getAllRpPrice(),
          getAllPaymentMethods(),
          getAllRPPriceConversions(),
          getAllPaymentMethodCurrencies()
        ]);
        setCurrencies(currencyData);
        setRpPrices(rpPriceData);
        setPaymentMethods(paymentMethodData);
        setConversions(conversionData);

        const methodCurrenciesMap = {};
        methodCurrenciesData.forEach(relation => {
          if (relation.paymentMethod) {
            methodCurrenciesMap[relation.paymentMethod._id] = {
              currencies: relation.currencies || [],
              isRestricted: relation.isRestricted
            };
          }
        });
        setPaymentMethodCurrencies(methodCurrenciesMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Simular progreso al cargar o al cambiar los items del carrito
  useEffect(() => {
    const simulateProgress = async () => {
      if (!cartItems.length) {
        setProgressSimulation(null);
        return;
      }
      
      setIsLoadingSimulation(true);
      try {
        const simulation = await simulatePurchaseProgress(cartItems);
        setProgressSimulation(simulation);
      } catch (error) {
        console.error("Error al simular progreso:", error);
      } finally {
        setIsLoadingSimulation(false);
      }
    };

    simulateProgress();
  }, [cartItems, selectedCurrency]);

  // Función para validar el cupón
  const handleCouponValidation = async (code) => {
    if (!code || !selectedCurrency) return;
    setIsValidatingCoupon(true);
    let response;
    let isRewardCoupon = false;
    try {
      // Intentar validar cupón normal
      try {
        response = await validateCupon(code, selectedCurrency._id);
      } catch (error) {
        console.error("Error en validación de cupón normal:", error);
      }
      // Si no es válido, intentar validar reward coupon
      if (!response || !response.isValid) {
        try {
          response = await validateRewardCoupon(code);
          if (response && response.isValid) {
            isRewardCoupon = true;
          }
        } catch (error) {
          console.error("Error en validación de reward coupon:", error);
        }
      }
      if (response && response.isValid) {
        // Creamos el objeto couponData con la información devuelta, incluyendo applicableTo
        const newCouponData = {
          code,
          type: response.type,
          rpType: response.rpType, // 'seguro', 'barato' o 'ambos'
          value: response.discountValue,
          _id: response._id || response.couponCode,
          isRewardCoupon: isRewardCoupon,
          rpPrice: response.rpPrice, // si es null, cupón sin filtro de precio
          maxApplicableSkins: response.rpPrice ? response.maxApplicableSkins : null,
          applicableTo: response.applicableTo || 'ambos'
        };
        
        // Si es un reward coupon con filtro (rpPrice definido), verificar que existan ítems elegibles
        if (newCouponData.isRewardCoupon && newCouponData.rpType) {
          let eligibleItems = cartItems.filter(item => {
            let typeMatches = false;
            if (newCouponData.rpType === "ambos") {
              typeMatches = true;
            } else if (newCouponData.rpType === "seguro" && item.isSeguroRP === true) {
              typeMatches = true;
            } else if (newCouponData.rpType === "barato" && item.isSeguroRP === false) {
              typeMatches = true;
            }

            let priceMatches = false;
            if(newCouponData.rpPrice) {
              // Para skins usamos priceRP o priceRPData; para otros, asumimos que el objeto priceRP posee _id
              if(item.itemType === 'Skin'){
                priceMatches = newCouponData.rpPrice
                  ? item.priceRP && item.priceRP.toString() === newCouponData.rpPrice.toString()
                  : true;
              } else {
                priceMatches = newCouponData.rpPrice
                  ? item.priceRP._id && item.priceRP._id.toString() === newCouponData.rpPrice.toString()
                  : true;
              }
            }else{
              priceMatches=true
            }

            return typeMatches && priceMatches;
          });

          // Filtrar según el campo applicableTo del cupón:
          // - Si es 'skins', solo aquellos con itemType === 'Skin'
          // - Si es 'items', solo aquellos con itemType === 'Item'
          if (newCouponData.applicableTo === 'skins') {
            eligibleItems = eligibleItems.filter(item => item.itemType === 'Skin');
          } else if (newCouponData.applicableTo === 'items') {
            eligibleItems = eligibleItems.filter(item => item.itemType === 'Item');
          }
          // Si no hay ítems elegibles, mostramos error
          if (eligibleItems.length === 0) {
            toast.error("No hay ítems en el carrito que cumplan con el RP, tipo y categoría requeridos");
            setIsValidatingCoupon(false);
            return false;
          }
          if (eligibleItems.length > parseInt(newCouponData.maxApplicableSkins, 10)) {
            // Si hay más ítems elegibles que el máximo permitido, abrimos el modal para que el usuario seleccione
            setEligibleCouponItems(eligibleItems);
            setShowCouponSelectionModal(true);
          } else {
            // Si la cantidad elegible es igual o menor al límite, aplicamos el descuento de forma automática a todos
            const updatedCart = cartItems.map(item => {
              if (eligibleItems.find(e => e._id === item._id && e.isSeguroRP === item.isSeguroRP)) {
                // En este caso, se aplica el descuento a tantas unidades como sea posible, hasta el límite
                return { ...item, selectedForCoupon: Math.min(item.quantity, parseInt(newCouponData.maxApplicableSkins, 10)) };
              }
              return { ...item, selectedForCoupon: 0 };
            });
            setCartItems(updatedCart);
          }
        }
        setCouponData(newCouponData);
        toast.success("Cupón aplicado correctamente");
        return true;
      }
      toast.error("Cupón inválido");
      return false;
    } catch (error) {
      console.error("Error al validar el cupón:", error);
      toast.error("Error al validar el cupón");
      return false;
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCouponSubmit = async (code) => {
    const isValid = await handleCouponValidation(code);
    if (!isValid) {
      form.setError("couponCode", {
        type: "manual",
        message: "Invalid coupon code"
      });
    }
  };

  const removeCoupon = () => {
    setCouponData(null);
    form.setValue("couponCode", "");
    const updatedCart = cartItems.map(item => ({
      ...item,
      selectedForCoupon: 0
    }));
    setCartItems(updatedCart);
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleFileChange = (e) => setReceiptFile(e.target.files[0]);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const data = {
        items: cartItems,
        paymentMethodId: values.paymentMethod,
        riotName: values.riotName,
        discordName: values.discordName,
        region: values.server,
        selectedCurrency: selectedCurrency._id,
        cupon: couponData?._id,
        couponType: couponData ? (couponData.isRewardCoupon ? "reward" : "normal") : null,
        file: receiptFile,
        // Enviamos los IDs de ítems a los que se aplicará el cupón; ahora cada ítem tendrá su cantidad (selectedForCoupon)
        couponItems: cartItems.filter(item => item.selectedForCoupon > 0).map(item => item._id)
      };
      await createPurchase(data);
      clearCart();
      handleNext();
    } catch (error) {
      console.error("Error creating purchase:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "0";
    const number = Math.round(Number(price));
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const unformatPrice = (formattedPrice) => {
    if (!formattedPrice) return 0;
    if (typeof formattedPrice === "number") return formattedPrice;
    const number = parseInt(formattedPrice.replace(/\./g, ""));
    return isNaN(number) ? 0 : number;
  };

  // Actualizamos calculateTotal para que, en caso de reward coupon con filtro (rpPrice definido),
  // se aplique el descuento sólo a la cantidad seleccionada en cada ítem.
  const calculateTotal = () => {
    if (!selectedCurrency || !cartItems.length) return 0;
    const totalWithDiscount = cartItems.reduce((total, item) => {
      const unitPrice = unformatPrice(item.priceConverted);
      const itemPrice = unitPrice * item.quantity;
      let discount = 0;
      if (!couponData) return total + itemPrice;
      // Caso 1: Reward coupon sin filtro de rpPrice: descuento aplicado a todos los ítems elegibles
      if (couponData.isRewardCoupon && !couponData.rpPrice) {
        let typeMatches = false;
        if (couponData.rpType === "ambos") {
          typeMatches = true;
        } else if (couponData.rpType === "seguro" && item.isSeguroRP === true) {
          typeMatches = true;
        } else if (couponData.rpType === "barato" && item.isSeguroRP === false) {
          typeMatches = true;
        }
        if (typeMatches) {
          discount = itemPrice * (couponData.value / 100);
        }
        return total + (itemPrice - discount);
      }
      // Caso 2: Reward coupon con filtro (rpPrice definido): descuento aplicado solo a la cantidad seleccionada
      if (couponData.isRewardCoupon && couponData.rpPrice) {
        const discountCount = (typeof item.selectedForCoupon === "number") ? item.selectedForCoupon : 0;
        discount = unitPrice * discountCount * (couponData.value / 100);
        return total + (itemPrice - discount);
      }
      // Caso 3: Cupón normal (puedes ajustar esta lógica según tus necesidades)
      if (couponData.rpType === "ambos") {
        const itemDiscount =
          couponData.type === "percent"
            ? itemPrice * (couponData.value / 100)
            : Math.min(couponData.value * (itemPrice / total), itemPrice);
        return total + (itemPrice - itemDiscount);
      }
      const isSeguroItem =
        item.isSeguroRP === true || item.handUpgrade === true;
      const isBaratoItem =
        item.isSeguroRP === false || item.handUpgrade === false;
      if (
        (couponData.rpType === "seguro" && isSeguroItem) ||
        (couponData.rpType === "barato" && isBaratoItem)
      ) {
        const itemDiscount =
          couponData.type === "percent"
            ? itemPrice * (couponData.value / 100)
            : Math.min(couponData.value * (itemPrice / total), itemPrice);
        return total + (itemPrice - itemDiscount);
      }
      return total + itemPrice;
    }, 0);
    return formatPrice(totalWithDiscount);
  };

  const getAvailablePaymentMethods = () => {
    if (!selectedCurrency) return [];
    return paymentMethods.filter(method => {
      const methodCurrency = paymentMethodCurrencies[method._id];
      if (!methodCurrency?.isRestricted) return true;
      return methodCurrency.currencies.some(
        currency => currency._id === selectedCurrency._id
      );
    }).filter(method => method.active);
  };

  // Componente para mostrar la información de progreso del usuario
  const ProgressInfo = () => {
    if (isLoadingSimulation) {
      return (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
          <p className="text-center text-sm">Calculando progreso...</p>
        </div>
      );
    }
    
    if (!progressSimulation) return null;
    
    return (
      <div className="mt-4 p-4 bg-primary/10 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Progreso de Usuario
        </h3>
        <div className="text-sm space-y-1">
          <p>XP a ganar: <span className="font-bold text-green-500">+{progressSimulation.earnedXp}</span></p>
          {progressSimulation.willRankUp ? (
            <>
              <div className="flex items-center gap-2 my-2">
                <span className="font-medium">Subirás de rango:</span>
                <div className="flex items-center gap-1">
                  {progressSimulation.currentRank?.imageUrl && (
                    <img 
                      src={progressSimulation.currentRank.imageUrl} 
                      alt={progressSimulation.currentRank.name}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="font-bold">{progressSimulation.currentRank?.name}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  {progressSimulation.newRank?.imageUrl && (
                    <img 
                      src={progressSimulation.newRank.imageUrl} 
                      alt={progressSimulation.newRank.name}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="font-bold text-primary">{progressSimulation.newRank?.name}</span>
                </div>
              </div>
              <p>Oro a recibir: <span className="font-bold text-yellow-500">+{progressSimulation.goldEarned}</span></p>
            </>
          ) : (
            <p>
              Rango actual: 
              <span className="font-bold ml-2">
                {progressSimulation.currentRank?.imageUrl && (
                  <img 
                    src={progressSimulation.currentRank.imageUrl} 
                    alt={progressSimulation.currentRank.name}
                    className="h-5 w-5 rounded-full inline-block mr-1"
                  />
                )}
                {progressSimulation.currentRank?.name}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <FormProvider {...form}>
      <TopNav />
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {step === 1
                ? "Tu Carrito"
                : step === 2
                ? "Detalles de Cuenta"
                : step === 3
                ? "Detalles del Pago"
                : "Confirmación de Compra"}
            </h1>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full ${step >= i ? "bg-primary" : "bg-gray-300"}`} />
              ))}
            </div>
          </div>

          <Card className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={`${item._id}-${item.isSeguroRP}`} className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img src={item.srcLocal || item.srcWeb} alt="" className="h-20 w-20 rounded-md object-cover" />
                      <div>
                        {item.isUnranked ? (
                          <div className="space-y-1">
                            <p className="font-medium">Cuenta {item.region}</p>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              <p>Nivel: {item.nivel}</p>
                              <span className={`text-xs ${item.handUpgrade ? 'text-emerald-500' : 'text-red-500'}`}>
                                {item.handUpgrade ? 'Cuenta Safe' : 'Cuenta Unsafe'}
                              </span>
                            </div>
                            <p className="text-sm">Cantidad: {item.quantity}</p>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium">{item.NombreSkin || item.name}</p>
                            <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                            {/* Mostrar el tipo de RP */}
                            <p className="text-xs font-bold">
                              {item.isSeguroRP === true ? (
                                <span className="text-emerald-500">RP SEGURO</span>
                              ) : item.isSeguroRP === false ? (
                                <span className="text-red-500">RP BARATO</span>
                              ) : null}
                            </p>
                            {item.isSkin && <p className="text-xs text-muted-foreground">Skin</p>}
                          </>
                        )}                  
                      </div>
                    </div>
                    <p className="font-medium">
                      {item.selectedForCoupon && couponData && couponData.value ? (
                        <>
                          {selectedCurrency?.symbol}{formatPrice(
                            (unformatPrice(item.priceConverted) * item.quantity) -
                            (unformatPrice(item.priceConverted) * item.selectedForCoupon * (couponData.value / 100))
                          )}
                          <span className="ml-2 text-sm font-bold text-green-600">
                            ({couponData.value}% OFF en {item.selectedForCoupon} unidad/es)
                          </span>
                          <br />
                          <span className="line-through text-sm text-gray-500">
                            {selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}
                          </span>
                        </>
                      ) : (
                        <>
                          {selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}
                        </>
                      )}
                    </p>
                  </div>
                ))}

                {/* Información de progreso en el primer paso */}
                <ProgressInfo />

                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-4">
                    <p className="font-medium">Subtotal</p>
                    <p className="font-medium">
                      {selectedCurrency?.symbol}{calculateTotal()}
                    </p>
                  </div>

                  {!couponData ? (
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="couponCode"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input placeholder="Enter coupon code" {...field} disabled={isValidatingCoupon} />
                              </FormControl>
                              <Button onClick={() => handleCouponSubmit(field.value)} disabled={!field.value || isValidatingCoupon}>
                                Apply
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <Alert className="mb-4">
                      <div className="flex justify-between items-center">
                        <AlertDescription className="flex gap-1">
                          Cupón <p className="font-bold">{couponData.code}</p> Aplicado:{" "}
                          {couponData.type === "percent" ? (
                            <span className="flex gap-1">
                              <p className="text-green-400">{couponData.value}% OFF</p>
                              {couponData.isRewardCoupon ? (
                                <p>Reward Coupon</p>
                              ) : (
                                couponData.rpType !== "ambos" && (
                                  <p>en RP {couponData.rpType === "seguro" ? "Safe" : "Unsafe"}</p>
                                )
                              )}
                            </span>
                          ) : (
                            <span className="flex gap-1">
                              <p className="text-green-400">
                                {selectedCurrency?.symbol}{couponData.value} OFF
                              </p>
                              {couponData.isRewardCoupon ? (
                                <p>Reward Coupon</p>
                              ) : (
                                couponData.rpType !== "ambos" && (
                                  <p>en RP {couponData.rpType === "seguro" ? "Safe" : "Unsafe"}</p>
                                )
                              )}
                            </span>
                          )}
                        </AlertDescription>
                        <Button variant="ghost" size="sm" onClick={removeCoupon}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Alert>
                  )}

                  <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                    <p>Total</p>
                    <p>
                      {selectedCurrency?.symbol}{calculateTotal()}
                    </p>
                  </div>
                </div>

                <Button className="w-full" onClick={handleNext} disabled={cartItems.length === 0}>
                  Continuar a detalles de la cuenta
                </Button>
              </div>
            )}

            {step === 2 && (
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="riotName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Riot Name</FormLabel>
                        <FormControl>
                          <Input required placeholder="Enter your Riot name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discordName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord Name</FormLabel>
                        <FormControl>
                          <Input required placeholder="Enter your Discord name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="server"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Server</FormLabel>
                        <Select {...field} required onValueChange={field.onChange} defaultValue={field.value} aria-invalid={form.formState.errors.server ? "true" : "false"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your server" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem className="bg-black text-white" value="LAS">LAS</SelectItem>
                            <SelectItem className="bg-black text-white" value="LAN">LAN</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Información de progreso en el segundo paso */}
                  <ProgressInfo />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={async (e) => {
                      const isValid = await form.trigger(["riotName", "discordName", "server"]);
                      if (isValid) {
                        handleNext();
                      } else {
                        e.preventDefault();
                      }
                    }}>
                      Continuar al pago
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Divisa</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        updateSelectedCurrency(currencies.find(c => c._id === value));
                      }} value={selectedCurrency._id}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem className="bg-black text-white" key={currency._id} value={currency._id}>
                              {currency.name} ({currency.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metodo de Pago</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCurrency}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailablePaymentMethods().map(method => (
                            <SelectItem className="bg-black text-white" key={method._id} value={method._id}>
                              {method.method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Información de progreso en el tercer paso */}
                <ProgressInfo />

                <div className="pt-4">
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={async (e) => {
                      const isValid = await form.trigger(["paymentMethod"]);
                      if (isValid && selectedCurrency) {
                        handleNext();
                      } else {
                        e.preventDefault();
                      }
                    }}>
                      Continuar a la confirmacion
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <Form {...form}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const values = {
                    riotName: form.getValues().riotName,
                    discordName: form.getValues().discordName,
                    server: form.getValues().server,
                    paymentMethod: form.getValues().paymentMethod,
                  };
                  onSubmit(values);
                }}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Resumen del Pedido</h2>
                      <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                        <div className="mb-6 border-b border-border/20 pb-4">
                          <h3 className="text-lg font-semibold mb-3">Detalles de Pago</h3>
                          <div className="flex gap-2">
                            <p className="font-bold">Metodo de Pago: </p>
                            <p>{paymentMethods.find(p => p._id === form.getValues().paymentMethod)?.method}</p>
                          </div>
                          {paymentMethods.find(p => p._id === form.getValues().paymentMethod)?.details.map((detail, index) => (
                            <div key={index} className="mb-3 last:mb-0 flex gap-2">
                              <p className="font-medium text-primary">{detail.title}</p>
                              <p className="text-medium text-green-600 whitespace-pre-line">
                                {detail.description}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p>Riot Name: {form.getValues().riotName}</p>
                        <p>Discord Name: {form.getValues().discordName}</p>
                        <p>Server: {form.getValues().server}</p>
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="font-medium mb-2">Items</h3>
                          {cartItems.map(item => (
                            <div key={`${item._id}-${item.isSeguroRP}`} className="flex flex-col border-b border-border/20 py-2">
                              <div className="flex justify-between">
                                <span>{item.isUnranked ? `Cuenta ${item.region}` : (item.NombreSkin || item.name)} x {item.quantity}</span>
                                <span>{selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}</span>
                              </div>
                              {item.selectedForCoupon > 0 && couponData && couponData.value && (
                                <div className="mt-1 flex flex-col">
                                  <span className="text-sm font-bold text-green-600">
                                    {couponData.value}% OFF en {item.selectedForCoupon} unidad/es
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="line-through text-sm text-gray-500">
                                      {selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}
                                    </span>
                                    <span className="text-sm font-bold text-green-600">
                                      {selectedCurrency?.symbol}{formatPrice(
                                        (unformatPrice(item.priceConverted) * item.quantity) - (unformatPrice(item.priceConverted) * item.selectedForCoupon * (couponData.value / 100))
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Información de progreso en el cuarto paso */}
                        <ProgressInfo />

                        <div className="mt-4 pt-4 border-t">
                          <h2 className="text-xl font-bold mb-2">Cargar Comprobante</h2>
                          <p className="text-sm text-muted-foreground mb-2">
                            Por favor, sube una captura o foto del comprobante de pago
                          </p>
                          <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="mb-4" />
                        </div>
                        <div className="mt-4 p-3 bg-yellow-500/10 rounded-md flex gap-2 justify-center items-center">
                            <ScrollText className="h-12 w-12 text-yellow-500"/>
                            <p className="text-sm text-yellow-500">
                            El comprobante no garantiza que el pago haya sido recibido. Este mismo nos permite buscar en nuestro sistema si fue realizado. La verificación es manual, por lo que se comprobará si los datos concuerdan con el pago.
                            </p>
                          </div>
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>{selectedCurrency?.symbol}{calculateTotal()}</span>
                          </div>
                        </div>
                        {couponData && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Cupón aplicado: {couponData.code} (
                            {couponData.type === "percent"
                              ? `${couponData.value}% descuento`
                              : `${selectedCurrency?.symbol}${couponData.value} descuento`}
                            )
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack}>Atrás</Button>
                        <Button type="submit" disabled={!receiptFile || isSubmitting}>
                          {isSubmitting ? "Procesando..." : "Completar Compra"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            )}
            {step === 5 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="bg-green-500 text-white p-6 rounded-full">
                    <CheckCircleIcon className="h-16 w-16" />
                  </div>
                </div>
                <p className="text-xl font-semibold">Compra completada correctamente</p>
                <p className="text-sm text-muted-foreground">Ahora solo debes esperar la verificación del pago</p>
                <Button className="mt-4" onClick={() => window.location.href = '/perfil'}>
                  Ir a mi perfil
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal para la selección de unidades para aplicar el reward coupon */}
      {showCouponSelectionModal && (
        <CouponSkinsSelectionModal
          isOpen={showCouponSelectionModal}
          onClose={() => setShowCouponSelectionModal(false)}
          eligibleSkins={eligibleCouponItems}
          maxAllowed={parseInt(couponData.maxApplicableSkins, 10)}
          onSelect={(selectedCounts) => {
            // Para cada ítem del carrito, asignamos la cantidad de unidades a las que se aplicará el descuento
            const updatedCart = cartItems.map(item => {
              const compositeKey = `${item._id}-${item.isSeguroRP}`;
              const count = selectedCounts[compositeKey] || 0;
              return { ...item, selectedForCoupon: count };
            });
            setCartItems(updatedCart);
          }}
        />
      )}
    </FormProvider>
  );
}