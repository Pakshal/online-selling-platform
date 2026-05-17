"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Product, Store } from "@/lib/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const qc = useQueryClient();
  const [storeFilter, setStoreFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: () => api.get("/admin/stores").then((r) => r.data),
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", storeFilter],
    queryFn: () =>
      storeFilter
        ? api.get(`/stores/${storeFilter}/products`).then((r) => r.data)
        : Promise.resolve([]),
    enabled: !!storeFilter,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          disabled={!storeFilter}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="mb-4">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select a store —</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {!storeFilter && (
        <p className="text-gray-400 text-sm">Select a store to view its products.</p>
      )}

      {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm p-5">
            {product.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="w-full h-36 object-cover rounded-xl mb-3" />
            )}
            <h2 className="font-semibold text-gray-800">{product.name}</h2>
            <p className="text-blue-600 font-bold mt-1">₹{Number(product.price).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Stock: {product.stock_quantity}</p>
            {product.category && (
              <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {product.category}
              </span>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setEditing(product); setShowForm(true); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => { if (confirm("Delete this product?")) deleteMut.mutate(product.id); }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && storeFilter && (
        <ProductFormModal
          product={editing}
          storeId={storeFilter}
          onClose={() => setShowForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["products"] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product, storeId, onClose, onSaved,
}: { product: Product | null; storeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    stock_quantity: product?.stock_quantity?.toString() ?? "0",
    category: product?.category ?? "",
    images: product?.images?.join(", ") ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (product) {
        await api.put(`/admin/products/${product.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post(`/admin/stores/${storeId}/products`, { ...payload, store_id: storeId });
        toast.success("Product created");
      }
      onSaved();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{product ? "Edit Product" : "New Product"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {(["name", "description", "price", "stock_quantity", "category"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {field.replace("_", " ")}
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type={field === "price" || field === "stock_quantity" ? "number" : "text"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === "name" || field === "price"}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image URLs (comma-separated)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
              rows={2}
            />
          </div>
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
