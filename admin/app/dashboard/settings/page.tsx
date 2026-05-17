"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Store } from "@/lib/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: () => api.get("/admin/stores").then((r) => r.data),
  });
  const [storeId, setStoreId] = useState("");
  const [form, setForm] = useState({
    smtp_host: "", smtp_port: "587", smtp_username: "", smtp_password: "",
    default_delivery_charge: "0", currency: "INR",
  });
  const [loading, setLoading] = useState(false);

  const loadSettings = async (id: string) => {
    setStoreId(id);
    try {
      const { data } = await api.get(`/admin/settings/${id}`);
      setForm({
        smtp_host: data.smtp_host ?? "",
        smtp_port: data.smtp_port?.toString() ?? "587",
        smtp_username: data.smtp_username ?? "",
        smtp_password: "",
        default_delivery_charge: data.default_delivery_charge?.toString() ?? "0",
        currency: data.currency ?? "INR",
      });
    } catch { /* settings may not exist yet */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setLoading(true);
    try {
      await api.put(`/admin/settings/${storeId}`, {
        ...form,
        smtp_port: parseInt(form.smtp_port),
        default_delivery_charge: parseFloat(form.default_delivery_charge),
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <div className="max-w-lg bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Store</label>
          <select
            value={storeId}
            onChange={(e) => loadSettings(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select store —</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 pt-2">Email (SMTP)</h3>
          {[
            { key: "smtp_host", label: "SMTP Host" },
            { key: "smtp_port", label: "SMTP Port", type: "number" },
            { key: "smtp_username", label: "SMTP Username" },
            { key: "smtp_password", label: "SMTP Password", type: "password" },
          ].map(({ key, label, type = "text" }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <h3 className="text-sm font-semibold text-gray-700 pt-2">General</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Default Delivery Charge (₹)</label>
            <input
              type="number"
              value={form.default_delivery_charge}
              onChange={(e) => setForm({ ...form, default_delivery_charge: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !storeId}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
