import React from 'react';

const ChartCard = ({ title, subtitle, icon: Icon, iconColor, children }) => (
  <div className="bg-slate-950/90 rounded-[2rem] p-6 shadow-2xl shadow-black/30 border border-white/10">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
    </div>
    {children}
  </div>
);

export default ChartCard;
