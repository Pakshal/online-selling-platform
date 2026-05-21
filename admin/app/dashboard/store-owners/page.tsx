"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function StoreOwnersPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"owner" | "provision">("owner");
  const [ownerForm, setOwnerForm] = useState({ full_name: "", email: "", password: "" });
  const [provisionForm, setProvisionForm] = useState({
    owner_full_name: "", owner_email: "", owner_password: "",
    store_name: "", admin_email: "", contact_phone: "", address: "", store_description: "",
  });
  const [generatedCreds, setGeneratedCreds] = useState<{ email: string; password: string; store: string } | null>(null);

  const load = () =>
    api.get("/admin/store-owners").then((r) => setOwners(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const createOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/store-owners", ownerForm);
      toast.success("Store owner created");
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed");
    }
  };

  const provisionStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/provision-store", provisionForm);
      toast.success("Store + owner provisioned");
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed");
    }
  };

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Store Owners</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Add Store Owner
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab("owner")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "owner" ? "bg-blue-600 text-white" : "border text-gray-600"}`}>Create Owner Only</button>
              <button onClick={() => setTab("provision")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "provision" ? "bg-blue-600 text-white" : "border text-gray-600"}`}>Create Owner + Store</button>
            </div>

            {tab === "owner" ? (
              <form onSubmit={createOwner} className="space-y-3">
                <h2 className="font-semibold text-gray-800">New Store Owner Account</h2>
                {[["full_name","Full Name"],["email","Email"],["password","Password"]].map(([k,l]) => (
                  <div key={k}>
                    <label className="block text-xs text-gray-500 mb-1">{l}</label>
                    <input required type={k === "password" ? "password" : k === "email" ? "email" : "text"} value={(ownerForm as any)[k]} onChange={(e) => setOwnerForm({ ...ownerForm, [k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Create</button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={provisionStore} className="space-y-3">
                <h2 className="font-semibold text-gray-800">Provision Store + Owner</h2>
                <p className="text-xs text-gray-500">Creates the owner account and store in one step.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["owner_full_name","Owner Name"],["owner_email","Owner Email"],["owner_password","Owner Password"],["store_name","Store Name"],["admin_email","Notification Email"],["contact_phone","Contact Phone"],["address","Address"],["store_description","Description"]].map(([k,l]) => (
                    <div key={k} className={k === "address" || k === "store_description" ? "col-span-2" : ""}>
                      <label className="block text-xs text-gray-500 mb-1">{l}</label>
                      <input required={["owner_full_name","owner_email","owner_password","store_name","admin_email"].includes(k)} type={k === "owner_password" ? "password" : k.includes("email") ? "email" : "text"} value={(provisionForm as any)[k]} onChange={(e) => setProvisionForm({ ...provisionForm, [k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Provision</button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr>
          </thead>
          <tbody>
            {owners.map((o: any) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{o.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{o.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${o.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{o.is_active ? "Active" : "Disabled"}</span></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {owners.length === 0 && <p className="text-center text-gray-400 py-8">No store owners yet.</p>}
      </div>
    </div>
  );
}
