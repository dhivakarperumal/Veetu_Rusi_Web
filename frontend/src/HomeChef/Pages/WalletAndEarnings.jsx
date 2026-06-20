import React, { useState } from "react";
import { CreditCard, Download, Eye, EyeOff, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const WalletAndEarnings = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawals, setWithdrawals] = useState([
    {
      id: 1,
      amount: 5000,
      date: "2024-05-15",
      status: "completed",
      method: "Bank Transfer",
    },
    {
      id: 2,
      amount: 3500,
      date: "2024-05-08",
      status: "completed",
      method: "Bank Transfer",
    },
  ]);

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      description: "Order #1001",
      amount: 1200,
      type: "credit",
      date: "2024-05-20",
    },
    {
      id: 2,
      description: "Platform Fee",
      amount: -120,
      type: "debit",
      date: "2024-05-20",
    },
    {
      id: 3,
      description: "Order #1002",
      amount: 2500,
      type: "credit",
      date: "2024-05-19",
    },
    {
      id: 4,
      description: "Withdrawal",
      amount: -5000,
      type: "debit",
      date: "2024-05-15",
    },
  ]);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    bankAccount: "",
  });

  const walletBalance = 45000;
  const totalEarnings = 156000;
  const monthlyEarnings = 28500;

  const handleWithdraw = (e) => {
    e.preventDefault();
    if (!withdrawalForm.amount || !withdrawalForm.bankAccount) {
      toast.error("Please fill all fields");
      return;
    }

    if (parseInt(withdrawalForm.amount) > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setWithdrawals([
      ...withdrawals,
      {
        id: withdrawals.length + 1,
        amount: parseInt(withdrawalForm.amount),
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        method: "Bank Transfer",
      },
    ]);

    toast.success("Withdrawal request submitted!");
    setWithdrawalForm({ amount: "", bankAccount: "" });
  };

  const downloadReport = () => {
    toast.success("Report downloaded!");
  };

  const statusColors = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
  };

  const pendingWithdrawals = withdrawals.filter((item) => item.status === "pending").length;
  const completedWithdrawals = withdrawals.filter((item) => item.status === "completed").length;
  const recentActivity = [
    { label: "14-day earnings", value: "₹72,400", change: "+18.2%", trend: "up" },
    { label: "Withdrawal limit", value: "₹50,000", change: "4.8%", trend: "down" },
    { label: "Daily average", value: "₹8,900", change: "+9.1%", trend: "up" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Wallet & Earnings</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">
            Manage your funds, review withdrawals, and track performance in one place.
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" /> Export summary
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                  Wallet balance
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight">
                  {showBalance ? `₹${walletBalance.toLocaleString()}` : "••••••"}
                </p>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              >
                {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-400">Available to withdraw immediately.</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">
                  Total earnings
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight">
                  ₹{totalEarnings.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-white/90" />
            </div>
            <p className="mt-4 text-sm text-emerald-100/90">All-time earnings across every sale.</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-violet-100">
                  Monthly revenue
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight">
                  ₹{monthlyEarnings.toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-white/90" />
            </div>
            <p className="mt-4 text-sm text-violet-100/90">May 2024 performance snapshot.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950/95 p-6 shadow-xl ring-1 ring-white/10 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Performance insights</p>
              <p className="mt-2 text-2xl font-black">Revenue pulse</p>
            </div>
            <div className="rounded-2xl bg-slate-900/90 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
              Live
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {recentActivity.map((item) => (
              <div key={item.label} className="rounded-3xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-xl font-bold text-white">{item.value}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.trend === "up" ? "bg-emerald-100/15 text-emerald-300" : "bg-rose-100/15 text-rose-300"}`}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {[
              { label: "Pending withdrawals", value: pendingWithdrawals, accent: "bg-yellow-400/15 text-yellow-200" },
              { label: "Completed payouts", value: completedWithdrawals, accent: "bg-emerald-400/15 text-emerald-200" },
              { label: "Withdrawal approval", value: "98%", accent: "bg-sky-400/15 text-sky-200" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                  <span>{stat.label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stat.accent}`}>{stat.value}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-white/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Request Withdrawal</h2>
              <p className="mt-2 text-sm text-slate-500">
                Submit a withdrawal request and track progress from the list.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Balance available: ₹{walletBalance.toLocaleString()}
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Withdrawal Amount</label>
              <input
                type="number"
                value={withdrawalForm.amount}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    amount: e.target.value,
                  })
                }
                placeholder="₹0.00"
                max={walletBalance}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Bank Account</label>
              <select
                value={withdrawalForm.bankAccount}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    bankAccount: e.target.value,
                  })
                }
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
              >
                <option value="">Select bank account</option>
                <option value="****1234">HDFC Bank - ****1234</option>
                <option value="****5678">ICICI Bank - ****5678</option>
                <option value="****9012">Axis Bank - ****9012</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                Request Withdrawal
              </button>
            </div>
          </form>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Pending requests</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{pendingWithdrawals}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Withdrawn this month</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">₹{withdrawals.filter((w) => w.status === "completed").reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Active payout method</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Bank Transfer</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Recent Withdrawals</h2>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              Latest 5
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {withdrawals.slice(0, 5).map((withdrawal) => (
              <div key={withdrawal.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">₹{withdrawal.amount.toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-500">{withdrawal.method}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[withdrawal.status]}`}>
                    {withdrawal.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{withdrawal.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
            <p className="mt-2 text-sm text-slate-500">All payments, fees, and withdrawal flows in one timeline.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Transactions</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{transactions.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Net gain</p>
              <p className="mt-2 text-xl font-bold text-emerald-600">₹{(transactions.reduce((sum, txn) => sum + txn.amount, 0)).toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Latest entry</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{transactions[0]?.date}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-slate-200">
            <thead>
              <tr>
                <th className="pb-3 pl-6 pr-4 font-semibold uppercase tracking-[0.2em] text-slate-500">Description</th>
                <th className="pb-3 px-4 font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                <th className="pb-3 px-4 font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
                <th className="pb-3 px-4 font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="rounded-[30px] bg-slate-50 shadow-sm">
                  <td className="py-4 pl-6 pr-4 font-semibold text-slate-900">{txn.description}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${txn.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className={`py-4 px-4 font-semibold ${txn.type === "credit" ? "text-emerald-700" : "text-rose-700"}`}>
                    {txn.type === "credit" ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-slate-500">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalletAndEarnings;
