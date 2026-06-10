import React from 'react';

const ChartCard = ({ title, subtitle, icon: Icon, iconColor, children }) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
    </div>
    {children}
  </div>
);

export default ChartCard;
