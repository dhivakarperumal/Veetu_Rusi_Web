import React from "react";

const AdminStatCard = ({
  icon: Icon,
  label,
  value,
  description,
  gradient = "linear-gradient(135deg,#0f1628 0%,#0a0e1a 100%)",
  iconGradient = "linear-gradient(135deg,#7C3AED 0%,#4338CA 100%)",
  glow = "rgba(124,58,237,0.22)",
  borderGradient = iconGradient,
  onClick
}) => {
  const iconContent = React.isValidElement(Icon) ? Icon : <Icon className="w-6 h-6 text-white" />;
  const content = (
    <>
      <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full blur-2xl pointer-events-none" style={{ background: glow }} />
      <div className="relative z-10 flex items-center gap-5">
        <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: iconGradient }}>
          {iconContent}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{label}</p>
          <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{value}</h4>
          {description && <p className="text-[10px] text-white/35 font-semibold mt-2">{description}</p>}
        </div>
      </div>
    </>
  );

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden group rounded-2xl p-[1px] hover:-translate-y-1 transition-all duration-300 ${onClick ? "cursor-pointer" : ""}`}
      style={{ background: borderGradient }}
    >
      <div className="relative rounded-2xl p-6 flex items-center gap-5 h-full" style={{ background: gradient }}>
        {content}
      </div>
    </div>
  );
};

export default AdminStatCard;
