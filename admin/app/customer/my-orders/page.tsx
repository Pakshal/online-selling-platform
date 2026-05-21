"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck, Package } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  store_id: string;
  status: string;
  subtotal: number;
  delivery_charges: number;
  total_amount: number;
  created_at: string;
  customer_name: string;
  delivery_address: string;
  city: string;
  pincode: string;
  notes?: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:    { label: "Pending",     icon: <Clock size={14} />,        color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  confirmed:  { label: "Confirmed",   icon: <CheckCircle size={14} />,  color: "text-blue-600 bg-blue-50 border-blue-200" },
  in_progress:{ label: "In Progress", icon: <Truck size={14} />,        color: "text-purple-600 bg-purple-50 border-purple-200" },
  delivered:  { label: "Delivered",   icon: <Package size={14} />,      color: "text-green-600 bg-green-50 border-green-200" },
  cancelled:  { label: "Cancelled",   icon: <XCircle size={14} />,      color: "text-red-600 bg-red-50 border-red-200" },
};

function canCancel(order: Order): { allowed: boolean; reason?: string } {
  const NON_CANCELLABLE = ["delivered", "in_progress", "confirmed", "cancelled"];
  if (NON_CANCELLABLE.includes(order.status)) {
    return { allowed: false, reason: `Cannot cancel an order with status '${order.status}'` };
  }
  const placed = new Date(order.created_at).getTime();
  const now = Date.now();
  const diffHours = (now - placed) / (1000 * 60 * 60);
  if (diffHours > 2) {
    return { allowed: false, reason: "Cancellation window has passed (2 hours)" };
  }
  return { allowed: true };
}

function timeLeft(createdAt: string): string {
  const placed = new Date(createdAt).getTime();
  const deadline = placed + 2 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return "Expired";
  const mins = Math.floor(remaining / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return hrs > 0 ? `${hrs}h ${m}m left` : `${m}m left`;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    const token = localStorage.getItem("admin_token");
    if (!token || role !== "customer") {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/auth/my-orders");
      setOrders(res.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (order: Order) => {
    if (!confirm(`Cancel order ${order.order_number}?`)) return;
    setCancelling(order.id);
    try {
      await api.post(`/auth/my-orders/${order.id}/cancel`);
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Failed to cancel order";
      toast.error(msg);
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">Start shopping to see your orders here</p>
          <button
            onClick={() => router.push("/customer/stores")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
          >
            Browse Stores
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const cancel = canCancel(order);
            return (
              <div key={order.id} className="bg-white rounded-2xl border shadow-sm p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{order.order_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y border rounded-xl mb-3 overflow-hidden">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
                      <span className="text-gray-600 font-medium">₹{Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="text-sm text-gray-500 space-y-0.5 mb-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span><span>₹{Number(order.delivery_charges).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 pt-1 border-t">
                    <span>Total</span><span>₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery address */}
                <p className="text-xs text-gray-400 mb-3">
                  📍 {order.delivery_address}, {order.city} - {order.pincode}
                </p>

                {/* Cancel */}
                {cancel.allowed ? (
                  <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                    <span className="text-xs text-yellow-700">
                      <Clock size={12} className="inline mr-1" />
                      {timeLeft(order.created_at)} to cancel
                    </span>
                    <button
                      onClick={() => handleCancel(order)}
                      disabled={cancelling === order.id}
                      className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                    >
                      {cancelling === order.id ? "Cancelling…" : "Cancel Order"}
                    </button>
                  </div>
                ) : order.status === "pending" && cancel.reason?.includes("window") ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                    ⏰ Cancellation window has passed
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
