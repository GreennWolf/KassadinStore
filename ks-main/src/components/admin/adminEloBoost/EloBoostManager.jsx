import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EloBoostRanksManager from './EloBoostRanksManager';
import EloBoostConfigManager from './EloBoostConfigManager';
import EloBoostOrdersManager from './EloBoostOrdersManager';
import EloBoostDashboard from './EloBoostDashboard';

const EloBoostManager = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Cambia el título de la página según la pestaña activa
  useEffect(() => {
    document.title = `Admin - Elo Boost - ${getTabTitle(activeTab)}`;
  }, [activeTab]);

  // Obtener título de la pestaña
  const getTabTitle = (tab) => {
    switch (tab) {
      case "dashboard": return "Dashboard";
      case "ranks": return "Rangos";
      case "config": return "Configuración";
      case "orders": return "Órdenes";
      default: return "Dashboard";
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestión de Elo Boost</h1>
        <p className="text-muted-foreground">
          Administre rangos, configuraciones y órdenes del servicio de Elo Boost
        </p>
      </div>

      <Tabs
        defaultValue="dashboard"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ranks">Rangos</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <EloBoostDashboard />
        </TabsContent>

        <TabsContent value="ranks" className="mt-6">
          <EloBoostRanksManager />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <EloBoostConfigManager />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <EloBoostOrdersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EloBoostManager;