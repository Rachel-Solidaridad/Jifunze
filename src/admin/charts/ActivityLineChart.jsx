import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const YELLOW = '#FFC800';
const BLACK = '#000000';

export default function ActivityLineChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eee" />
          <XAxis dataKey="label" stroke={BLACK} fontSize={11} interval="preserveStartEnd" />
          <YAxis stroke={BLACK} fontSize={11} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: BLACK, strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ border: `2px solid ${BLACK}`, borderRadius: 8, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="active"
            name="Active learners"
            stroke={BLACK}
            strokeWidth={2.5}
            dot={{ r: 3, fill: YELLOW, stroke: BLACK, strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: YELLOW, stroke: BLACK, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
