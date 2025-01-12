import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import bg from '../../assets/bg2.svg';
import ds from '../../assets/ds.png';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-no-repeat bg-cover bg-black"
    style={{ backgroundImage: `url(${bg})` }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-[128px] opacity-10 animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-[128px] opacity-10 animate-float"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <img 
            src={ds}
            alt="Logo" 
            className="w-4 h-4 object-contain"
          />
          <span className="text-sm font-medium text-white">+11k miembros</span>
        </div>

        {/* Main heading with gradient */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white/80 to-white/60 text-transparent bg-clip-text animate-fade-in">
          Kassadin Store
        </h1>

        {/* Subtitle with animation */}
        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Sistema automatizado, mejores precios y soporte activo.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            onClick={() => navigate('/tienda/skins')}
            className="px-8 py-6 text-lg bg-white hover:bg-white/90 text-black transition-all duration-300 transform hover:scale-105"
          >
            Explorar Tienda
          </Button>
          <Button 
              variant="outline"
              onClick={() => window.open('https://discord.com/invite/T9WJ2jGvAD', '_blank')}
              className="px-8 py-6 text-lg border-white text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              Únete a Discord
          </Button>

        </div>
      </div>
    </div>
  );
};