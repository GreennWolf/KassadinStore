import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-noise opacity-5" />
      
      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-white/80 to-white/60 bg-clip-text text-transparent animate-fade-in">
            ¿Listo para mejorar tu experiencia?
          </h2>
          <p className="text-lg text-white/80 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Descubre una amplia selección de skins y servicios para mejorar tu experiencia de juego
          </p>
          <Button 
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/Tienda/skins')}}
            className="px-8 py-6 text-lg bg-white hover:bg-white/90 text-black transition-all duration-300 transform hover:scale-105 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            Conseguí tu skin favorita
          </Button>
        </div>
      </div>
    </section>
  );
};