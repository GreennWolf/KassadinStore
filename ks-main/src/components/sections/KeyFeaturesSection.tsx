import { Shield, Clock, CreditCard, Users } from "lucide-react";
import pagos from "../../assets/pagos.png";
import sistema from "../../assets/sistema.png";
import comunidad from "../../assets/comunidad.png";
import soporte from "../../assets/soporte.png";

export const KeyFeaturesSection = () => {

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-sm uppercase tracking-wider text-white/80 mb-2">
            CARACTERÍSTICAS PRINCIPALES
          </h2>
          <h3 className="text-4xl font-bold bg-gradient-to-r from-white via-white/60 to-white/40  bg-clip-text">
            ¿Por qué elegirnos?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sistema Automatizado */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <img 
                  src={sistema}
                  alt="Sistema Automatizado" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">Sistema Automatizado</h4>
              <p className="text-white/60 leading-relaxed flex-grow">
                Proceso completamente automatizado para una experiencia rápida y eficiente.
              </p>
            </div>
          </div>

          {/* Soporte 24/7 */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <img 
                  src={soporte}
                  alt="Soporte 24/7" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">Soporte 24/7</h4>
              <p className="text-white/60 leading-relaxed flex-grow">
                Nuestro equipo está disponible las 24 horas para ayudarte con cualquier consulta.
              </p>
            </div>
          </div>

          {/* Múltiples Métodos de Pago */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <img 
                  src={pagos}
                  alt="Múltiples Métodos de Pago" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">Múltiples Métodos de Pago</h4>
              <p className="text-white/60 leading-relaxed flex-grow">
                Aceptamos diversos métodos de pago para tu comodidad.
              </p>
            </div>
          </div>

          {/* Comunidad Activa */}
          <div className="group relative h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
            <div className="relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 bg-black/40 h-full flex flex-col">
              <div className="mb-8">
                <img 
                  src={comunidad}
                  alt="Comunidad Activa" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-white">Comunidad Activa</h4>
              <p className="text-white/60 leading-relaxed flex-grow">
                Únete a nuestra comunidad activa y creciente de jugadores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};