// AdminRecompensas.jsx
import React from "react";
import { RankManager } from "./adminRangos/RankManager";
import { XpConversionManager } from "./adminRangos/XpConvertionManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LootboxManager } from "./adminRecompensas/LootBoxManager";

export function AdminRecompensas() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <Tabs defaultValue="lootboxes" className="w-full">
        <TabsList>
          <TabsTrigger value="lootboxes">Cajas</TabsTrigger>
          <TabsTrigger value="cupones">Cupones</TabsTrigger>
        </TabsList>

        <TabsContent value="lootboxes">
          <LootboxManager/>
        </TabsContent>

        <TabsContent value="cupones">
          
        </TabsContent>
      </Tabs>
    </div>
  );
}