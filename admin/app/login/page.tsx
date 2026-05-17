"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      // Try each role endpoint in order
      const endpoints = ["/admin/login", "/store-owner/login", "/auth/login"];
      let lastErr;
      for (const ep of endpoints) {
        try {
          const res = await api.post(ep, { email, password });
          data = res.data;
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!data) throw lastErr;

      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_role", data.role ?? "customer");
      if (data.full_name) localStorage.setItem("user_name", data.full_name);
      if (data.email) localStorage.setItem("user_email", data.email);

      if (data.role === "super_admin") {
        router.push("/dashboard");
      } else if (data.role === "store_owner") {
        router.push("/store-portal");
      } else {
        router.push("/customer/stores");
      }
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">🛍 Selling Platform</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Login to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
