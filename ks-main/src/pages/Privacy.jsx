import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header con botón de retorno */}
      <div className="bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:text-white/80 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* Título principal */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">Política de Privacidad</h1>
          <div className="h-1 w-20 bg-white/20 mx-auto rounded-full"></div>
        </div>

        {/* Introducción */}
        <section className="prose prose-invert max-w-none">
          <p className="text-white/80 leading-relaxed">
            Nuestra Política de Privacidad regula los términos relacionados con la privacidad en nuestro sitio web, incluyendo subdominios y cualquier aplicación asociada, tanto web como móvil. Este documento tiene como objetivo explicar cómo recopilamos, usamos y protegemos tu información personal. Tu privacidad es una prioridad para nosotros y hemos creado esta política para que comprendas nuestras prácticas relacionadas con el manejo de datos.
          </p>
        </section>

        {/* Sección de Uso de Datos */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Uso de Datos Personales y Propósito de Recolección</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              En ksdinstore.com, cumplimos con todos los requisitos legales para proteger tu privacidad. Nuestra Política de Privacidad es una declaración legal que explica cómo podemos recopilar información sobre vos, cómo podemos compartir esa información y cómo podés limitar la forma en que compartimos tus datos.
            </p>
          </div>
        </section>

        {/* Enlaces Externos */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Enlaces a Sitios Externos</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Nuestro sitio web puede incluir enlaces a otros sitios que no están bajo nuestro control directo. Estos sitios pueden tener sus propias políticas de privacidad y no somos responsables de su contenido ni de sus prácticas.
            </p>
          </div>
        </section>

        {/* Seguridad */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Seguridad de la Información</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Nos comprometemos a proteger la información personal que compartes con nosotros. Implementamos medidas diseñadas para proteger tus datos personales contra accesos no autorizados, pérdidas, alteraciones o usos indebidos. Estos datos se almacenan en sistemas seguros y se transmiten utilizando protocolos cifrados como SSL.
            </p>
          </div>
        </section>

        {/* Actualizaciones */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Actualizaciones de la Política de Privacidad</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. Te recomendamos revisar este documento con frecuencia para mantenerte informado sobre posibles cambios. Los cambios entrarán en vigor a partir de la fecha de modificación y sustituirán cualquier versión previa de nuestra política.
            </p>
          </div>
        </section>
      </main>

      {/* Footer simple */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-sm text-white/60">
            © {new Date().getFullYear()} Kassadin Store. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;