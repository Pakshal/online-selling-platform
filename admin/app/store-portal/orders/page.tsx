"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"];

export default function StoreOwnerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () =>
    api.get("/store-owner/orders" + (filter ? `?status=${filter}` : ""))
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/store-owner/orders/${id}/status`, { status });
      toast.success("Status updated");
      load();
    } catch { toast.error("Failed to update status"); }
  };

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {orders.length === 0 && <p className="text-gray-400 text-center py-12">No orders found.</p>}
        {orders.map((o: any) => (
          <div key={o.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-xs text-gray-400 mb-1">{o.order_number}</p>
                <p className="font-semibold text-gray-800">{o.customer_name}</p>
                <p className="text-sm text-gray-500">{o.customer_phone} · {o.customer_email}</p>
                <p className="text-sm text-gray-500 mt-1">{o.delivery_address}, {o.city} {o.pincode}</p>
                {o.notes && <p className="text-xs text-gray-400 italic mt-1">Note: {o.notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">₹{o.total_amount}</p>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="mt-2 border rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 border-t pt-3">
              {o.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>₹{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
