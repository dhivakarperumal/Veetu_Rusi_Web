import React, { useEffect, useState } from "react";
import { Users, Search, Grid, List, Phone, ShoppingBag, Calendar, DollarSign, TrendingUp } from "lucide-react";
import api from "../../api";
import { toast } from "react-hot-toast";
import ChefDataToolbar from "../Components/ChefDataToolbar";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    fetchOrdersAndExtractCustomers();
  }, []);

  const fetchOrdersAndExtractCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user-food-orders/chef");
      const orders = Array.isArray(res.data) ? res.data : [];
      
      const customerMap = {};
      orders.forEach(order => {
        const custKey = order.user_id || order.customer_phone || order.customer_email || `unknown-${order.id}`;
        if (!customerMap[custKey]) {
          customerMap[custKey] = {
            id: custKey,
            name: order.customer_name || "Unknown Customer",
            phone: order.customer_phone || order.phone_number || "N/A",
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.ordered_at || order.created_at || null,
          };
        }
        
        const cust = customerMap[custKey];
        cust.totalOrders += 1;
        
        // Sum total amount for this chef
        const chefAmount = parseFloat(order.chef_total_amount || order.total_amount || 0);
        cust.totalSpent += chefAmount;

        // update last order date if this order is newer
        const currentOrderDate = new Date(order.ordered_at || order.created_at || 0);
        const savedOrderDate = new Date(cust.lastOrderDate || 0);
        if (currentOrderDate > savedOrderDate) {
          cust.lastOrderDate = order.ordered_at || order.created_at;
        }
      });

      // Sort by totalSpent descending
      const sortedCustomers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(sortedCustomers);
    } catch (error) {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.toLowerCase().includes(search.toLowerCase())) &&
    (customerFilter === "All" || (customerFilter === "Repeat" && c.totalOrders > 1) || (customerFilter === "New" && c.totalOrders === 1))
  );
  const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const repeatCustomers = customers.filter((customer) => customer.totalOrders > 1).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 p-4 md:p-8 bg-linear-to-br from-[#0c1116] to-[#171a20] min-h-screen text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">My Customers</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            People who bought your food and products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Customers", value: customers.length, note: "Unique buyers", icon: Users, border: "from-blue-500/40 via-cyan-500/20", glow: "bg-blue-600/15", iconBg: "from-blue-600 to-cyan-700", shadow: "shadow-blue-700/40", labelColor: "text-blue-300/70", panel: "bg-[#13161b]" },
          { label: "Total Orders", value: totalOrders, note: "Orders from your menu", icon: ShoppingBag, border: "from-emerald-500/40 via-teal-500/20", glow: "bg-emerald-500/20", iconBg: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-600/40", labelColor: "text-emerald-300/70", panel: "bg-linear-to-br from-[#071a10] to-[#0a0e1a]" },
          { label: "Total Revenue", value: `₹${totalSpent.toLocaleString()}`, note: "Customer spend", icon: DollarSign, border: "from-amber-500/40 via-orange-500/20", glow: "bg-amber-500/20", iconBg: "from-amber-500 to-orange-600", shadow: "shadow-amber-600/40", labelColor: "text-amber-300/70", panel: "bg-linear-to-br from-[#1a1004] to-[#0a0e1a]" },
          { label: "Repeat Customers", value: repeatCustomers, note: "More than one order", icon: TrendingUp, border: "from-rose-500/40 via-red-500/20", glow: "bg-rose-500/20", iconBg: "from-rose-500 to-red-600", shadow: "shadow-rose-600/40", labelColor: "text-rose-300/70", panel: "bg-linear-to-br from-[#1a0a0a] to-[#0a0e1a]" },
        ].map(({ label, value, note, icon: Icon, border, glow, iconBg, shadow, labelColor, panel }) => (
          <div key={label} className={`relative overflow-hidden group rounded-2xl p-px bg-linear-to-br ${border} to-transparent hover:-translate-y-1 transition-all duration-300`}>
            <div className={`relative ${panel} rounded-2xl p-6 flex items-center gap-4 h-full`}><div className={`absolute -top-6 -right-6 w-28 h-28 ${glow} rounded-full blur-2xl pointer-events-none`} /><div className={`relative shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br ${iconBg} flex items-center justify-center shadow-lg ${shadow}`}><Icon className="w-6 h-6 text-white" /></div><div><p className={`text-[10px] ${labelColor} font-black uppercase tracking-[0.2em]`}>{label}</p><h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{value}</h4><p className="text-[10px] text-white/25 font-semibold mt-1">{note}</p></div></div>
          </div>
        ))}
      </div>

      <ChefDataToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search by customer name or phone..."
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        filters={<select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none font-bold text-xs uppercase tracking-widest text-slate-200 focus:border-emerald-500/70 cursor-pointer"><option value="All">All Customers</option><option value="Repeat">Repeat Buyers</option><option value="New">First Order</option></select>}
      />

      {/* Data View */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-200">
              <thead>
                <tr className="border-b border-white/5 bg-[#070b13]/30">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">S.No</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Customer Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Orders</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Spent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Last Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((customer, idx) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-white/90">{idx + 1}</td>
                    <td className="px-6 py-5 text-sm font-bold text-white/90">{customer.name}</td>
                    <td className="px-6 py-5 text-sm text-white/60">{customer.phone}</td>
                    <td className="px-6 py-5 text-sm font-black text-emerald-400">{customer.totalOrders}</td>
                    <td className="px-6 py-5 text-sm font-black text-white">₹{customer.totalSpent.toLocaleString()}</td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer, idx) => (
            <div key={customer.id} className="bg-[#0B1120]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:bg-[#070b13]/80 transition-all group shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <span className="text-lg font-black text-emerald-400">{customer.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">#{idx + 1}</span>
              </div>
              
              <h3 className="text-xl font-black text-white truncate mb-1" title={customer.name}>{customer.name}</h3>
              <div className="flex items-center gap-2 text-white/50 text-sm font-semibold mb-6">
                <Phone className="w-3.5 h-3.5" />
                <span>{customer.phone}</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Orders</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{customer.totalOrders}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                    <span className="font-sans font-black">₹</span>
                    <span>Spent</span>
                  </div>
                  <span className="text-sm font-black text-white">₹{customer.totalSpent.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Last Order</span>
                  </div>
                  <span className="text-[11px] font-bold text-white/60">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/30 italic text-sm">
              No customers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Customers;
