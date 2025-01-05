import { Star } from "lucide-react";

const reviews = [
  {
    name: "Mirko B.",
    country: "DE",
    content: "Excellent service, nice booster and live support, it was fast and smooth",
    rating: 5,
    image:'url'
  },
  {
    name: "Musociu",
    country: "DE",
    content: "Thank you for completing my order so quickly and safely. I say thank you and recommend you",
    rating: 5.,
    image:'url'
  },
  {
    name: "Soraka",
    country: "US",
    content: "Excellent customer service.",
    rating: 5.,
    image:'url'
  },
  {
    name: "Alex R.",
    country: "ES",
    content: "Servicio rápido y profesional, muy recomendado",
    rating: 5.,
    image:'url'
  },
  {
    name: "Maria S.",
    country: "MX",
    content: "Excelente atención y resultados",
    rating: 5.,
    image:'url'
  }
];

export const ReviewsSection = () => {
  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - CTA */}
          <div className="space-y-8">
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Kassadin Store
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold mb-8">
                Unite a nuestra comunidad
              </h3>
              <p className="text-lg text-muted-foreground">
                Conectate con otros jugadores y mantente actualizado con nuestras últimas ofertas
              </p>
              <a
                href="https://discord.gg/your-server"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#5865F2] text-white px-6 py-3 rounded-lg hover:bg-[#4752C4] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </a>
            </div>
          </div>

          {/* Right side - Reviews */}
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <p className="text-[#FF6B00] uppercase tracking-wider text-sm mb-4">RESEÑAS</p>
              <h2 className="text-4xl font-bold mb-4">
                Más de <span className="text-[#FFA064]">50,000</span> clientes satisfechos
              </h2>
            </div>

            <div className="relative overflow-hidden h-[400px]">
              <div className="absolute top-0 animate-scroll space-y-4">
                {[...reviews, ...reviews].map((review, index) => (
                  <div 
                    key={index} 
                    className="bg-card p-6 rounded-lg transform hover:scale-105 transition-transform duration-300"
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#00B67A] text-[#00B67A]" />
                      ))}
                    </div>
                    <p className="text-sm mb-4">{review.content}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.country}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};