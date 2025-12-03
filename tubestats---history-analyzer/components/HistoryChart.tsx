import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Brush } from 'recharts';
import { VideoEntry, TimeGranularity, ChartDataPoint } from '../types';

interface HistoryChartProps {
  data: VideoEntry[];
  granularity: TimeGranularity;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ data, granularity }) => {
  const chartData = useMemo(() => {
    const map = new Map<string, ChartDataPoint>();

    data.forEach(entry => {
      const date = new Date(entry.date);
      let key = '';
      let sortValue = 0;

      if (granularity === 'day') {
        key = date.toLocaleDateString();
        // Use midnight timestamp for simpler sorting
        sortValue = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      } else if (granularity === 'month') {
        key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        sortValue = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      } else {
        key = date.getFullYear().toString();
        sortValue = new Date(date.getFullYear(), 0, 1).getTime();
      }

      if (!map.has(key)) {
        map.set(key, { name: key, count: 0, dateValue: sortValue });
      }
      const item = map.get(key)!;
      item.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.dateValue - b.dateValue);
  }, [data, granularity]);

  return (
    <div className="h-[450px] w-full bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-200">Watch History ({granularity})</h3>
        <div className="text-xs text-gray-500">
             {granularity === 'day' ? 'Tip: Drag the slider below to zoom in on specific dates' : ''}
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#888" 
              tick={{fill: '#888', fontSize: 12}}
              minTickGap={50}
            />
            <YAxis 
              stroke="#888" 
              tick={{fill: '#888', fontSize: 12}} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#2a2a2a', border: 'none', borderRadius: '8px', color: '#fff' }}
              cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
            />
            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Brush 
                dataKey="name" 
                height={30} 
                stroke="#888888"
                fill="#1e1e1e"
                travellerWidth={10}
                tickFormatter={(value) => value} // Just show the string key
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};