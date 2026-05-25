import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { BarChart3, FileSpreadsheet, Download, FileText } from "lucide-react";

const ReportsAnalytics = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/reports");
      setReports(res.data);
    } catch (error) {
      toast.error("Failed to load available reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (reportName, type) => {
    toast.success(`Exporting ${reportName} in CSV format...`);
    
    // Simulate generation and download
    const dummyCSV = "ID,Name,Value,Date\n1,Annapoorna Veg,45000,2026-05-19\n2,Saraswathi Kitchen,32000,2026-05-19";
    const blob = new Blob([dummyCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `${reportName.toLowerCase().replace(/ /g, "_")}.csv`);
    a.click();
  };

  return (
    <div className="p-6 space-y-6 min-h-screen font-sans animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Reports & Analytics</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
          Export system spreadsheets, order performance summaries, user growths, and merchant fee listings
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => {
            // Cycle through some border colors for visual variety
            const borderColors = ["border-l-emerald-500", "border-l-blue-500", "border-l-purple-500", "border-l-amber-500"];
            const bgColors = ["bg-emerald-50", "bg-blue-50", "bg-purple-50", "bg-amber-50"];
            const textColors = ["text-emerald-600", "text-blue-600", "text-purple-600", "text-amber-600"];
            
            const colorIndex = index % borderColors.length;

            return (
              <div
                key={report.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between border-l-[6px] ${borderColors[colorIndex]} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${bgColors[colorIndex]} ${textColors[colorIndex]}`}>
                    {report.type === "Revenue" ? (
                      <FileSpreadsheet className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                    CSV format
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                    {report.name}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Contains all transaction indices, metrics, logs, and dates updated live.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleExport(report.name, report.type)}
                    className="w-full py-3 bg-[#1b4332] hover:bg-[#143425] text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;

