import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ordersByType = [
  { name: 'Boost', value: 65 },
  { name: 'Coaching', value: 25 },
  { name: 'Account', value: 10 },
];

export const OrdersByType = () => {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Distribución por Tipo</CardTitle>
        <CardDescription>Porcentaje de órdenes por categoría</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ordersByType.map((type) => (
            <div key={type.name} className="flex items-center">
              <div className="w-full flex items-center gap-2">
                <div className="h-2 rounded-full bg-primary flex-1" style={{ 
                  width: `${type.value}%`,
                  opacity: type.name === 'Boost' ? 1 : type.name === 'Coaching' ? 0.7 : 0.4
                }}/>
                <span className="text-sm font-medium">{type.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">{type.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};