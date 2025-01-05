// AdminRank.jsx
import React from "react";
import { PedidosManager } from "./adminPedidos/PedidosManager";
import { EstadosManager } from "./adminPedidos/EstadosManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminPedidos() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="estados">Estados</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <PedidosManager />
        </TabsContent>

        <TabsContent value="estados">
          <EstadosManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}