import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const data = [
  { name: '1D', value: 14200 },
  { name: '2D', value: 14100 },
  { name: '3D', value: 14800 },
  { name: '4D', value: 14300 },
  { name: '5D', value: 14480 },
];

export const BalanceChart = () => {
  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm text-muted-foreground">Total Balance</h3>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">$14,480.24</p>
            <span className="text-primary text-sm">+5%</span>
          </div>
        </div>
        <select className="bg-accent text-white px-2 py-1 rounded-lg">
          <option>USD</option>
        </select>
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};