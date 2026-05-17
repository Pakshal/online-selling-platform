"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCart } from "@/lib/cartContext";
import { Package, ArrowLeft, Store, ShoppingCart, AlertTriangle, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
}

interface StoreDetail {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  address: string | null;
  product_count: number;
}

export default function CustomerStoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const { cart, addItem, updateQty, removeItem, itemCount, clearCart } = useCart();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [conflictItem, setConflictItem] = useState<{ storeId: string; storeName: string; item: { productId: string; productName: string; price: number; image: string | null } } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/stores/${storeId}`),
      api.get(`/stores/${storeId}/products`),
    ]).then(([storeRes, prodRes]) => {
      setStore(storeRes.data);
      setProducts(prodRes.data);
    }).finally(() => setLoading(false));
  }, [storeId]);

  const getCartQty = (productId: string) =>
    cart?.items.find((i) => i.productId === productId)?.quantity ?? 0;

  const handleAdd = (p: Product) => {
    if (!store) return;
    const result = addItem(store.id, store.name, {
      productId: p.id,
      productName: p.name,
      price: Number(p.price),
      image: p.images?.[0] ?? null,
    });
    if (result === "store_conflict") {
      setConflictItem({ storeId: store.id, storeName: store.name, item: { productId: p.id, productName: p.name, price: Number(p.price), image: p.images?.[0] ?? null } });
    } else {
      toast.success(`${p.name} added to cart`);
    }
  };

  const handleClearAndAdd = () => {
    if (!conflictItem) return;
    clearCart();
    addItem(conflictItem.storeId, conflictItem.storeName, conflictItem.item);
    setConflictItem(null);
    toast.success("Cart cleared and item added");
  };

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading store…</div>;
  if (!store) return <div className="p-8 text-red-500">Store not found</div>;

  return (
    <div>
      {/* Store Conflict Modal */}
      {conflictItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-amber-500" size={20} />
              </div>
              <h2 className="font-bold text-gray-800">Cart has items from another store</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              You have <strong>{itemCount} item{itemCount !== 1 ? "s" : ""}</strong> from{" "}
              <strong>{cart?.storeName}</strong>. To add from{" "}
              <strong>{conflictItem.storeName}</strong>, clear the current cart first.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConflictItem(null)} className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Keep current cart
              </button>
              <button onClick={handleClearAndAdd} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600">
                Clear & add item
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={14} /> Back to Stores
        </button>
        {itemCount > 0 && (
          <button
            onClick={() => router.push("/customer/checkout")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <ShoppingCart size={16} />
            Checkout ({itemCount} {itemCount === 1 ? "item" : "items"})
          </button>
        )}
      </div>

      {/* Store Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 flex items-center gap-5">
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="w-20 h-20 rounded-xl object-cover border" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center">
            <Store className="text-blue-400" size={36} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{store.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{store.description ?? "No description"}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            {store.contact_phone && <span>📞 {store.contact_phone}</span>}
            {store.address && <span>📍 {store.address}</span>}
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Products ({products.length})</h2>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>No products available in this store yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const qty = getCartQty(p.id);
            const outOfStock = p.stock_quantity === 0;
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition flex flex-col">
                <button
                  onClick={() => router.push(`/customer/stores/${storeId}/products/${p.id}`)}
                  className="w-full text-left focus:outline-none"
                >
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-40 object-cover rounded-t-xl hover:opacity-90 transition" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-t-xl flex items-center justify-center hover:bg-gray-200 transition">
                      <Package className="text-gray-300" size={40} />
                    </div>
                  )}
                </button>
                <div className="p-4 flex flex-col flex-1">
                  <button
                    onClick={() => router.push(`/customer/stores/${storeId}/products/${p.id}`)}
                    className="font-semibold text-gray-800 text-sm truncate text-left hover:text-blue-600 transition"
                  >
                    {p.name}
                  </button>
                  {p.category && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 self-start">{p.category}</span>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex-1">{p.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-base font-bold text-gray-800">₹{Number(p.price).toLocaleString("en-IN")}</span>
                    <span className={`text-xs ${outOfStock ? "text-red-500" : "text-green-600"}`}>
                      {outOfStock ? "Out of stock" : `${p.stock_quantity} left`}
                    </span>
                  </div>
                  {!outOfStock && (
                    qty > 0 ? (
                      <div className="flex items-center justify-between mt-3 border rounded-lg overflow-hidden">
                        <button onClick={() => qty === 1 ? removeItem(p.id) : updateQty(p.id, qty - 1)} className="px-3 py-2 hover:bg-gray-100 text-gray-700"><Minus size={14} /></button>
                        <span className="text-sm font-semibold text-gray-800">{qty}</span>
                        <button onClick={() => handleAdd(p)} className="px-3 py-2 hover:bg-gray-100 text-gray-700"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleAdd(p)} className="mt-3 w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
