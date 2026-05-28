import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const YELLOW = '#FFC800';
const BLACK = '#000000';

export default function EnrollmentBarChart({ data, dataKey = 'enrollments', nameKey = 'name' }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No enrollments yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke="#eee" />
          <XAxis type="number" stroke={BLACK} fontSize={12} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey={nameKey}
            stroke={BLACK}
            fontSize={12}
            width={140}
          />
          <Tooltip
            cursor={{ fill: '#F9F5E8' }}
            contentStyle={{ border: `2px solid ${BLACK}`, borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey={dataKey} fill={YELLOW} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
