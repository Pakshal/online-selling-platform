"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { CartProvider } from "@/lib/cartContext";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const role = localStorage.getItem("admin_role");
    if (!token || role !== "customer") {
      router.push("/login");
    }
  }, [router]);

  return (
    <CartProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </CartProvider>
  );
}
