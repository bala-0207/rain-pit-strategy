import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SimpleChart = ({ data, type = 'line', dataKeys, colors, xKey = 'timestamp' }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-racing-gray border border-racing-red p-3 rounded-lg shadow-xl">
          <p className="text-sm text-gray-400 mb-2">{payload[0].payload[xKey]}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-bold">{entry.name}:</span> {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartConfig = {
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} {...chartConfig}>
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[index]} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#38383F" />
          <XAxis 
            dataKey={xKey} 
            stroke="#E8E8E8" 
            tick={{ fill: '#E8E8E8' }}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes(':')) {
                return value.split(' ')[1]?.substring(0, 5) || value;
              }
              return value;
            }}
          />
          <YAxis stroke="#E8E8E8" tick={{ fill: '#E8E8E8' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#E8E8E8' }} />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index]}
              fillOpacity={1}
              fill={`url(#color${key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} {...chartConfig}>
        <CartesianGrid strokeDasharray="3 3" stroke="#38383F" />
        <XAxis 
          dataKey={xKey} 
          stroke="#E8E8E8" 
          tick={{ fill: '#E8E8E8' }}
          tickFormatter={(value) => {
            if (typeof value === 'string' && value.includes(':')) {
              return value.split(' ')[1]?.substring(0, 5) || value;
            }
            return value;
          }}
        />
        <YAxis stroke="#E8E8E8" tick={{ fill: '#E8E8E8' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#E8E8E8' }} />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SimpleChart;
