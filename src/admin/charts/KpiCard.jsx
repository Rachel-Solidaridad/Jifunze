import React from 'react';

const YELLOW = '#FFC800';

export default function KpiCard({ icon: Icon, label, value, sublabel, accent = YELLOW }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ backgroundColor: '#F9F5E8' }}
      >
        {Icon ? <Icon size={22} className="text-black" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 truncate">
          {label}
        </div>
        <div className="mt-0.5 text-2xl md:text-3xl font-extrabold tracking-tight text-black">
          {value}
        </div>
        {sublabel ? (
          <div className="mt-0.5 text-xs text-gray-500 truncate">{sublabel}</div>
        ) : null}
      </div>
      <div className="hidden sm:block w-1 h-10 rounded-full" style={{ backgroundColor: accent }} />
    </div>
  );
}
