import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/dashboard/AdminOverview";
import { obtenerActualizaciones } from '@/services/champsService';
import { AdministrarPrecios } from '@/components/admin/AdministrarPrecios';
import { AdminCuentas } from '@/components/admin/AdminCuentas';
import AdminProducts from '@/components/admin/AdminProducts';
import { AdminRank } from '@/components/admin/AdminRank';
import { AdminRecompensas } from '@/components/admin/AdminRecompensas';
import { AdminPedidos } from '@/components/admin/AdminPedidos';
import { useEffect, useState } from "react";
import { toast, ToastContainer } from 'react-toastify';

const Admin = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [loggedAdmin, setLoggedAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (loggedUser) {
      const user = JSON.parse(loggedUser);
      if (user.role !== "admin") {
        window.location.href = "/";
        setLoggedAdmin(false);
        return null;
      } else {
        setLoggedAdmin(true);
      }
    } else {
      window.location.href = "/";
      setLoggedAdmin(false);
      return null;
    }
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  if (loggedAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Vista General</TabsTrigger>
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="users">Usuarios</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger>
              <TabsTrigger value="ranks">Rangos</TabsTrigger>
              <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
            </TabsList>
  
            <TabsContent value="overview">
              <Card>
                <CardContent className="pt-6">
                  <AdminOverview />
                </CardContent>
              </Card>
            </TabsContent>
  
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Productos</CardTitle>
                  <CardDescription>Administra tu catálogo de productos aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminProducts isUpdating={isUpdating} setIsUpdating={setIsUpdating}/>
                </CardContent>
              </Card>
            </TabsContent>
  
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Pedidos</CardTitle>
                  <CardDescription>Visualiza y gestiona los pedidos aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPedidos/>
                </CardContent>
              </Card>
            </TabsContent>
  
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>Administra los usuarios de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminCuentas/>
                </CardContent>
              </Card>
            </TabsContent>
  
            <TabsContent value="prices">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Precios</CardTitle>
                  <CardDescription>Administra los Precios de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdministrarPrecios />
                </CardContent>
              </Card>
            </TabsContent>
  
            <TabsContent value="ranks">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Rangos</CardTitle>
                  <CardDescription>Administra los Rangos y la XP de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminRank />
                </CardContent>
              </Card>
            </TabsContent>
  
            <TabsContent value="recompensas">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Recompensas</CardTitle>
                  <CardDescription>Administra las Recompensas</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminRecompensas/>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <ToastContainer />
      </div>
    );
  } else {
    return (
      <div><h1>No eres admin lo siento</h1></div>
    );
  }
};

export default Admin;