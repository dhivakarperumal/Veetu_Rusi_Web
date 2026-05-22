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

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Wallet & Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your earnings and manage withdrawals
        </p>
      </div>

      {/* Main Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold opacity-90">Wallet Balance</p>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-white hover:text-blue-100"
            >
              {showBalance ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
          <h2 className="text-4xl font-black">
            {showBalance ? `₹${walletBalance.toLocaleString()}` : "••••••"}
          </h2>
          <p className="text-xs opacity-75 mt-2">Available for withdrawal</p>
        </div>

        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold opacity-90">Total Earnings</p>
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="text-4xl font-black">₹{totalEarnings.toLocaleString()}</h2>
          <p className="text-xs opacity-75 mt-2">All time earnings</p>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold opacity-90">This Month</p>
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-4xl font-black">₹{monthlyEarnings.toLocaleString()}</h2>
          <p className="text-xs opacity-75 mt-2">May 2024 earnings</p>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Request Withdrawal
            </h2>

            <form onSubmit={handleWithdraw} className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Withdrawal Amount (₹) *
                </label>
                <input
                  type="number"
                  value={withdrawalForm.amount}
                  onChange={(e) =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                  max={walletBalance}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-600 mt-2">
                  Available: ₹{walletBalance.toLocaleString()}
                </p>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Bank Account *
                </label>
                <select
                  value={withdrawalForm.bankAccount}
                  onChange={(e) =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      bankAccount: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select bank account</option>
                  <option value="****1234">HDFC Bank - ****1234</option>
                  <option value="****5678">ICICI Bank - ****5678</option>
                  <option value="****9012">Axis Bank - ****9012</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
              >
                Request Withdrawal
              </button>
            </form>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Recent Withdrawals
          </h2>

          <div className="space-y-3">
            {withdrawals.slice(0, 5).map((withdrawal) => (
              <div key={withdrawal.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">
                    ₹{withdrawal.amount}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      statusColors[withdrawal.status]
                    }`}
                  >
                    {withdrawal.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{withdrawal.date}</p>
              </div>
            ))}
          </div>

          <button
            onClick={downloadReport}
            className="mt-4 w-full px-4 py-2 border border-blue-500 text-blue-600 font-bold rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Transaction History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left text-sm font-bold text-gray-600 py-3">
                  Description
                </th>
                <th className="text-left text-sm font-bold text-gray-600 py-3">
                  Type
                </th>
                <th className="text-left text-sm font-bold text-gray-600 py-3">
                  Amount
                </th>
                <th className="text-left text-sm font-bold text-gray-600 py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 text-gray-700">{txn.description}</td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        txn.type === "credit"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td
                    className={`py-4 font-bold ${
                      txn.type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {txn.type === "credit" ? "+" : ""} ₹{Math.abs(
                      txn.amount
                    ).toLocaleString()}
                  </td>
                  <td className="py-4 text-gray-600">{txn.date}</td>
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
