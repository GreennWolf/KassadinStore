import React, { useState } from "react";
import { UsuariosManager } from "./adminUsuarios/UsuariosManager";
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerfilImageManager } from "./adminUsuarios/PerfilImageManager";

export function AdminCuentas() {
    return (
        <div className="w-full">
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                    <TabsTrigger value="perfilImages">Imagenes de Perfil</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsuariosManager />
                </TabsContent>

                <TabsContent value="perfilImages">
                    <PerfilImageManager/>
                </TabsContent>
            </Tabs>
        </div>
    );
}