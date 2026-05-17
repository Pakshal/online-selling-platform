"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { toast } from "sonner";

const STATUS_OPTIONS = ["pending", "confirmed", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders", statusFilter],
    queryFn: () =>
      api.get("/admin/orders", { params: statusFilter ? { status: statusFilter } : {} }).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${!statusFilter ? "bg-gray-800 text-white border-gray-800" : "hover:bg-gray-50"}`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition ${statusFilter === s ? "bg-gray-800 text-white border-gray-800" : "hover:bg-gray-50"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <button onClick={() => setSelected(order)} className="text-blue-600 hover:underline">
                    {order.order_number}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div>{order.customer_name}</div>
                  <div className="text-gray-400 text-xs">{order.customer_phone}</div>
                </td>
                <td className="px-4 py-3 font-semibold">₹{Number(order.total_amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                    className="text-xs border rounded px-2 py-1 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && !isLoading && (
          <p className="text-center text-gray-400 py-10">No orders found</p>
        )}
      </div>

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{order.order_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <p><b>Customer:</b> {order.customer_name}</p>
          <p><b>Phone:</b> {order.customer_phone}</p>
          <p><b>Email:</b> {order.customer_email}</p>
          <p><b>Address:</b> {order.delivery_address}, {order.city} - {order.pincode}</p>
          {order.notes && <p><b>Notes:</b> {order.notes}</p>}
        </div>
        <hr className="my-4" />
        <h3 className="font-semibold text-sm mb-2">Items</h3>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Product</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.product_name}</td>
                <td className="px-3 py-2 text-center">{item.quantity}</td>
                <td className="px-3 py-2 text-center">₹{Number(item.product_price).toLocaleString()}</td>
                <td className="px-3 py-2 text-center">₹{Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-sm space-y-1 text-right text-gray-700">
          <p>Subtotal: ₹{Number(order.subtotal).toLocaleString()}</p>
          <p>Delivery: ₹{Number(order.delivery_charges).toLocaleString()}</p>
          <p className="text-base font-bold">Total: ₹{Number(order.total_amount).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
