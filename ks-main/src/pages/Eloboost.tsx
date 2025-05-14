import { TopNav } from "@/components/TopNav";
import { RankBoostPanel } from "@/components/RankBoostPanel";

export default function Eloboost() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl xl:text-6xl/none">
              League of Legends Boosting
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Professional and reliable LoL boosting service. Reach your desired rank with our experienced boosters.
            </p>
          </div>
          <RankBoostPanel />
        </div>
      </main>
    </div>
  );
}