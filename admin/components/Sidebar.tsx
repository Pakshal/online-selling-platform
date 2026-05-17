"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cartContext";
import {
  Store, Package, ShoppingCart, Settings, LogOut, LayoutDashboard, Users,
} from "lucide-react";

const superAdminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/stores", label: "Stores", icon: Store },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/store-owners", label: "Store Owners", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const storeOwnerNav = [
  { href: "/store-portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store-portal/products", label: "My Products", icon: Package },
  { href: "/store-portal/orders", label: "My Orders", icon: ShoppingCart },
  { href: "/store-portal/settings", label: "Settings", icon: Settings },
];

const customerNav = [
  { href: "/customer/stores", label: "Browse Stores", icon: Store },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const { itemCount } = useCart();

  useEffect(() => {
    setRole(localStorage.getItem("admin_role"));
  }, []);

  const nav =
    role === "super_admin" ? superAdminNav
    : role === "store_owner" ? storeOwnerNav
    : customerNav;

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    router.push("/login");
  };

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-lg font-bold tracking-tight">🛍 SellingPlatform</span>
        {role && (
          <span className={`block text-xs mt-1 ${
            role === "super_admin" ? "text-yellow-400"
            : role === "store_owner" ? "text-green-400"
            : "text-blue-400"
          }`}>
            {role === "super_admin" ? "Super Admin"
             : role === "store_owner" ? "Store Owner"
             : "Customer"}
          </span>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              pathname === href
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        {role === "customer" && itemCount > 0 && (
          <Link
            href="/customer/checkout"
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition mt-2 ${
              pathname === "/customer/checkout"
                ? "bg-blue-600 text-white"
                : "bg-blue-900/50 text-blue-300 hover:bg-blue-800/60"
            }`}
          >
            <span className="flex items-center gap-3">
              <ShoppingCart size={16} /> Cart
            </span>
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {itemCount}
            </span>
          </Link>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
