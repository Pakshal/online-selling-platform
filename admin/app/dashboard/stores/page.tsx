"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Store } from "@/lib/types";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function StoresPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: () => api.get("/admin/stores").then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/stores/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores"] }); toast.success("Store deleted"); },
    onError: () => toast.error("Failed to delete store"),
  });

  const toggleMut = useMutation({
    mutationFn: (store: Store) =>
      api.put(`/admin/stores/${store.id}`, { is_active: !store.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stores</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus size={16} /> New Store
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">{store.name}</h2>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{store.admin_email}</p>
                  <p className="text-xs text-gray-400">{store.product_count} products</p>
                </div>
                {store.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logo_url} alt={store.name} className="w-12 h-12 rounded-xl object-cover" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => { setEditing(store); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => toggleMut.mutate(store)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  {store.is_active ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                </button>
                <button
                  onClick={() => { if (confirm("Delete this store?")) deleteMut.mutate(store.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                >
                  <Trash2 size={14} />
                </button>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${store.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {store.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <StoreFormModal
          store={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["stores"] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function StoreFormModal({
  store, onClose, onSaved,
}: { store: Store | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: store?.name ?? "",
    description: store?.description ?? "",
    logo_url: store?.logo_url ?? "",
    admin_email: store?.admin_email ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (store) {
        await api.put(`/admin/stores/${store.id}`, form);
        toast.success("Store updated");
      } else {
        await api.post("/admin/stores", form);
        toast.success("Store created");
      }
      onSaved();
    } catch {
      toast.error("Failed to save store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{store ? "Edit Store" : "New Store"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {(["name", "description", "logo_url", "admin_email"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {field.replace("_", " ")}
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === "name" || field === "admin_email"}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
