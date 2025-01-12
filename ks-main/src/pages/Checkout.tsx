import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Wallet, MessageSquare, Server, Globe, ShoppingCart, X, CheckCircleIcon } from "lucide-react"
import { useForm  , FormProvider} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {TopNav} from '@/components/TopNav'
import {useCurrency} from '../context/currencyContext.jsx'

// Import services
import { getAllRpPrice } from "../services/rpService"
import { getAllCurrencies } from "../services/currencyService"
import { getAllPaymentMethods } from "../services/payMethodService"
import { getAllRPPriceConversions } from "../services/rpConvertionService"
import { getAllPaymentMethodCurrencies } from "../services/paymentMethodCurrencyService"
import { createPurchase } from "../services/purcharseService"
import { validateCupon } from "../services/cuponServices"
import {useStore} from '../context/StoreContext.jsx'

// Form validation schema
const formSchema = z.object({
  riotName: z.string()
  .min(3, "El Riot Name debe tener al menos 3 caracteres")
  .refine((value) => {
    if (!value.includes('#')) return false;
    const [name, tag] = value.split('#');
    if (!name || name.trim() === '') return false;
    if (!tag || tag.length < 3 || tag.length > 5) return false;
    return true;
  }, { message: "Tu Riot Name debe incluir un # seguido de 3 a 5 caracteres detras" }),
  discordName: z.string().min(3, "Tu Nombre de discord debe tener al menos 3 caracteres"),
  server: z.string().min(1, "Por favor selecciona un servidor"),
  paymentMethod: z.string().min(1, "Por favor selecciona un metodo de pago"),
  currency: z.string().min(1, "Por favor selecciona una divisa"),
  couponCode: z.string().optional()
})

export default function Checkout() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { cart, removeFromCart ,clearCart} = useStore();
  const [cartItems, setCartItems] = useState(cart)
  const [currencies, setCurrencies] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [rpPrices, setRpPrices] = useState([])
  const [conversions, setConversions] = useState([])
  const [paymentMethodCurrencies, setPaymentMethodCurrencies] = useState({})
  const [couponData, setCouponData] = useState(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const {selectedCurrency , updateSelectedCurrency} = useCurrency()

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
  })

  // Load initial data
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
        ])
        
        
        
        setCurrencies(currencyData)
        setRpPrices(rpPriceData)
        setPaymentMethods(paymentMethodData)
        setConversions(conversionData)

        const methodCurrenciesMap = {}
        methodCurrenciesData.forEach(relation => {
          if (relation.paymentMethod) {
            methodCurrenciesMap[relation.paymentMethod._id] = {
              currencies: relation.currencies || [],
              isRestricted: relation.isRestricted
            }
          }
        })
        setPaymentMethodCurrencies(methodCurrenciesMap)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    
  }, [])

  const handleCouponValidation = async (code) => {
    if (!code || !selectedCurrency) return

    setIsValidatingCoupon(true)
    try {
      const response = await validateCupon(code, selectedCurrency._id)
      if (response.isValid) {
        setCouponData({
          code,
          type: response.type,
          value: response.discountValue,
          _id: response._id
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error validating coupon:', error)
      return false
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const calculateTotal = () => {
    if (!selectedCurrency || !cartItems.length) return 0

    const subtotal = cartItems.reduce((total, item) => {
      return total + (item ? unformatPrice(item.priceConverted) * item.quantity : 0)
    }, 0)

    if (couponData) {
      const discount = couponData.type === 'percent'
        ? subtotal * (couponData.value / 100)
        : couponData.value
      return Math.max(subtotal - discount, 0)
    }

    return formatPrice(subtotal)
  }

  const getAvailablePaymentMethods = () => {
    if (!selectedCurrency) return []

    return paymentMethods.filter(method => {
      const methodCurrency = paymentMethodCurrencies[method._id]
      if (!methodCurrency?.isRestricted) return true
      return methodCurrency.currencies.some(
        currency => currency._id === selectedCurrency._id
      )
    }).filter(method => method.active)
  }

  const handleCouponSubmit = async (code) => {
    const isValid = await handleCouponValidation(code)
    if (!isValid) {
      form.setError('couponCode', {
        type: 'manual',
        message: 'Invalid coupon code'
      })
    }
  }

  const removeCoupon = () => {
    setCouponData(null)
    form.setValue('couponCode', '')
  }

  const handleNext = () => setStep(prev => prev + 1)
  const handleBack = () => setStep(prev => prev - 1)
  const handleFileChange = (e) => setReceiptFile(e.target.files[0])

  const onSubmit = async (values) => {
    // console.log("Form submitted with values:", values);
    setIsSubmitting(true)
    try {

      const data = {
        items:cartItems, 
        paymentMethodId:values.paymentMethod,
        riotName:values.riotName,
        discordName:values.discordName ,
        region:values.server,
        selectedCurrency:selectedCurrency._id,
        cupon:couponData?._id,
        file:receiptFile
      }

      // console.log(data)

      await createPurchase(
        data
      )
      clearCart()
      handleNext()
    } catch (error) {
      console.error('Error creating purchase:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0';
    const number = Math.round(Number(price));
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const unformatPrice = (formattedPrice) => {
    if (!formattedPrice) return 0;
    
    // Si ya es un número, lo devolvemos directamente
    if (typeof formattedPrice === 'number') return formattedPrice;
    
    // Removemos los puntos y convertimos a número
    const number = parseInt(formattedPrice.replace(/\./g, ''));
    
    // Si no es un número válido, devolvemos 0
    return isNaN(number) ? 0 : number;
  };
  

  return (
    <FormProvider {...form}>
      <TopNav/>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {step === 1 ? "Tu Carrito" : 
              step === 2 ? "Detalles de Cuenta" : 
              step === 3 ? "Detalles del Pago" : 
              "Confirmación de Compra"}
            </h1>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full ${step >= i ? "bg-primary" : "bg-gray-300"}`}
                />
              ))}
            </div>
          </div>
    
          <Card className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
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
                            {item.isSkin && <p className="text-xs text-muted-foreground">Skin</p>}
                          </>
                        )}
                      </div>
                    </div>
                    <p className="font-medium">
                      {selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}
                    </p>
                  </div>
                ))}
                
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
                                <Input 
                                  placeholder="Enter coupon code" 
                                  {...field}
                                  disabled={isValidatingCoupon}
                                />
                              </FormControl>
                              <Button 
                                onClick={() => handleCouponSubmit(field.value)}
                                disabled={!field.value || isValidatingCoupon}
                              >
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
                          Cupon <p className="font-bold">{couponData.code}</p> Aplicado: 
                          {couponData.type === 'percent' ? 
                            <p className="text-green-400">{couponData.value}% OFF</p> : 
                            <p className="text-green-400">{selectedCurrency?.symbol}${couponData.value} OFF</p>}
                        </AlertDescription>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={removeCoupon}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Alert>
                  )}
    
                  <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                    <p>Total</p>
                    <p>{selectedCurrency?.symbol}{calculateTotal()}</p>
                  </div>
                </div>
    
                <Button 
                  className="w-full" 
                  onClick={handleNext}
                  disabled={cartItems.length === 0}
                >
                  Continuar a detalles de la cuenta
                </Button>
              </div>
            )}
    
            {step === 2 && (
              <Form {...form}>
              <form className="space-y-4">
                {/* Riot Name Field */}
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
            
                {/* Discord Name Field */}
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
            
                {/* Server Selection */}
                <FormField
                  control={form.control}
                  name="server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server</FormLabel>
                      <Select
                        {...field}
                        required
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        aria-invalid={form.formState.errors.server ? "true" : "false"}
                      >
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
            
                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    onClick={async (e) => {
                      // Trigger validation for the form
                      const isValid = await form.trigger(["riotName", "discordName", "server"]);
                      if (isValid) {
                        handleNext(); // Advance step if the form is valid
                      }else{
                        e.preventDefault()
                      }
                    }}
                  >
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
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          updateSelectedCurrency(currencies.find(c => c._id === value))
                        }} 
                        value={selectedCurrency._id}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue  placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem 
                              className="bg-black text-white"
                              key={currency._id} 
                              value={currency._id}
                            >
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
                      <Select
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedCurrency}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailablePaymentMethods().map(method => {
                            // console.log(method)
                              return (
                                <SelectItem 
                                  className="bg-black texct-white"
                                  key={method._id} 
                                  value={method._id}
                                >
                                  {method.method}
                                </SelectItem>
                              )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <div className="pt-4">    
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                    onClick={async (e) => {
                      // Trigger validation for the form
                      const isValid = await form.trigger(["paymentMethod"]);
                      if (isValid && selectedCurrency) {
                        handleNext(); // Advance step if the form is valid
                      }else{
                        e.preventDefault()
                      }
                    }}
                  >
                    Continuar a la confirmacion
                  </Button>
                  </div>
                </div>
              </div>
            )}
    
            {step === 4 && (
              <Form {...form}>
                <form onSubmit={(e)=>{
                  e.preventDefault()
                  const values = {
                    riotName: form.getValues().riotName,
                    discordName: form.getValues().discordName,
                    server: form.getValues().server,
                    paymentMethod: form.getValues().paymentMethod,
                  }
                  onSubmit(values)
                }}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Resumen del Pedido</h2>
                      <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                        {/* Sección de detalles del método de pago */}
                        <div className="mb-6 border-b border-border/20 pb-4">
                          <h3 className="text-lg font-semibold mb-3">Detalles de Pago</h3>
                          <div className="flex gap-2"><p className="font-bold">Metodo de Pago: </p><p>{paymentMethods.find(p => p._id === form.getValues().paymentMethod).method}</p></div>
                          {paymentMethods.find(p => p._id === form.getValues().paymentMethod)?.details.map((detail, index) => (
                            <div key={index} className="mb-3 last:mb-0 flex gap-2">
                              <p className="font-medium text-primary">{detail.title}</p>
                              <p className="text-medium text-green-600 whitespace-pre-line">
                                {detail.description}
                              </p>
                            </div>
                          ))}
                          <div className="mt-4 p-3 bg-yellow-500/10 rounded-md">
                            <p className="text-sm text-yellow-500">
                              Por favor, asegúrate de realizar el pago exacto y seguir todas las instrucciones antes de subir el comprobante.
                            </p>
                          </div>
                        </div>

                        <p>Riot Name: {form.getValues().riotName}</p>
                        <p>Discord Name: {form.getValues().discordName}</p>
                        <p>Server: {form.getValues().server}</p>
                        
                        {/* Display cart items */}
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="font-medium mb-2">Items</h3>
                          {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between py-2 border-b border-border/20">
                              {item.isUnranked ? (
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">Cuenta {item.region}</span>
                                    <span>{selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-0.5">
                                    <p>Nivel {item.nivel} • <span className={` ${item.handUpgrade ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {item.handUpgrade ? 'Safe' : 'Unsafe'}
                                    </span></p>
                                    {item.quantity > 1 && <p>x{item.quantity}</p>}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between w-full">
                                  <span>{item.NombreSkin || item.name} x {item.quantity}</span>
                                  <span>{selectedCurrency?.symbol}{formatPrice(unformatPrice(item.priceConverted) * item.quantity)}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <h2 className="text-xl font-bold mb-2">Cargar Comprobante</h2>
                          <p className="text-sm text-muted-foreground mb-2">
                            Por favor, sube una captura o foto del comprobante de pago
                          </p>
                          <input 
                            type="file" 
                            onChange={handleFileChange}
                            accept="image/*,.pdf"
                            className="mb-4"
                          />
                        </div>

                        {/* Display total */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>{selectedCurrency?.symbol}{calculateTotal()}</span>
                          </div>
                        </div>

                        {/* Display coupon if applied */}
                        {couponData && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Cupón aplicado: {couponData.code} 
                            ({couponData.type === 'percent' ? 
                              `${couponData.value}% descuento` : 
                              `${selectedCurrency?.symbol}${couponData.value} descuento`})
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack}>
                          Atrás
                        </Button>
                        <Button 
                          type="submit"
                          disabled={!receiptFile || isSubmitting}
                        >
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
              <Button 
                className="mt-4"
                onClick={() => window.location.href = '/perfil'} // Redirige al perfil
              >
                Ir a mi perfil
              </Button>
            </div>
          )}
          </Card>
        </div>
      </div>
    </FormProvider>
  )
}