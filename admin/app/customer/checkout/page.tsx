"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import api from "@/lib/api";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemCount, subtotal, updateQty, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", pincode: "", notes: "",
  });

  const deliveryCharge = cart ? 49 : 0; // default; could come from store settings
  const total = subtotal + deliveryCharge;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        store_id: cart.storeId,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        },
        items: cart.items.map((i) => ({
          product_id: i.productId,
          product_name: i.productName,
          price: i.price,
          quantity: i.quantity,
        })),
        notes: form.notes || null,
        subtotal,
        delivery_charges: deliveryCharge,
        total_amount: total,
      };
      const res = await api.post("/orders/", payload);
      clearCart();
      router.push(`/customer/order-success?order=${res.data.orderNumber}&id=${res.data.orderId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to place order";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || itemCount === 0) {
    return (
      <div className="text-center py-24">
        <ShoppingCart size={56} className="mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 text-lg">Your cart is empty</p>
        <button onClick={() => router.push("/customer/stores")} className="mt-4 text-blue-600 text-sm hover:underline">
          Browse Stores →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name *", field: "name", type: "text" },
                { label: "Phone Number *", field: "phone", type: "tel" },
                { label: "Email Address *", field: "email", type: "email" },
                { label: "City *", field: "city", type: "text" },
                { label: "Pincode *", field: "pincode", type: "text" },
              ].map(({ label, field, type }) => (
                <div key={field} className={field === "email" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    required
                    value={form[field as keyof typeof form]}
                    onChange={set(field)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={set("address")}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={set("notes")}
                  placeholder="E.g. deliver after 6 PM…"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? "Placing Order…" : `Place Order — ₹${total.toLocaleString("en-IN")}`}
          </button>
        </form>

        {/* Right: Cart summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">
                {cart.storeName} ({itemCount} {itemCount === 1 ? "item" : "items"})
              </h2>
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 size={12} /> Clear
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="w-12 h-12 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={18} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">₹{item.price.toLocaleString("en-IN")} each</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => item.quantity === 1 ? removeItem(item.productId) : updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100">
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100">
                      <Plus size={10} />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 w-16 text-right shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span>₹{deliveryCharge}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            No online payment. The store owner will contact you to arrange payment and delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
