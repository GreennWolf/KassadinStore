// AdminRecompensas.jsx
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LootboxManager } from "./adminRecompensas/LootBoxManager";
import { GoldConversionManager } from "./adminRecompensas/GoldConversionManager";
import { RewardCouponManager } from "./adminRecompensas/RewardCouponManager";

export function AdminRecompensas() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <Tabs defaultValue="lootboxes" className="w-full">
        <TabsList>
          <TabsTrigger value="lootboxes">Cajas</TabsTrigger>
          <TabsTrigger value="cupones">Cupones</TabsTrigger>
          <TabsTrigger value="oro">Conversion Oro</TabsTrigger>
        </TabsList>

        <TabsContent value="lootboxes">
          <LootboxManager/>
        </TabsContent>

        <TabsContent value="cupones">
          <RewardCouponManager/>
        </TabsContent>

        <TabsContent value="oro">
          <GoldConversionManager />  
        </TabsContent>
      </Tabs>
    </div>
  );
}