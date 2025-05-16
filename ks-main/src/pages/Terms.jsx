import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
          <h1 className="text-4xl font-bold mb-6">Términos y Condiciones</h1>
          <div className="h-1 w-20 bg-white/20 mx-auto rounded-full"></div>
        </div>

        {/* Bienvenida y Aceptación */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Bienvenida y Aceptación</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Gracias por visitar Ksdin Store (en adelante, "nosotros" o "la Tienda"). Estos Términos y Condiciones son el contrato que rige tu interacción con nuestro sitio web www.ksdinstore.com.
            </p>
            <p className="text-white/80 leading-relaxed mt-4">
              Al explorar o comprar en el Espacio Digital, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguna parte, te invitamos a cerrar la página y abstenerte de usarla.
            </p>
          </div>
        </section>

        {/* Compromisos del Usuario */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Compromisos del Usuario</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Al interactuar con el Espacio Digital, tú confirmas que:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-white/80">
              <li>Tienes la edad legal para realizar compras en tu región o cuentas con autorización de un responsable.</li>
              <li>Toda la información que nos des será correcta y estará actualizada.</li>
              <li>No harás uso de herramientas automáticas ni intentos de acceso no permitidos.</li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-4">
              Nos reservamos el derecho de suspender tu acceso si violas estas reglas.
            </p>
          </div>
        </section>

        {/* Catálogo y Precios */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Catálogo y Precios</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Nuestros productos digitales están disponibles según existencias. Podemos modificar, retirar o ajustar los ítems y sus costos en cualquier momento, sin necesidad de avisarte previamente. Los precios finales se confirmarán al momento de pagar.
            </p>
          </div>
        </section>

        {/* Tiempos de Entrega y Demoras */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Tiempos de Entrega y Demoras</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Nos esforzamos por entregar tus compras rápidamente, pero reconocemos que pueden surgir retrasos. Al comprar, aceptas que:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-white/80">
              <li>La entrega podría tomar tiempo excedido desde que confirmamos tu pago.</li>
              <li>Factores como problemas de coordinacion entre el cliente y la tienda, o alta demanda pueden extender este plazo.</li>
              <li>Te avisaremos si esperamos un retraso mayor al habitual, pero tu paciencia con estos tiempos forma parte de este acuerdo.</li>
            </ul>
          </div>
        </section>

        {/* Devoluciones y Reembolsos */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Devoluciones y Reembolsos</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Puedes pedir un reembolso si:
            </p>
            <p className="text-white/80 leading-relaxed mt-4">
              El producto ya no está disponible para enviar o ha sido descontinuado. Para iniciar un reembolso válido, deberas crear un ticket de soporte. Los reembolsos se procesarán al mismo método de pago utilizado, en un plazo de 7 hábiles.
            </p>
          </div>
        </section>

        {/* Atención y Soporte */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Atención y Soporte</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Si algo sale mal con tu pedido o tienes preguntas, resolvemos todo exclusivamente por nuestro sistema de soporte:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-white/80">
              <li>Ingresa a nuestro servidor oficial en Discord.</li>
              <li>Crea un ticket con tu número de orden y detalles del problema.</li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-4">
              En caso de experimentar algún problema con tu pedido, tu deberás crear un ticket de soporte para notificarnos. Esto nos permitirá identificar el inconveniente y trabajar en una solución.
            </p>
          </div>
        </section>

        {/* Restricciones de Uso */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Restricciones de Uso</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              No puedes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-white/80">
              <li>Extraer datos del Espacio Digital para fines personales o comerciales sin nuestro permiso.</li>
              <li>Alterar, hackear o interrumpir el funcionamiento del Espacio Digital.</li>
              <li>Usar nuestros servicios para actividades que nos perjudiquen o generen competencia.</li>
              <li>Enviar contenido malicioso o engañoso.</li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-4">
              Cualquier infracción puede llevar a la cancelación de tus compras y bloqueo permanente.
            </p>
          </div>
        </section>

        {/* Derechos sobre el Contenido */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Derechos sobre el Contenido</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Ksdin Store no cuenta con el respaldo ni está afiliada de ninguna manera a Riot Games y no refleja las opiniones ni los puntos de vista de ninguna persona involucrada oficialmente en la producción o administración de League of Legends. Todas las marcas comerciales y logotipos pertenecen a sus respectivos propietarios. Todo el contenido artístico enviado sigue siendo propiedad intelectual de su propietario original.
            </p>
          </div>
        </section>

        {/* Exclusión de Garantías */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Exclusión de Garantías</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              El Espacio Digital se ofrece como está. No prometemos que siempre funcione perfectamente ni que esté libre de fallos. No nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-white/80">
              <li>Problemas causados por mal uso de lo comprado.</li>
              <li>Pérdidas debido a cambios en plataformas externas relacionadas con los productos.</li>
              <li>Interrupciones técnicas fuera de nuestro alcance.</li>
            </ul>
          </div>
        </section>

        {/* Actualizaciones a estos Términos */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Actualizaciones a estos Términos</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Podemos cambiar estos términos cuando lo consideremos necesario. Los ajustes serán efectivos al publicarse en el Espacio Digital, y seguir usándolo significa que los aceptas.
            </p>
          </div>
        </section>

        {/* Contacto */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white/90">Contacto</h2>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Para dudas generales y problemas con pedidos, usa el sistema de tickets en Discord.
            </p>
          </div>
        </section>
      </main>

      {/* Footer simple */}
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

export default Terms;