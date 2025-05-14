import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const data = [
  { name: 'Ene', orders: 4000 },
  { name: 'Feb', orders: 3000 },
  { name: 'Mar', orders: 2000 },
  { name: 'Abr', orders: 2780 },
  { name: 'May', orders: 1890 },
  { name: 'Jun', orders: 2390 },
  { name: 'Jul', orders: 3490 },
];

export const OrdersChart = () => {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Órdenes por Día</CardTitle>
        <CardDescription>Distribución de órdenes en el tiempo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            className="h-[300px]"
            config={{
              orders: {
                theme: {
                  light: "#2563eb",
                  dark: "#3b82f6",
                },
              },
            }}
          >
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#666666" />
              <YAxis stroke="#666666" />
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
              <Tooltip content={<ChartTooltip />} />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#ordersGradient)" 
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};