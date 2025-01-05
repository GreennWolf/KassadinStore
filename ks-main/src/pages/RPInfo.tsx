import { TopNav } from "@/components/TopNav";

const RPInfo = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 animate-fade-in">Tipos de RP</h1>
        
        <div className="space-y-8 animate-fade-in">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">RP Seguro</h2>
            <p className="text-muted-foreground">
              El RP Seguro es la opción más confiable para obtener Riot Points. Este método utiliza
              canales oficiales y garantiza la seguridad de tu cuenta, aunque puede ser más costoso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">RP Barato</h2>
            <p className="text-muted-foreground">
              El RP Barato ofrece una alternativa más económica para obtener Riot Points. Si bien es
              más accesible en términos de precio, es importante entender que puede implicar ciertos
              riesgos y el tiempo de entrega puede ser mayor.
            </p>
          </section>

          <div className="bg-card p-6 rounded-lg border border-border mt-8">
            <h3 className="text-xl font-semibold mb-4">Recomendación</h3>
            <p className="text-muted-foreground">
              Siempre recomendamos considerar la seguridad de tu cuenta como prioridad al elegir
              el tipo de RP. Evalúa cuidadosamente tus opciones y selecciona el método que mejor
              se adapte a tus necesidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RPInfo;