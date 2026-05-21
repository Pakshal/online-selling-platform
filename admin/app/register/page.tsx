"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

const TERMS = `Terms & Conditions

1. PURPOSE
This platform is a marketplace that connects buyers with independent store owners. It is intended solely for buying and selling goods.

2. PLATFORM RESPONSIBILITY
We are not responsible for:
- The quality, accuracy, or legality of any product listed by store owners.
- How products are packaged, delivered, or received.
- Any disputes between buyers and store owners regarding products or delivery.

3. ORDER & DELIVERY
- Orders are placed directly with the store owner.
- The store owner will contact you on the phone/WhatsApp number you provide to confirm payment and arrange delivery.
- Delivery timelines and methods are determined solely by the store owner.

4. PAYMENTS
- Payments are handled offline between you and the store owner.
- This platform does not process any payments.

5. CANCELLATIONS
- You may cancel a pending order within 2 hours of placing it.
- Orders cannot be cancelled once the store owner has confirmed, dispatched, or delivered them.

6. DATA
- Your contact information (name, phone, email, address) will be shared with the store owner to fulfil your order.

By registering, you acknowledge that you have read, understood, and agree to these terms.`;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions to continue");
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number || undefined,
        terms_accepted: true,
      });
      toast.success("Account created! Please log in.");
      router.push("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">🛍 Create Account</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Register to start shopping</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              name="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone / WhatsApp Number
            </label>
            <input
              name="phone_number"
              type="tel"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
            <p className="text-xs text-gray-400 mt-1">
              Store owners may use this to contact you about your order
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input
              name="confirm_password"
              type="password"
              required
              value={form.confirm_password}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter password"
            />
          </div>

          {/* T&C */}
          <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 leading-snug">
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-blue-600 hover:underline font-medium"
              >
                Terms & Conditions
              </button>
              . I understand that this platform is not responsible for product quality,
              delivery, or payments — all of which are handled directly by the store owner.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>

      {/* T&C Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Terms & Conditions</h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {TERMS}
              </pre>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTerms(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                I Accept
              </button>
              <button
                onClick={() => setShowTerms(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
