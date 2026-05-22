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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Reports & Analytics</h2>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
          Export system spreadsheets, order performance summaries, user growths, and merchant fee listings
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-6 rounded-[2.2rem] flex flex-col justify-between shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-xl">
                  {report.type === "Revenue" ? (
                    <FileSpreadsheet className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">
                  CSV format
                </span>
              </div>
              <div>
                <h4 className="text-md font-black text-white uppercase tracking-tight mb-2">
                  {report.name}
                </h4>
                <p className="text-xs text-white/40 font-semibold leading-relaxed">
                  Contains all transaction indices, metrics, logs, and dates updated live.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleExport(report.name, report.type)}
                  className="w-full py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
