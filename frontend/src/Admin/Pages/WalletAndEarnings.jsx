import React, { useState } from "react";
import { CreditCard, Download, Eye, EyeOff, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const AdminWalletAndEarnings = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: "", bankAccount: "" });
  const [withdrawals, setWithdrawals] = useState([
    { id: 1, amount: 5000, date: "2024-05-15", status: "completed", method: "Bank Transfer" },
    { id: 2, amount: 3500, date: "2024-05-08", status: "completed", method: "Bank Transfer" },
  ]);
  const [transactions] = useState([
    { id: 1, description: "Order #1001", amount: 1200, type: "credit", date: "2024-05-20" },
    { id: 2, description: "Platform Fee", amount: -120, type: "debit", date: "2024-05-20" },
    { id: 3, description: "Order #1002", amount: 2500, type: "credit", date: "2024-05-19" },
    { id: 4, description: "Withdrawal", amount: -5000, type: "debit", date: "2024-05-15" },
  ]);

  const walletBalance = 45000;
  const totalEarnings = 156000;
  const monthlyEarnings = 28500;

  const statusStyles = {
    completed: "bg-emerald-500/10 text-emerald-300",
    pending: "bg-amber-500/10 text-amber-300",
  };

  const handleWithdraw = (event) => {
    event.preventDefault();

    if (!withdrawalForm.amount || !withdrawalForm.bankAccount) {
      toast.error("Complete all withdrawal fields.");
      return;
    }

    const amountNumber = Number(withdrawalForm.amount);
    if (amountNumber > walletBalance) {
      toast.error("Requested amount exceeds available balance.");
      return;
    }

    setWithdrawals((prev) => [
      {
        id: prev.length + 1,
        amount: amountNumber,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        method: "Bank Transfer",
      },
      ...prev,
    ]);

    toast.success("Withdrawal request submitted.");
    setWithdrawalForm({ amount: "", bankAccount: "" });
  };

  const downloadReport = () => {
    toast.success("Earnings report downloaded.");
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400/80">Platform Control</p>
            <h1 className="text-4xl font-black text-white">Wallet & Earnings</h1>
            <p className="text-sm leading-7 text-slate-300">
              Your admin finance center for tracking wallet balance, real-time earnings, withdrawal requests, and cashflow activity.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-slate-200 shadow-lg shadow-slate-950/20">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Live</p>
              <p className="text-sm font-semibold text-white">Real-time insights</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Wallet Balance</p>
              <p className="mt-3 text-3xl font-black text-white">
                {showBalance ? `₹${walletBalance.toLocaleString()}` : "••••••"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBalance((state) => !state)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/90 text-slate-200 transition hover:border-emerald-400/30 hover:text-white"
            >
              {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-6 text-sm text-slate-400">Available for withdrawal</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Total Earnings</p>
              <p className="mt-3 text-3xl font-black text-white">₹{totalEarnings.toLocaleString()}</p>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400">All-time earnings overview</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">This Month</p>
              <p className="mt-3 text-3xl font-black text-white">₹{monthlyEarnings.toLocaleString()}</p>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-violet-500/10 text-violet-300">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400">May 2024 earnings</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-black text-white">Request Withdrawal</h2>
              <p className="mt-2 text-sm text-slate-400">Submit a withdrawal request with bank details and amount.</p>
            </div>
            <span className="rounded-3xl bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              Available ₹{walletBalance.toLocaleString()}
            </span>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-5 pt-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Withdrawal Amount (₹) *</label>
              <input
                type="number"
                value={withdrawalForm.amount}
                onChange={(event) => setWithdrawalForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="Enter amount"
                max={walletBalance}
                className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Bank Account *</label>
              <select
                value={withdrawalForm.bankAccount}
                onChange={(event) => setWithdrawalForm((prev) => ({ ...prev, bankAccount: event.target.value }))}
                className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="" disabled className="text-slate-400">Select bank account</option>
                <option value="****1234">HDFC Bank - ****1234</option>
                <option value="****5678">ICICI Bank - ****5678</option>
                <option value="****9012">Axis Bank - ****9012</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              Request Withdrawal
            </button>
          </form>
        </section>

        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-white/10">
            <div>
              <h3 className="text-xl font-black text-white">Recent Withdrawals</h3>
              <p className="mt-2 text-sm text-slate-400">Latest payout activity for your admin ledger.</p>
            </div>
            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <Download className="h-4 w-4" /> Download Report
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="rounded-3xl border border-white/10 bg-slate-900/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">₹{withdrawal.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{withdrawal.method}</p>
                  </div>
                  <span className={`rounded-2xl px-3 py-1 text-xs font-bold ${statusStyles[withdrawal.status]}`}>
                    {withdrawal.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">{withdrawal.date}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Transaction History</p>
            <h2 className="mt-2 text-2xl font-black text-white">Recent Activity</h2>
          </div>
          <p className="text-sm text-slate-400">Review the latest credits, fees, and withdrawal entries.</p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[2rem] border border-white/10 bg-slate-900/90">
          <table className="min-w-full border-separate border-spacing-0 text-sm text-left">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400">
                <th className="px-5 py-4 font-semibold uppercase tracking-[0.22em]">Description</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-[0.22em]">Type</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-[0.22em]">Amount</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-[0.22em]">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-white/5 transition hover:bg-slate-900/80">
                  <td className="px-5 py-4 text-slate-200">{txn.description}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        txn.type === "credit"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-black ${txn.type === "credit" ? "text-emerald-300" : "text-rose-300"}`}>
                    {txn.type === "credit" ? "+" : "-"} ₹{Math.abs(txn.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-slate-400">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminWalletAndEarnings;
