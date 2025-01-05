import React, { useState } from "react";
import { CurrenciesManager } from "./adminPrecios/CurrenciesManager";
import { RpPricesManager } from "./adminPrecios/RpPricesManager";
import { RpConversionsManager } from "./adminPrecios/RpConversionsManager";
import { PaymentMethodsManager } from "./adminPrecios/PaymentMethodsManager";
import { CuponsManager } from "./adminPrecios/CuponManager";
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdministrarPrecios() {
    return (
        <div className="w-full">
            <Tabs defaultValue="currencies" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="currencies">Divisas</TabsTrigger>
                    <TabsTrigger value="rpPrices">Precios de RP</TabsTrigger>
                    <TabsTrigger value="rpConversions">Conversión de RP</TabsTrigger>
                    <TabsTrigger value="cupons">Cupones</TabsTrigger>
                    <TabsTrigger value="paymentMethods">Métodos de Pago</TabsTrigger>
                </TabsList>

                <TabsContent value="currencies">
                    <CurrenciesManager />
                </TabsContent>

                <TabsContent value="rpPrices">
                    <RpPricesManager />
                </TabsContent>

                <TabsContent value="rpConversions">
                    <RpConversionsManager />
                </TabsContent>

                <TabsContent value="cupons">
                    <CuponsManager />
                </TabsContent>

                <TabsContent value="paymentMethods">
                    <PaymentMethodsManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}