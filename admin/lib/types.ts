export interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  admin_email: string;
  is_active: boolean;
  created_at: string;
  product_count: number;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  images: string[];
  specifications: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  city?: string;
  pincode?: string;
  notes?: string;
  subtotal: number;
  delivery_charges: number;
  total_amount: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  created_at: string;
  items: OrderItem[];
}
