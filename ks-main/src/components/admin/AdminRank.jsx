// AdminRank.jsx
import React from "react";
import { RankManager } from "./adminRangos/RankManager";
import { XpConversionManager } from "./adminRangos/XpConvertionManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminRank() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <Tabs defaultValue="ranks" className="w-full">
        <TabsList>
          <TabsTrigger value="ranks">Rangos</TabsTrigger>
          <TabsTrigger value="xp-conversion">Conversión XP</TabsTrigger>
        </TabsList>

        <TabsContent value="ranks">
          <RankManager />
        </TabsContent>

        <TabsContent value="xp-conversion">
          <XpConversionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}