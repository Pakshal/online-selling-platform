"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ShoppingBag } from "lucide-react";

function OrderSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderNumber = params.get("order") ?? "—";

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="text-green-500" size={44} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
        <p className="text-gray-500 text-sm mb-1">Your order has been successfully placed.</p>
        <p className="text-gray-400 text-xs mb-6">
          Order number: <span className="font-semibold text-gray-700">{orderNumber}</span>
        </p>

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-6 text-left space-y-1">
          <p className="font-semibold mb-1">What happens next?</p>
          <p>📧 The store owner has been notified with your order & contact details.</p>
          <p>📞 They will reach out to you directly to confirm payment & delivery.</p>
          <p>🚚 Estimated delivery: 2-3 business days.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/customer/stores")}
            className="flex-1 border rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} /> Browse More Stores
          </button>
          <button
            onClick={() => router.push("/customer/my-orders")}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            📦 My Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[70vh] text-gray-400">Loading…</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
