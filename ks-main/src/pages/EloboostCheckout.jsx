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
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, CheckCircleIcon, Shield, AlertTriangle, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TopNav } from "@/components/TopNav";
import ChampionIcon from "@/components/ChampionIcon";
import { useCurrency } from "../context/currencyContext.jsx";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

// Importar servicios
import { getAllCurrencies } from "../services/currencyService.js";
import { getAllPaymentMethods } from "../services/payMethodService.js";
import { getAllPaymentMethodCurrencies } from "../services/paymentMethodCurrencyService.js";
import { createPurchase } from "../services/purcharseService.js";
import { getEloBoostOrderById, updateAccountDetails, createEloBoostOrder } from "../services/eloBoostService.js";

// Esquema de validación del formulario
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
  accountUsername: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  accountPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export default function EloboostCheckout() {
  const [step, setStep] = useState(1);
  // console.log("EloboostCheckout renderizado - Step actual:", step);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodCurrencies, setPaymentMethodCurrencies] = useState({});
  const [receiptFile, setReceiptFile] = useState(null);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { selectedCurrency, updateSelectedCurrency } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();

  const [boostData, setBoostData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // Intentar obtener los datos de la sesión
  useEffect(() => {
    const sessionData = sessionStorage.getItem('eloBoostData');
    if (!sessionData) {
      toast.error("No se encontraron datos para el proceso de EloBoost");
      navigate('/');
      return;
    }
    try {
      const parsedData = JSON.parse(sessionData);
      setBoostData(parsedData);
    } catch (error) {
      console.error("Error parsing boost data:", error);
      toast.error("Error al procesar los datos del boost");
      navigate('/');
    }
  }, [navigate]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riotName: "",
      discordName: "",
      server: "",
      paymentMethod: "",
      currency: "",
      accountUsername: "",
      accountPassword: "",
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          currencyData,
          paymentMethodData,
          methodCurrenciesData
        ] = await Promise.all([
          getAllCurrencies(),
          getAllPaymentMethods(),
          getAllPaymentMethodCurrencies()
        ]);
        
        setCurrencies(currencyData);
        setPaymentMethods(paymentMethodData);

        // Si tenemos orderId, cargar detalles de la orden
        if (orderId) {
          const orderDetails = await getEloBoostOrderById(orderId);
          setOrderData(orderDetails);
        } else if (boostData) {
          // Si no hay orderId pero tenemos boostData, usarlo para mostrar resumen
          setOrderData({
            currentRank: {
              rank: { name: boostData.displayData?.currentRankName || '' },
              division: boostData.currentDivision
            },
            targetRank: {
              rank: { name: boostData.displayData?.targetRankName || '' },
              division: boostData.targetDivision
            },
            specificRole: boostData.specificRole,
            specificRoleValue: boostData.specificRoleValue,
            specificChampion: {
              selected: boostData.specificChampion,
              name: boostData.displayData?.championName || ''
            },
            duoQueue: boostData.duoQueue,
            // Datos de RP
            baseRPPrice: boostData.baseRPPrice || 0,
            totalRPPrice: boostData.totalRPPrice || 0,
            additionalRPCost: boostData.additionalRPCost || 0,
            // Datos de precio convertido
            totalPrice: boostData.totalPrice,
            currency: {
              symbol: boostData.displayData?.currencySymbol || '$',
              name: boostData.displayData?.currencyName || 'USD'
            }
          });
        }

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
        
        // Si hay una moneda predeterminada, seleccionarla
        if (currencyData.length > 0 && !selectedCurrency._id) {
          updateSelectedCurrency(currencyData[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    if (boostData) {
      fetchData();
    }
  }, [boostData, orderId, selectedCurrency._id, updateSelectedCurrency]);

  const handleNext = () => {
    // Si estamos en el paso 1 y es duo queue, saltar al paso 3
    if (step === 1 && boostData?.duoQueue) {
      setStep(3);
    } else {
      setStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    // Si estamos en el paso 3 y es duo queue, volver al paso 1
    if (step === 3 && boostData?.duoQueue) {
      setStep(1);
    } else {
      setStep(prev => prev - 1);
    }
  };
  const handleFileChange = (e) => setReceiptFile(e.target.files[0]);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Si estamos en el paso 1, crear la orden con los datos básicos
      if (step === 1) {
        // Verificar que el servidor esté seleccionado
        if (!form.getValues("server")) {
          toast.error("Por favor selecciona un servidor");
          setIsSubmitting(false);
          return;
        }
        
        // Guardar datos del formulario para usarlos más adelante
        sessionStorage.setItem('eloBoostFormData', JSON.stringify({
          riotName: values.riotName,
          discordName: values.discordName,
          server: form.getValues("server")
        }));
        handleNext();
        return;
      }
      
      // Si estamos en el paso 2, guardamos credenciales temporalmente
      if (step === 2) {
        sessionStorage.setItem('eloBoostAccountDetails', JSON.stringify({
          username: values.accountUsername,
          password: values.accountPassword
        }));
        handleNext();
        return;
      }

      // Si estamos en el paso 3, guardamos los datos de pago
      if (step === 3) {
        // Verificar método de pago
        const paymentMethodValue = form.getValues("paymentMethod");
        if (!paymentMethodValue) {
          toast.error("Por favor selecciona un método de pago.");
          setIsSubmitting(false);
          return;
        }
        
        if (!selectedCurrency || !selectedCurrency._id) {
          toast.error("Por favor selecciona una moneda.");
          setIsSubmitting(false);
          return;
        }
        
        sessionStorage.setItem('eloBoostPaymentDetails', JSON.stringify({
          paymentMethod: paymentMethodValue,
          currencyId: selectedCurrency._id
        }));
        
        handleNext();
        return;
      }

      // Si estamos en el paso 4 (final), crear todo junto
      if (step === 4) {
        if (!receiptFile) {
          toast.error("Por favor sube un comprobante de pago.");
          return;
        }
        
        // Recuperar todos los datos guardados
        const formData = JSON.parse(sessionStorage.getItem('eloBoostFormData') || '{}');
        const accountDetails = JSON.parse(sessionStorage.getItem('eloBoostAccountDetails') || '{}');
        const paymentDetails = JSON.parse(sessionStorage.getItem('eloBoostPaymentDetails') || '{}');
        
        // Obtener token
        const token = localStorage.getItem("token");
        
        // 1. Primero crear la orden de boost
        // console.log("Creando orden de EloBoost con los datos recopilados");
        const orderResponse = await createEloBoostOrder({
          ...boostData,
          userId: JSON.parse(localStorage.getItem("user"))._id
        }, token || '');
        
        const newOrderId = orderResponse.order._id;
        setOrderId(newOrderId);
        
        // 2. Actualizar con detalles de la cuenta SOLO si no es duo queue
        if (!boostData?.duoQueue) {
          await updateAccountDetails(newOrderId, {
            username: accountDetails.username,
            password: accountDetails.password
          });
        }
        
        // 3. Finalmente crear la compra
        const purchaseData = {
          orderId: newOrderId,
          paymentMethodId: paymentDetails.paymentMethod,
          riotName: formData.riotName,
          discordName: formData.discordName,
          region: formData.server,
          selectedCurrency: paymentDetails.currencyId,
          file: receiptFile,
          orderType: 'eloboost'
        };
        
        await createPurchase(purchaseData);
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('eloBoostData');
        sessionStorage.removeItem('eloBoostFormData');
        sessionStorage.removeItem('eloBoostAccountDetails');
        sessionStorage.removeItem('eloBoostPaymentDetails');
        
        handleNext();
      }
    } catch (error) {
      console.error("Error en el proceso:", error);
      
      // Mostrar un mensaje de error más descriptivo basado en el error
      let errorMessage = "Error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde.";
      
      if (error.response) {
        // Si hay una respuesta del servidor con mensaje de error
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 404) {
          errorMessage = "No se pudo encontrar la orden de EloBoost. Por favor, verifica e intenta nuevamente.";
        } else if (error.response.status === 400) {
          errorMessage = "Datos inválidos. Por favor, verifica toda la información e intenta nuevamente.";
        } else if (error.response.status === 401) {
          errorMessage = "No tienes autorización para realizar esta acción. Por favor, inicia sesión nuevamente.";
        }
      } else if (error.message) {
        // Si el error tiene un mensaje específico
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Si hay un error específico al crear la compra, podríamos ofrecer intentarlo de nuevo
      if (step === 4) {
        // Añadir botón de retry en el toast
        toast.error(
          <div>
            <p>{errorMessage}</p>
            <button 
              className="bg-primary text-white px-3 py-1 rounded-md mt-2"
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              Intentar nuevamente
            </button>
          </div>,
          { autoClose: false }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "0";
    const number = Math.round(Number(price));
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <p>Cargando datos del proceso...</p>
        </div>
      </div>
    );
  }

  if (!boostData) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <p>No se encontraron datos para el proceso de EloBoost.</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <TopNav />
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {step === 1
                ? "Detalles de Cuenta"
                : step === 2 && !boostData?.duoQueue
                ? "Credenciales de Cuenta"
                : step === 3
                ? "Detalles del Pago"
                : "Confirmación de Compra"}
            </h1>
            <div className="flex justify-center space-x-4 mb-8">
              {boostData?.duoQueue ? (
                // Para duo queue, solo mostrar 3 puntos
                [1, 3, 4].map((i, index) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full ${
                      step === 1 && index === 0 ? "bg-primary" :
                      step === 3 && index <= 1 ? "bg-primary" :
                      step === 4 ? "bg-primary" :
                      "bg-gray-300"
                    }`} 
                  />
                ))
              ) : (
                // Para boost regular, mostrar 4 puntos
                [1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full ${step >= i ? "bg-primary" : "bg-gray-300"}`} />
                ))
              )}
            </div>
          </div>

          <Card className="p-6">
            {step === 1 && (
              <Form {...form}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    // console.log("Formulario paso 1 enviado");
                    
                    const formData = {
                      riotName: form.getValues("riotName"),
                      discordName: form.getValues("discordName"),
                      server: form.getValues("server"),
                    };
                    
                    // console.log("Datos del formulario:", formData);
                    
                    // Validar manualmente
                    let hasErrors = false;
                    
                    if (!formData.riotName || formData.riotName.length < 3 || !formData.riotName.includes("#")) {
                      // console.log("Error en Riot Name");
                      toast.error("Por favor ingresa un Riot Name válido (incluyendo #)");
                      hasErrors = true;
                    }
                    
                    if (!formData.discordName || formData.discordName.length < 3) {
                      // console.log("Error en Discord Name");
                      toast.error("Por favor ingresa un Discord Name válido");
                      hasErrors = true;
                    }
                    
                    if (!formData.server) {
                      // console.log("Error en Server");
                      toast.error("Por favor selecciona un servidor");
                      hasErrors = true;
                    }
                    
                    if (hasErrors) {
                      // console.log("Hay errores en el formulario");
                      return;
                    }
                    
                    // Guardar datos y avanzar
                    // console.log("Guardando datos en sessionStorage");
                    sessionStorage.setItem('eloBoostFormData', JSON.stringify(formData));
                    // console.log("Avanzando al siguiente paso");
                    handleNext();
                  }} 
                  className="space-y-4"
                >
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
                  <div className="space-y-2">
                    <label htmlFor="server" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Server
                    </label>
                    <select 
                      id="server"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-black px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={form.watch("server") || ""}
                      onChange={(e) => {
                        // console.log("Cambio de servidor:", e.target.value);
                        form.setValue("server", e.target.value);
                      }}
                      required
                    >
                      <option value="" disabled>Select your server</option>
                      <option value="LAS">LAS</option>
                      <option value="LAN">LAN</option>
                      <option value="NA">NA</option>
                      <option value="EUW">EUW</option>
                      <option value="EUNE">EUNE</option>
                      <option value="BR">BR</option>
                    </select>
                    {form.formState.errors.server && (
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.server.message}</p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/eloboost')}>Cancelar</Button>
                    <Button type="submit">
                      Continuar
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 2 && !boostData?.duoQueue && (
              <Form {...form}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    // console.log("Formulario paso 2 enviado");
                    
                    const accountData = {
                      username: form.getValues("accountUsername"),
                      password: form.getValues("accountPassword"),
                    };
                    
                    // console.log("Datos de cuenta:", accountData);
                    
                    // Validar manualmente
                    let hasErrors = false;
                    
                    if (!accountData.username || accountData.username.length < 3) {
                      // console.log("Error en Usuario");
                      toast.error("Por favor ingresa un usuario válido");
                      hasErrors = true;
                    }
                    
                    if (!accountData.password || accountData.password.length < 6) {
                      // console.log("Error en Contraseña");
                      toast.error("La contraseña debe tener al menos 6 caracteres");
                      hasErrors = true;
                    }
                    
                    if (hasErrors) {
                      // console.log("Hay errores en el formulario");
                      return;
                    }
                    
                    // Guardar datos y avanzar
                    // console.log("Guardando credenciales en sessionStorage");
                    sessionStorage.setItem('eloBoostAccountDetails', JSON.stringify(accountData));
                    // console.log("Avanzando al siguiente paso");
                    handleNext();
                  }}
                  className="space-y-4"
                >
                  <div className="bg-yellow-500/10 p-4 rounded-lg mb-4 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-500">
                        <strong>Información importante:</strong> Necesitamos las credenciales de tu cuenta para que nuestros boosters puedan realizar el servicio. Tus datos están seguros y encriptados.
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg mb-4 flex items-start gap-2">
                    <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm">
                        <strong>Seguridad garantizada:</strong> Tu información se almacena de forma segura y encriptada. Nuestros boosters son profesionales verificados con años de experiencia.
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="accountUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuario de la cuenta</FormLabel>
                        <FormControl>
                          <Input 
                            required 
                            placeholder="Usuario de tu cuenta de LoL" 
                            {...field} 
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña de la cuenta</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              required 
                              placeholder="Contraseña de tu cuenta de LoL" 
                              {...field} 
                              type={showAccountPassword ? "text" : "password"}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowAccountPassword(!showAccountPassword)}
                              tabIndex="-1"
                            >
                              {showAccountPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack}>Atrás</Button>
                    <Button type="submit">
                      Continuar al pago
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 3 && (
              <Form {...form}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    // console.log("Formulario paso 3 enviado");
                    
                    // console.log("Divisa seleccionada:", selectedCurrency);
                    // console.log("Método de pago:", form.getValues("paymentMethod"));
                    
                    // Validar manualmente
                    let hasErrors = false;
                    
                    if (!selectedCurrency || !selectedCurrency._id) {
                      // console.log("Error en Divisa");
                      toast.error("Por favor selecciona una divisa");
                      hasErrors = true;
                    }
                    
                    if (!form.getValues("paymentMethod")) {
                      // console.log("Error en Método de Pago");
                      toast.error("Por favor selecciona un método de pago");
                      hasErrors = true;
                    }
                    
                    if (hasErrors) {
                      // console.log("Hay errores en el formulario");
                      return;
                    }
                    
                    // Guardar datos y avanzar
                    // console.log("Guardando datos de pago en sessionStorage");
                    sessionStorage.setItem('eloBoostPaymentDetails', JSON.stringify({
                      paymentMethod: form.getValues("paymentMethod"),
                      currencyId: selectedCurrency._id
                    }));
                    // console.log("Avanzando al siguiente paso");
                    handleNext();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Divisa
                    </label>
                    <select 
                      id="currency"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-black px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={selectedCurrency._id || ""}
                      onChange={(e) => {
                        // console.log("Cambio de divisa:", e.target.value);
                        form.setValue("currency", e.target.value);
                        updateSelectedCurrency(currencies.find(c => c._id === e.target.value));
                      }}
                      required
                    >
                      <option value="" disabled>Selecciona una divisa</option>
                      {currencies.map(currency => (
                        <option key={currency._id} value={currency._id}>
                          {currency.name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.currency && (
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.currency.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="paymentMethod" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Método de Pago
                    </label>
                    <select 
                      id="paymentMethod"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-black px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={form.watch("paymentMethod") || ""}
                      onChange={(e) => {
                        // console.log("Cambio de método de pago:", e.target.value);
                        form.setValue("paymentMethod", e.target.value);
                      }}
                      disabled={!selectedCurrency}
                      required
                    >
                      <option value="" disabled>Selecciona un método de pago</option>
                      {getAvailablePaymentMethods().map(method => (
                        <option key={method._id} value={method._id}>
                          {method.method}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.paymentMethod.message}</p>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Resumen del Servicio</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>ELO Boost:</span>
                        <span>
                          {orderData.currentRank?.rank?.name} {orderData.currentRank?.division} → {orderData.targetRank?.rank?.name} {orderData.targetRank?.division}
                        </span>
                      </div>
                      {orderData.specificRole && (
                        <div className="flex justify-between">
                          <span>Rol específico:</span>
                          <span>{orderData.specificRoleValue}</span>
                        </div>
                      )}
                      {orderData.specificChampion && (
                        <div className="flex justify-between">
                          <span>Campeón específico:</span>
                          <span>{orderData.specificChampion.name}</span>
                        </div>
                      )}
                      {orderData.duoQueue && (
                        <div className="flex justify-between">
                          <span>Duo Queue:</span>
                          <span>Sí</span>
                        </div>
                      )}
                      <div className="pt-4 mt-2 border-t border-border/20">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Precio en RP:</span>
                          <span>{orderData.totalRPPrice?.toLocaleString() || '0'} RP</span>
                        </div>
                        <div className="flex justify-between font-bold mt-1">
                          <span>Total:</span>
                          <span>{selectedCurrency?.symbol}{formatPrice(orderData.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={handleBack}>Atrás</Button>
                      <Button 
                        type="submit"
                      >
                        Continuar a la confirmación
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}

            {step === 4 && (
              <Form {...form}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    // console.log("Formulario paso 4 enviado");
                    
                    if (!receiptFile) {
                      // console.log("Error: No hay comprobante de pago");
                      toast.error("Por favor sube un comprobante de pago");
                      return;
                    }
                    
                    setIsSubmitting(true);
                    
                    // Recuperar todos los datos guardados
                    const formData = JSON.parse(sessionStorage.getItem('eloBoostFormData') || '{}');
                    const accountDetails = JSON.parse(sessionStorage.getItem('eloBoostAccountDetails') || '{}');
                    const paymentDetails = JSON.parse(sessionStorage.getItem('eloBoostPaymentDetails') || '{}');
                    
                    // console.log("Datos de formulario:", formData);
                    // console.log("Detalles de cuenta:", accountDetails);
                    // console.log("Detalles de pago:", paymentDetails);
                    
                    // Proceso de creación de orden y compra
                    const completeProcess = async () => {
                      try {
                        // console.log("Creando orden de EloBoost con los datos recopilados");
                        const token = localStorage.getItem("token");
                        
                        // 1. Primero crear la orden de boost
                        const orderResponse = await createEloBoostOrder({
                          // Datos básicos
                          ...boostData,
                          // Datos de usuario
                          userId: JSON.parse(localStorage.getItem("user"))._id,
                          // Asegurar que los datos de RP y moneda estén incluidos
                          baseRPPrice: boostData.baseRPPrice,
                          totalRPPrice: boostData.totalRPPrice,
                          additionalRPCost: boostData.additionalRPCost,
                          basePrice: boostData.basePrice,
                          totalPrice: boostData.totalPrice,
                          additionalCost: boostData.additionalCost,
                          currencyId: paymentDetails.currencyId // Usar la moneda seleccionada
                        }, token || '');
                        
                        const newOrderId = orderResponse.order._id;
                        setOrderId(newOrderId);
                        // console.log("Orden creada con ID:", newOrderId);
                        
                        // 2. Actualizar con detalles de la cuenta SOLO si no es duo queue
                        if (!boostData?.duoQueue) {
                          // console.log("Actualizando detalles de cuenta");
                          await updateAccountDetails(newOrderId, {
                            username: accountDetails.username,
                            password: accountDetails.password
                          });
                        } else {
                          // console.log("Saltando actualización de detalles de cuenta (duo queue)");
                        }
                        
                        // 3. Finalmente crear la compra
                        // console.log("Creando compra");
                        const purchaseData = {
                          orderId: newOrderId,
                          paymentMethodId: paymentDetails.paymentMethod,
                          riotName: formData.riotName,
                          discordName: formData.discordName,
                          region: formData.server,
                          selectedCurrency: paymentDetails.currencyId,
                          file: receiptFile,
                          orderType: 'eloboost'
                        };
                        
                        await createPurchase(purchaseData);
                        
                        // Limpiar sessionStorage
                        // console.log("Limpiando datos de sesión");
                        sessionStorage.removeItem('eloBoostData');
                        sessionStorage.removeItem('eloBoostFormData');
                        sessionStorage.removeItem('eloBoostAccountDetails');
                        sessionStorage.removeItem('eloBoostPaymentDetails');
                        
                        // console.log("Proceso completado con éxito");
                        // console.log("Estado actual:", step);
                        handleNext();
                        // console.log("Próximo paso después de handleNext:", step + 1);
                      } catch (error) {
                        console.error("Error en el proceso:", error);
                        setIsSubmitting(false);
                        
                        // Mostrar un mensaje de error más descriptivo basado en el error
                        let errorMessage = "Error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde.";
                        
                        if (error.response) {
                          // Si hay una respuesta del servidor con mensaje de error
                          if (error.response.data && error.response.data.message) {
                            errorMessage = error.response.data.message;
                          } else if (error.response.data && error.response.data.error) {
                            errorMessage = error.response.data.error;
                          } else if (error.response.status === 404) {
                            errorMessage = "No se pudo encontrar la orden de EloBoost. Por favor, verifica e intenta nuevamente.";
                          } else if (error.response.status === 400) {
                            errorMessage = "Datos inválidos. Por favor, verifica toda la información e intenta nuevamente.";
                          } else if (error.response.status === 401) {
                            errorMessage = "No tienes autorización para realizar esta acción. Por favor, inicia sesión nuevamente.";
                          }
                        } else if (error.message) {
                          // Si el error tiene un mensaje específico
                          errorMessage = error.message;
                        }
                        
                        toast.error(errorMessage);
                        
                        // Añadir botón de retry en el toast
                        toast.error(
                          <div>
                            <p>{errorMessage}</p>
                            <button 
                              className="bg-primary text-white px-3 py-1 rounded-md mt-2"
                              onClick={completeProcess}
                            >
                              Intentar nuevamente
                            </button>
                          </div>,
                          { autoClose: false }
                        );
                      } finally {
                        setIsSubmitting(false);
                      }
                    };
                    
                    await completeProcess();
                  }} 
                  className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Resumen del Pedido</h2>
                    <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                      <div className="mb-6 border-b border-border/20 pb-4">
                        <h3 className="text-lg font-semibold mb-3">Detalles de Pago</h3>
                        <div className="flex gap-2">
                          <p className="font-bold">Método de Pago: </p>
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
                      
                      <div className="mb-6 border-b border-border/20 pb-4">
                        <h3 className="text-lg font-semibold mb-3">Detalles de la Cuenta</h3>
                        <p>Riot Name: {form.getValues().riotName}</p>
                        <p>Discord Name: {form.getValues().discordName}</p>
                        <p>Server: {form.getValues().server}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <LockKeyhole className="h-4 w-4 text-green-500" />
                          <p className="text-sm text-green-500">Las credenciales de tu cuenta están guardadas de forma segura</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Detalles del Servicio</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>ELO Boost:</span>
                            <span>
                              {orderData.currentRank?.rank?.name} {orderData.currentRank?.division} → {orderData.targetRank?.rank?.name} {orderData.targetRank?.division}
                            </span>
                          </div>
                          {orderData.specificRole && (
                            <div className="flex justify-between">
                              <span>Rol específico:</span>
                              <span>{orderData.specificRoleValue}</span>
                            </div>
                          )}
                          {orderData.specificChampion && (
                            <div className="flex justify-between items-center">
                              <span>Campeón específico:</span>
                              <span className="flex items-center">
                                <ChampionIcon 
                                  championName={orderData.specificChampion.name} 
                                  size={20} 
                                  className="mr-2"
                                />
                                {orderData.specificChampion.name}
                              </span>
                            </div>
                          )}
                          {orderData.duoQueue && (
                            <div className="flex justify-between">
                              <span>Duo Queue:</span>
                              <span>Sí</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <h2 className="text-xl font-bold mb-2">Cargar Comprobante</h2>
                        <p className="text-sm text-muted-foreground mb-2">
                          Por favor, sube una captura o foto del comprobante de pago
                        </p>
                        <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="mb-4" required />
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-500/10 rounded-md flex gap-2 justify-center items-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-500"/>
                        <p className="text-sm text-yellow-500">
                          El comprobante no garantiza que el pago haya sido recibido. Este mismo nos permite buscar en nuestro sistema si fue realizado. La verificación es manual, por lo que se comprobará si los datos concuerdan con el pago.
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>{selectedCurrency?.symbol}{formatPrice(orderData.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handleBack}>Atrás</Button>
                      <Button 
                        type="submit" 
                        disabled={!receiptFile || isSubmitting}
                      >
                        {isSubmitting ? "Procesando..." : "Completar Compra"}
                      </Button>
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
                <p className="text-xl font-semibold">¡Compra completada correctamente!</p>
                <p className="text-sm text-muted-foreground">
                  Gracias por tu compra. Hemos registrado tus datos de cuenta de forma segura y ahora solo debes esperar 
                  la verificación del pago. Una vez verificado, nuestro equipo de boosters comenzará a trabajar en tu pedido.
                </p>
                <Button className="mt-4" onClick={() => navigate('/perfil')}>
                  Ir a mi perfil
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}