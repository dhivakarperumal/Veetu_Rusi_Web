import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const formatAmount = (val) =>
  val != null ? `₹${Number(val).toFixed(2)}` : "₹0.00";

const FoodOrderDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const order = state?.order;

  if (!order) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold">
          No Order Data Found
        </h2>
      </div>
    );
  }

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const chefGroups = items.reduce((acc, item) => {
    const chef =
      item.chef_name ||
      item.chef ||
      item.created_by_name ||
      "Unknown Chef";

    if (!acc[chef]) {
      acc[chef] = {
        name: chef,
        total: 0,
        quantity: 0,
        items: [],
      };
    }

    const qty = Number(item.quantity || 1);
    const price = Number(
      item.price ||
      item.final_price ||
      item.mrp ||
      0
    );

    acc[chef].items.push(item);
    acc[chef].quantity += qty;
    acc[chef].total += qty * price;

    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-2xl font-black">
          {order.order_id}
        </h2>

        <div className="mt-4 grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-500 text-sm">
              Customer
            </p>
            <p className="font-semibold">
              {order.customer_name ||
                order.ordered_by_name}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Status
            </p>
            <p className="font-semibold">
              {order.status}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Amount
            </p>
            <p className="font-semibold text-emerald-600">
              {formatAmount(order.total_amount)}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Order ID
            </p>
            <p className="font-semibold">
              {order.order_id}
            </p>
          </div>
        </div>
      </div>

      {Object.values(chefGroups).map((group) => (
        <div
          key={group.name}
          className="bg-white border rounded-2xl p-5"
        >
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                {group.name}
              </h3>

              <p className="text-gray-500">
                {group.items.length} items · Qty {group.quantity}
              </p>
            </div>

            <div className="text-xl font-black text-emerald-600">
              {formatAmount(group.total)}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {group.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-4"
              >
                <h4 className="font-semibold">
                  {item.name}
                </h4>

                <p className="text-gray-500 text-sm">
                  Qty {item.quantity || 1}
                </p>

                <p className="font-semibold text-emerald-600">
                  {formatAmount(
                    (item.quantity || 1) *
                    (item.price ||
                      item.final_price ||
                      item.mrp ||
                      0)
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FoodOrderDetails;