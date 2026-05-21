"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Store, Package, Search } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  address: string | null;
  product_count: number;
  is_active: boolean;
}

export default function CustomerStoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [filtered, setFiltered] = useState<StoreItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/stores").then((r) => {
      setStores(r.data);
      setFiltered(r.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(stores.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q)
    ));
  }, [search, stores]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Browse Stores</h1>
        <p className="text-sm text-gray-500 mt-1">Explore all active stores on the platform</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Store size={48} className="mx-auto mb-3 opacity-30" />
          <p>No stores found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((store) => (
            <div key={store.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-5">
              <div className="flex items-start gap-4 mb-4">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Store className="text-blue-400" size={28} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800 truncate">{store.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {store.description ?? "No description"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                <span className="flex items-center gap-1">
                  <Package size={14} />
                  {store.product_count} products
                </span>
                {store.contact_phone && (
                  <span className="text-xs">{store.contact_phone}</span>
                )}
              </div>

              {store.address && (
                <p className="text-xs text-gray-400 mt-2 truncate">📍 {store.address}</p>
              )}

              <a
                href={`/customer/stores/${store.id}`}
                className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition"
              >
                Browse Store →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
