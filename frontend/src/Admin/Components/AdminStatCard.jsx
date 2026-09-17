import React from "react";

const getAccentStyles = (iconGradient) => {
  if (iconGradient.includes("#10B981")) {
    return {
      labelColor: "rgba(110,231,183,0.7)",
      borderGradient: "linear-gradient(135deg,rgba(16,185,129,0.4),rgba(20,184,166,0.2),transparent)"
    };
  }
  if (iconGradient.includes("#F59E0B")) {
    return {
      labelColor: "rgba(253,230,138,0.7)",
      borderGradient: "linear-gradient(135deg,rgba(245,158,11,0.4),rgba(249,115,22,0.2),transparent)"
    };
  }
  if (iconGradient.includes("#F43F5E")) {
    return {
      labelColor: "rgba(253,164,175,0.7)",
      borderGradient: "linear-gradient(135deg,rgba(244,63,94,0.4),rgba(220,38,38,0.2),transparent)"
    };
  }
  if (iconGradient.includes("#3B82F6")) {
    return {
      labelColor: "rgba(147,197,253,0.7)",
      borderGradient: "linear-gradient(135deg,rgba(59,130,246,0.4),rgba(37,99,235,0.2),transparent)"
    };
  }
  return {
    labelColor: "rgba(196,181,253,0.7)",
    borderGradient: "linear-gradient(135deg,rgba(139,92,246,0.3),rgba(99,102,241,0.2),transparent)"
  };
};

const AdminStatCard = ({
  icon: Icon,
  label,
  value,
  description,
  gradient = "linear-gradient(135deg,#0f1628 0%,#0a0e1a 100%)",
  iconGradient = "linear-gradient(135deg,#7C3AED 0%,#4338CA 100%)",
  glow = "rgba(124,58,237,0.22)",
  borderGradient,
  labelColor,
  onClick
}) => {
  const accentStyles = getAccentStyles(iconGradient);
  const resolvedBorderGradient = borderGradient || accentStyles.borderGradient;
  const resolvedLabelColor = labelColor || accentStyles.labelColor;
  const iconContent = React.isValidElement(Icon) ? Icon : <Icon className="w-6 h-6 text-white" />;
  const content = (
    <>
      <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full blur-2xl pointer-events-none" style={{ background: glow }} />
      <div className="relative z-10 flex items-center gap-5">
        <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: iconGradient }}>
          {iconContent}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: resolvedLabelColor }}>{label}</p>
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
      style={{ background: resolvedBorderGradient }}
    >
      <div className="relative rounded-2xl p-6 flex items-center gap-5 h-full" style={{ background: gradient }}>
        {content}
      </div>
    </div>
  );
};

export default AdminStatCard;
