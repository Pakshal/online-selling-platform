"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Store, Order } from "@/lib/types";
import { Store as StoreIcon, Package, ShoppingCart, TrendingUp } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: () => api.get("/admin/stores").then((r) => r.data),
  });
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => api.get("/admin/orders").then((r) => r.data),
  });

  const revenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Stores" value={stores.length} icon={StoreIcon} color="bg-blue-500" />
        <StatCard label="Total Orders" value={orders.length} icon={ShoppingCart} color="bg-green-500" />
        <StatCard label="Pending Orders" value={pending} icon={Package} color="bg-orange-500" />
        <StatCard label="Total Revenue" value={`₹${revenue.toLocaleString()}`} icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Orders</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Order #</th>
              <th className="pb-2">Customer</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 font-medium">{order.order_number}</td>
                <td className="py-2">{order.customer_name}</td>
                <td className="py-2">₹{Number(order.total_amount).toLocaleString()}</td>
                <td className="py-2">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-2 text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="text-center text-gray-400 py-8">No orders yet</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
