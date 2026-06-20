import React from 'react';

const AdvancedCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-[#1e2430] border border-slate-800 text-white rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
};

export default AdvancedCard;
