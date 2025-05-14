import { Button } from "@/components/ui/button";
import { Trophy, Star, ArrowRight, Award } from "lucide-react";

export const StepsSection = () => {
  return (
    <section className="py-8 mt-4 relative overflow-hidden bg-black">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
          {/* Step 1 */}
          <div className="relative group w-full md:w-1/3 max-w-sm">
            <div className="relative p-8 bg-black rounded-2xl leading-none flex items-center justify-start space-x-6 border border-white/20">
              <div className="flex flex-col space-y-6 w-full">
                <div className="flex items-center justify-between">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white text-2xl font-bold">1</span>
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Compra y Gana XP</h4>
                  <p className="text-white/60">Cada compra que realices te otorga puntos de experiencia (XP). ¡Mientras más compres, más rápido subirás de nivel!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="hidden md:flex flex-col items-center justify-center text-white">
            <ArrowRight className="w-12 h-12 animate-pulse" />
          </div>

          {/* Step 2 */}
          <div className="relative group w-full md:w-1/3 max-w-sm">
            <div className="relative p-8 bg-black rounded-2xl leading-none flex items-center justify-start space-x-6 border border-white/20">
              <div className="flex flex-col space-y-6 w-full">
                <div className="flex items-center justify-between">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white text-2xl font-bold">2</span>
                  <Star className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Sube de Rango</h4>
                  <p className="text-white/60">Al alcanzar ciertos niveles de XP, subirás de rango y recibirás Oro como recompensa por tu progreso.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="hidden md:flex flex-col items-center justify-center text-white">
            <ArrowRight className="w-12 h-12 animate-pulse" />
          </div>

          {/* Step 3 */}
          <div className="relative group w-full md:w-1/3 max-w-sm">
            <div className="relative p-8 bg-black rounded-2xl leading-none flex items-center justify-start space-x-6 border border-white/20">
              <div className="flex flex-col space-y-6 w-full">
                <div className="flex items-center justify-between">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white text-2xl font-bold">3</span>
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Canjea tu Oro</h4>
                  <p className="text-white/60">Utiliza el Oro acumulado para obtener recompensas exclusivas. Cada recompensa tiene su valor específico en Oro.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};