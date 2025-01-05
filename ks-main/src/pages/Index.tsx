import { TopNav } from "@/components/TopNav";
import { HeroSection } from "@/components/sections/HeroSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { StepsSection } from "@/components/sections/StepsSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto">
        <HeroSection />
        <StepsSection />
        <ReviewsSection />

        {/* FAQ Section */}
        <section className="py-16 bg-background">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">FAQ</h2>
              <h3 className="text-4xl font-bold mt-2">Frequently Asked Questions</h3>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is WeavePay a bank?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Is WeavePay regulated?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Can I open a WeavePay account?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>How safe is my money in a WeavePay account?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Is my data safe with WeavePay?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>What type of industries does WeavePay work with?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>How much does it cost to set up and maintain a WeavePay account?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>What documents do I need to open a WeavePay account?</AccordionTrigger>
                <AccordionContent>
                  Content for this answer goes here.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Products Column */}
            <div>
              <h3 className="font-bold mb-4">Products</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Multicurrency account</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Debit cards</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Foreign exchange</a></li>
              </ul>
            </div>

            {/* Industries Column */}
            <div>
              <h3 className="font-bold mb-4">Industries</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Export/Import</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Manufacturing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Marketing</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Terms and conditions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy policy</a></li>
              </ul>
            </div>

            {/* Happy Clients Column */}
            <div>
              <h3 className="font-bold mb-4">Happy Clients</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Trustpilot</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Google reviews</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-400">
                © Kassadin Store
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.153-1.772 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400 text-center md:text-left">
              Kassadin Store no cuenta con el respaldo ni está afiliada de ninguna manera a Riot Games y no refleja las opiniones ni los puntos de vista de ninguna persona involucrada oficialmente en la producción o administración de League of Legends. Todas las marcas comerciales y logotipos pertenecen a sus respectivos propietarios. Todo el contenido artístico enviado sigue siendo propiedad intelectual de su propietario original.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
