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
        <div className="min-h-screen bg-slate-50 p-4">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-slate-800 transition"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="text-right">
                    <p className="text-xs text-slate-400">
                        Food Order
                    </p>

                    <h1 className="text-xl font-semibold text-slate-900">
                        {order.order_id}
                    </h1>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase">
                        Customer
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {order.customer_name ||
                            order.ordered_by_name ||
                            "Customer"}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase">
                        Status
                    </p>

                    <p className="mt-1 text-sm font-medium text-blue-600">
                        {order.status}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase">
                        Amount
                    </p>

                    <p className="mt-1 text-lg font-semibold text-emerald-600">
                        {formatAmount(order.total_amount)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase">
                        Products
                    </p>

                    <p className="mt-1 text-lg font-semibold text-violet-600">
                        {items.length}
                    </p>
                </div>

            </div>

            {/* Order Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">

                <h2 className="text-base font-semibold text-slate-900 mb-4">
                    Order Information
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">

                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">
                            Order ID
                        </p>

                        <p className="text-sm font-medium text-slate-900 mt-1">
                            {order.order_id}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">
                            Customer
                        </p>

                        <p className="text-sm font-medium text-slate-900 mt-1">
                            {order.customer_name ||
                                order.ordered_by_name}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">
                            Status
                        </p>

                        <p className="text-sm font-medium text-slate-900 mt-1">
                            {order.status}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">
                            Amount
                        </p>

                        <p className="text-sm font-medium text-emerald-600 mt-1">
                            {formatAmount(order.total_amount)}
                        </p>
                    </div>

                </div>

            </div>

            {/* Chef Breakdown */}
            <div className="flex items-center justify-between mb-4">

                <h2 className="text-lg font-semibold text-slate-900">
                    Chef Breakdown
                </h2>

                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl text-xs font-medium">
                    {items.length} Products
                </span>

            </div>

            <div className="space-y-4">

                {Object.values(chefGroups).map((group) => (

                    <div
                        key={group.name}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                    >

                        <div className="flex items-center justify-between mb-4">

                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {group.name}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1">
                                    {group.items.length} Items • Qty {group.quantity}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-slate-400">
                                    Total
                                </p>

                                <p className="text-lg font-semibold text-emerald-600">
                                    {formatAmount(group.total)}
                                </p>
                            </div>

                        </div>

                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">

                            {group.items.map((item, idx) => (

                                <div
                                    key={idx}
                                    className="bg-slate-50 rounded-xl p-3"
                                >

                                    <div className="flex justify-between items-start">

                                        <div>
                                            <h4 className="text-sm font-medium text-slate-900">
                                                {item.name}
                                            </h4>

                                            <p className="text-xs text-slate-500 mt-1">
                                                Qty : {item.quantity || 1}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Unit : {formatAmount(
                                                    item.price ||
                                                    item.final_price ||
                                                    item.mrp ||
                                                    0
                                                )}
                                            </p>
                                        </div>

                                        <span className="text-lg">
                                            🍽️
                                        </span>

                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-200">

                                        <p className="text-xs text-slate-400">
                                            Total
                                        </p>

                                        <p className="text-base font-semibold text-emerald-600">
                                            {formatAmount(
                                                (item.quantity || 1) *
                                                (item.price ||
                                                    item.final_price ||
                                                    item.mrp ||
                                                    0)
                                            )}
                                        </p>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
};

export default FoodOrderDetails;