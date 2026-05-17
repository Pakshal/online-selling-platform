"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Package, ShoppingCart, Store } from "lucide-react";

export default function StorePortalDashboard() {
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/store-owner/my-store"),
      api.get("/store-owner/orders"),
      api.get("/store-owner/products"),
    ])
      .then(([s, o, p]) => {
        setStore(s.data);
        setOrders(o.data);
        setProducts(p.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = orders.filter((o) => o.status === "pending").length;

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {store?.name ?? "My Store"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{store?.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Package size={20} />} label="Total Products" value={products.length} color="blue" />
        <StatCard icon={<ShoppingCart size={20} />} label="Total Orders" value={orders.length} color="green" />
        <StatCard icon={<ShoppingCart size={20} />} label="Pending Orders" value={pending} color="yellow" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Order #</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o: any) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{o.order_number}</td>
                  <td className="py-2">{o.customer_name}</td>
                  <td className="py-2">₹{o.total_amount}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      o.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      o.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      o.status === "delivered" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
