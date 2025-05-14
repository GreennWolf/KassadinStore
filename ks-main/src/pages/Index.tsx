import { TopNav } from "@/components/TopNav";
import { HeroSection } from "@/components/sections/HeroSection";
import { KeyFeaturesSection } from "@/components/sections/KeyFeaturesSection";
import { StepsSection } from "@/components/sections/StepsSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { CTASection } from "@/components/sections/CTASection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {BuyStepsSection} from "@/components/sections/BuyStepsSection";

const Index = () => {
  return (
    <div className="min-h-screen text-foreground">
      <TopNav />
      
      <main className="space-y-8">
        <HeroSection />
        <KeyFeaturesSection />
        <BuyStepsSection />
        <CTASection />
        <ReviewsSection />

        {/* FAQ Section */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">FAQ</h2>
              <h3 className="text-4xl font-bold mt-2">Preguntas Frecuentes</h3>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>¿Cuánto tiempo tarda el envío de un pedido?</AccordionTrigger>
                <AccordionContent>
                  Una vez aceptada tu solicitud, se necesitan 7 días para que podamos enviar tu pedido. Desde ese momento, el envío se realizará tan pronto como un admin esté disponible.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>¿Por qué es importante tener pocas solicitudes de amistad pendientes?</AccordionTrigger>
                <AccordionContent>
                  Recomendamos que tengas la menor cantidad posible de solicitudes pendientes en tu cuenta. Esto asegura que nuestras solicitudes te lleguen sin problemas, ya que solemos enviar varias solicitudes por cada pedido.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>¿Qué pasa si mi pedido se demora?</AccordionTrigger>
                <AccordionContent>
                  Aunque hacemos todo lo posible para que el proceso sea rápido, a veces pueden ocurrir demoras externas que están fuera de nuestro control. De igual modo siempre se mantiene informado a los clientes sobre esto.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>¿Cómo es la seguridad?</AccordionTrigger>
                <AccordionContent>
                  En nuestra página manejamos diferentes tipos de métodos de entrega para priorizar la seguridad de tu cuenta dependiendo tus necesidades, los cuales venimos usando hace ya 2 años. Los puedes encontrar cuando vayas a hacer tu pedido en nuestro catálogo. Es importante aclarar que ninguna tienda externa es 100% segura, ya que este tipo de servicios no son oficiales. Aunque el riesgo es mínimo y trabajamos con diferentes métodos para que la mayoría de los pedidos se completen sin inconvenientes, siempre existe una pequeña posibilidad fuera de nuestro control. Si decides realizar una compra externa, considera estos factores y evita situaciones que puedan llamar la atención en tu cuenta.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>¿Se realizan reembolsos?</AccordionTrigger>
                <AccordionContent>
                  No hacemos reembolsos una vez que el pedido ha sido confirmado, procesado o entregado. Solo se procesan reembolsos en caso de que el item no pueda ser enviado (por ejemplo, si expiró el tiempo para regalarlo).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>


      </main>

      {/* Footer */}

    <footer className="bg-black text-white py-16 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-64 gap-y-8">
            {/* Products Column */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-center md:text-left">Productos</h3>
              <ul className="space-y-3 text-center md:text-left">
                <li><a href="/Tienda/presale" className="text-gray-400 hover:text-white transition-colors">Evento</a></li>
                <li><a href="/Tienda/skins" className="text-gray-400 hover:text-white transition-colors">Skins</a></li>
                <li><a href="/Tienda/loot" className="text-gray-400 hover:text-white transition-colors">Loot</a></li>
                <li><a href="/Tienda/tft" className="text-gray-400 hover:text-white transition-colors">TFT</a></li>
                <li><a href="/Tienda/unranked" className="text-gray-400 hover:text-white transition-colors">Unranked</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-center md:text-left">Legal</h3>
              <ul className="space-y-3 text-center md:text-left">
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terminos Y Condiciones</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Politica de Privacidad</a></li>
              </ul>
            </div>

            {/* Happy Clients Column */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-center md:text-left">Clientes Satisfechos</h3>
              <ul className="space-y-3 text-center md:text-left">
                <li><a href="discord.com/invite/T9WJ2jGvAD" target="_blank" className="text-gray-400 hover:text-white transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">© Kassadin Store</div>
            <div className="flex gap-6">
              <a href="https://www.facebook.com/profile.php?id=61553397030375"  target="_blank" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/kassadin.store/" target="_blank" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 8.5a3.5 3.5 0 1 1-3.5 3.5 3.5 3.5 0 0 1 3.5-3.5z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-400 text-center max-w-4xl mx-auto">
            Kassadin Store no cuenta con el respaldo ni está afiliada de ninguna manera a Riot Games y no refleja las opiniones ni los puntos de vista de ninguna persona involucrada oficialmente en la producción o administración de League of Legends. Todas las marcas comerciales y logotipos pertenecen a sus respectivos propietarios. Todo el contenido artístico enviado sigue siendo propiedad intelectual de su propietario original.
          </div>
          <div className="text-center text-gray-400 text-xs md:text-sm">
          <span>Ante cualquier inconveniente contactese aqui: </span>
          <a 
            href="kassadinstore65@gmail.com" 
            className="text-white hover:text-gray-300 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            kassadinstore65@gmail.com
          </a>
        </div>
        </div>
      </div>
    </footer>
    </div>
  );
};

export default Index;
