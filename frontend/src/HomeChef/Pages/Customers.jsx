import React, { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import api from "../../api";
import { toast } from "react-hot-toast";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        if (!customerMap[order.customer_id]) {
          customerMap[order.customer_id] = {
            id: order.customer_id,
            name: order.customer_name || "Unknown Customer",
            phone: order.customer_phone || order.phone_number || "N/A",
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.ordered_at || order.created_at || null,
          };
        }
        
        const cust = customerMap[order.customer_id];
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
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 p-4 md:p-8 bg-gradient-to-br from-[#0c1116] to-[#171a20] min-h-screen text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">My Customers</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            People who bought your food and products
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[1.1rem] overflow-hidden shadow-xl">
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
                    <td colSpan="5" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
