import React from "react";

const DeliverySummaryCards = ({ cards, loading = false }) => (
  <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${cards.length > 3 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
    {cards.map((card) => {
      const Icon = card.icon;
      return (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:-translate-y-1"
          style={{
            background: `linear-gradient(135deg, ${card.borderColor || card.iconColor}66, ${card.borderColor || card.iconColor}22 55%, transparent)`,
          }}
        >
          <div
            className="relative flex h-full items-center gap-5 overflow-hidden rounded-2xl p-6"
            style={{ background: `linear-gradient(135deg, ${card.surfaceColor} 0%, #0a0e1a 100%)` }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl"
              style={{ backgroundColor: `${card.borderColor || card.iconColor}26` }}
            />
            <div
              className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${card.iconColor}, ${card.iconColor}bb)`,
                boxShadow: `0 12px 28px ${card.iconColor}40`,
              }}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="relative min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: `${card.iconColor}bb` }}>
                {card.label}
              </p>
              <h3 className="mt-1 text-4xl font-black leading-none tracking-tight text-white">
                {loading ? "--" : card.value}
              </h3>
              {card.description && <p className="mt-2 text-[10px] font-semibold text-white/30">{card.description}</p>}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default DeliverySummaryCards;
