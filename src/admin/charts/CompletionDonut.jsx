import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const YELLOW = '#FFC800';
const BLACK = '#000000';
const GREY = '#D9D9C3';

const COLORS = [GREY, YELLOW, BLACK];

export default function CompletionDonut({ notStarted = 0, inProgress = 0, completed = 0 }) {
  const total = notStarted + inProgress + completed;
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No enrollment data yet.
      </div>
    );
  }

  const data = [
    { name: 'Not started', value: notStarted },
    { name: 'In progress', value: inProgress },
    { name: 'Completed', value: completed },
  ].filter(d => d.value > 0);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[['Not started', 'In progress', 'Completed'].indexOf(entry.name)]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ border: `2px solid ${BLACK}`, borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
