"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function StoreOwnerSettingsPage() {
  const [form, setForm] = useState({ smtp_host: "", smtp_port: "", smtp_username: "", default_delivery_charge: "0", currency: "INR" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/store-owner/settings")
      .then((r) => {
        const d = r.data;
        setForm({
          smtp_host: d.smtp_host ?? "",
          smtp_port: d.smtp_port ? String(d.smtp_port) : "",
          smtp_username: d.smtp_username ?? "",
          default_delivery_charge: d.default_delivery_charge ? String(d.default_delivery_charge) : "0",
          currency: d.currency ?? "INR",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/store-owner/settings", {
        smtp_host: form.smtp_host || null,
        smtp_port: form.smtp_port ? parseInt(form.smtp_port) : null,
        smtp_username: form.smtp_username || null,
        default_delivery_charge: parseFloat(form.default_delivery_charge),
        currency: form.currency,
      });
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Store Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Email / SMTP</h2>
        {[["smtp_host","SMTP Host"],["smtp_port","SMTP Port"],["smtp_username","SMTP Username"]].map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        ))}
        <hr />
        <h2 className="font-semibold text-gray-700">Delivery & Currency</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Default Delivery Charge</label>
          <input type="number" value={form.default_delivery_charge} onChange={(e) => setForm({ ...form, default_delivery_charge: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Currency</label>
          <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
