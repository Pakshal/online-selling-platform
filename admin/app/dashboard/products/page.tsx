"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface SpecEntry { key: string; value: string; }

const EMPTY_FORM = { name: "", description: "", price: "", category: "", stock_quantity: "0", images: "", is_active: true };

export default function StoreOwnerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [specs, setSpecs] = useState<SpecEntry[]>([]);

  const load = () =>
    api.get("/store-owner/products").then((r) => setProducts(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSpecs([]);
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), category: p.category ?? "", stock_quantity: String(p.stock_quantity), images: (p.images ?? []).join(", "), is_active: p.is_active });
    setSpecs(Object.entries(p.specifications ?? {}).map(([key, value]) => ({ key, value: String(value) })));
    setShowForm(true);
  };

  const addSpecRow = () => setSpecs((s) => [...s, { key: "", value: "" }]);
  const removeSpecRow = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    setSpecs((s) => s.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const specsObj = Object.fromEntries(specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()]));
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      category: form.category || null,
      stock_quantity: parseInt(form.stock_quantity),
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      specifications: specsObj,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await api.put(`/store-owner/products/${editing.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/store-owner/products", payload);
        toast.success("Product created");
      }
      setShowForm(false);
      load();
    } catch { toast.error("Failed to save product"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await api.delete(`/store-owner/products/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800 text-lg">{editing ? "Edit Product" : "New Product"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Cotton Kurta" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the product — material, usage, features, etc."
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹) *</label>
                  <input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="999" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Clothing, Electronics…" />
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Image URLs <span className="text-gray-400">(comma-separated)</span></label>
                <input type="text" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://…, https://…" />
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">Specifications</label>
                  <button type="button" onClick={addSpecRow} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Add row</button>
                </div>
                {specs.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No specifications. Click "Add row" to add key-value details (e.g. Material → Cotton).</p>
                )}
                <div className="space-y-2">
                  {specs.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" value={row.key} onChange={(e) => updateSpec(i, "key", e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Material" />
                      <input type="text" value={row.value} onChange={(e) => updateSpec(i, "value", e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Cotton" />
                      <button type="button" onClick={() => removeSpecRow(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                List as active (visible to customers)
              </label>
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 px-6 py-4 border-t">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                {editing ? "Update Product" : "Create Product"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Active</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category ?? "—"}</td>
                <td className="px-4 py-3">₹{p.price}</td>
                <td className="px-4 py-3">{p.stock_quantity}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.is_active ? "Yes" : "No"}</span></td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-center text-gray-400 py-8">No products yet.</p>}
      </div>
    </div>
  );
}
