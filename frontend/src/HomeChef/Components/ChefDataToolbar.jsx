import { Search, Filter, List, LayoutGrid } from "lucide-react";

const ChefDataToolbar = ({
  search,
  onSearch,
  placeholder,
  filters,
  viewMode,
  onViewModeChange,
}) => (
  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 p-4 rounded-[1.75rem] shadow-2xl shadow-slate-950/30">
    <div className="relative flex-1 max-w-xl w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none font-medium text-slate-100 text-sm focus:bg-slate-900 focus:border-emerald-500/70 transition-all placeholder:text-slate-500"
      />
    </div>
    <div className="flex flex-wrap items-center gap-3 self-end xl:self-auto">
      {filters && (
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          {filters}
        </div>
      )}
      {viewMode && onViewModeChange && (
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-3 rounded-xl transition ${viewMode === "table" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-100"}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("card")}
            className={`p-3 rounded-xl transition ${viewMode === "card" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-100"}`}
            title="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
);

export default ChefDataToolbar;
