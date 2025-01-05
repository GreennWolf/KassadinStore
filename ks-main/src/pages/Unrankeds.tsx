import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/context/StoreContext";
import { Star } from "lucide-react";
import { useState } from "react";

interface UnrankedAccount {
  id: string;
  region: string;
  level: number;
  blueEssence: number;
  orangeEssence: number;
  quickplayRecord: string;
  price: number;
  image: string;
}

const unrankedAccounts: UnrankedAccount[] = [
  {
    id: "unr-1",
    region: "BR",
    level: 30,
    blueEssence: 40000,
    orangeEssence: 1218,
    quickplayRecord: "0/0",
    price: 28.50,
    image: "/lovable-uploads/19464c96-bb7c-4b6a-98bd-936ddcc2c3c1.png"
  },
  {
    id: "unr-2",
    region: "EUW",
    level: 32,
    blueEssence: 35000,
    orangeEssence: 980,
    quickplayRecord: "1/0",
    price: 30.00,
    image: "/lovable-uploads/19464c96-bb7c-4b6a-98bd-936ddcc2c3c1.png"
  },
];

const Unrankeds = () => {
  const { addToCart } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const handleAddToCart = (account: UnrankedAccount) => {
    addToCart({
      id: account.id,
      name: `Unranked Account (${account.region})`,
      price: account.price,
      image: account.image
    });
  };

  const filteredAccounts = unrankedAccounts.filter((account) => {
    const matchesSearch = account.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === "all" || account.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="flex flex-col lg:flex-row p-4 lg:p-8 gap-4 lg:gap-8 mt-20">
        {/* Filters Section - Full width on mobile, sidebar on desktop */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
          <h2 className="text-xl font-semibold">Filters</h2>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                type="search"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border-border"
              />
            </div>
            <div className="col-span-2 lg:col-span-1">
              <label className="text-sm font-medium mb-2 block">Region</label>
              <Select
                value={selectedRegion}
                onValueChange={setSelectedRegion}
              >
                <SelectTrigger className="w-full bg-card border-border">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="BR">Brazil</SelectItem>
                  <SelectItem value="EUW">Europe West</SelectItem>
                  <SelectItem value="NA">North America</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <Card key={account.id} className="bg-card border-border overflow-hidden">
                <div className="relative">
                  <img 
                    src={account.image} 
                    alt="Account Preview" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-emerald-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Safe
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Star className="text-yellow-400 w-5 h-5" />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-foreground font-medium">Region: {account.region}</p>
                      <p className="text-foreground font-bold">€{account.price.toFixed(2)}</p>
                    </div>
                    <p className="text-foreground">Level: {account.level}+</p>
                    <p className="text-foreground">BE: {account.blueEssence.toLocaleString()}+</p>
                    <p className="text-foreground">OE: {account.orangeEssence.toLocaleString()}</p>
                  </div>
                  <Button 
                    onClick={() => handleAddToCart(account)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unrankeds;