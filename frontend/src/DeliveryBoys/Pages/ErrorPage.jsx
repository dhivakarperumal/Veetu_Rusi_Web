import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiArrowLeft } from 'react-icons/fi';

const ErrorPage = () => {
    const error = useRouteError();
    console.error(error);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-slate-950/95 rounded-[2.5rem] shadow-2xl shadow-black/40 p-12 text-center border border-white/10 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-red-900/80 text-red-400 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner border border-red-500/20 animate-bounce">
                    <FiAlertCircle />
                </div>

                <h1 className="text-4xl font-black text-slate-100 tracking-tight mb-4">
                    Oops!
                </h1>

                <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs italic">
                    {error.statusText || error.message || "An unexpected error occurred"}
                </p>

                <div className="space-y-4">
                    <Link
                        to="/admin"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <FiHome /> Back to Dashboard
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                        <FiArrowLeft /> Go Back
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Error ID: {error.status || "500"} • Palace Artisan Admin
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
