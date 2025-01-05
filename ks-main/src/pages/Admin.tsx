import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from "@/components/admin/StatsCards";
import { ExpensesChart } from "@/components/ExpensesChart";
import { RevenueChart } from "@/components/admin/RevenueChart";
import {obtenerActualizaciones} from '@/services/champsService'
import {AdministrarPrecios} from '@/components/admin/AdministrarPrecios'
import {AdminCuentas} from '@/components/admin/AdminCuentas'
import AdminProducts from '@/components/admin/AdminProducts'
import {AdminRank} from '@/components/admin/AdminRank'
import {AdminRecompensas} from '@/components/admin/AdminRecompensas'
import {AdminPedidos} from '@/components/admin/AdminPedidos'

const Admin = () => {
  console.log("Admin component rendering");

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
        
        <Tabs defaultValue="overview" className="space-y-6">
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
            <StatsCards />
            
            <div className="grid gap-6 mt-6">
              <ExpensesChart />
              <RevenueChart />
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Productos</CardTitle>
                <CardDescription>Administra tu catálogo de productos aquí.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProducts/>
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
    </div>
  );
};

export default Admin;