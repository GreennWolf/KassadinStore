import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Lun', value: 6000 },
  { name: 'Mar', value: 6200 },
  { name: 'Mie', value: 6100 },
  { name: 'Jue', value: 6400 },
  { name: 'Vie', value: 6240 },
  { name: 'Sab', value: 6800 },
  { name: 'Dom', value: 7100 },
];

export const ExpensesChart = () => {
  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm text-muted-foreground">Total Pedidos</h3>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">7,100</p>
            <span className="text-emerald-500 text-sm">+15%</span>
          </div>
        </div>
      </div>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              hide={true}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};