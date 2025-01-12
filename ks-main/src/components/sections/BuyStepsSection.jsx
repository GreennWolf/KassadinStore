import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Download, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const BuyStepsSection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 relative overflow-hidden bg-black">
      {/* Background with noise texture */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-noise opacity-5"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-sm uppercase tracking-wider text-white/80 mb-2">
            PASOS PARA COMPRAR
          </h2>
          <h3 className="text-4xl font-bold bg-gradient-to-r from-white via-white/80 to-white/60 text-transparent bg-clip-text">
            ¡Comienza tu aventura!
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Select Item Card */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-10 h-10 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">
                1. Selecciona un Item
              </h4>
              <p className="text-white/60 mb-6 leading-relaxed flex-grow">
                Explora nuestro catálogo y elige el item que más te guste. Tenemos una gran variedad de opciones para ti.
              </p>
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white group-hover:translate-x-2 transition-all mt-auto"
                onClick={() =>{ 
                  window.scrollTo(0, 0);
                  navigate("/Tienda/skins")}}
              >
                Ver Catálogo
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Payment Card */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">
                2. Hacer el Pago
              </h4>
              <p className="text-white/60 mb-6 leading-relaxed flex-grow">
                Proceso de pago seguro y rápido. Aceptamos múltiples métodos de pago para tu comodidad.
              </p>
            </div>
          </div>

          {/* Receive Item Card */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Download className="w-10 h-10 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">
                3. Recibe tu Item
              </h4>
              <p className="text-white/60 mb-6 leading-relaxed flex-grow">
                Tu item será entregado con nuestro sistema luego de que pasen 7 dias desde que te agregamos como amigo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};