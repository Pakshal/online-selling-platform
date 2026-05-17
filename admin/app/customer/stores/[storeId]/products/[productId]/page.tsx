"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCart } from "@/lib/cartContext";
import {
  ArrowLeft, Package, ShoppingCart, Plus, Minus,
  AlertTriangle, Star, Send, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number;
  images: string[];
  specifications: Record<string, string>;
  is_active: boolean;
  store_id: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

interface StoreInfo {
  id: string;
  name: string;
}

export default function ProductDetailPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>();
  const router = useRouter();
  const { cart, addItem, updateQty, removeItem, itemCount, clearCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [conflictItem, setConflictItem] = useState<{ storeId: string; storeName: string; item: { productId: string; productName: string; price: number; image: string | null } } | null>(null);

  // Logged-in user info from localStorage
  const [loggedEmail, setLoggedEmail] = useState("");
  const [loggedName, setLoggedName] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Review form
  const [form, setForm] = useState({ reviewer_name: "", reviewer_email: "", rating: 0, title: "", body: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Read stored user info
    const storedEmail = localStorage.getItem("user_email") ?? "";
    const storedName = localStorage.getItem("user_name") ?? "";
    setLoggedEmail(storedEmail);
    setLoggedName(storedName);

    Promise.all([
      api.get(`/products/${productId}`),
      api.get(`/products/${productId}/reviews`),
      api.get(`/stores/${storeId}`),
    ]).then(([prodRes, revRes, storeRes]) => {
      setProduct(prodRes.data);
      const fetchedReviews: Review[] = revRes.data;
      setReviews(fetchedReviews);
      setStore({ id: storeRes.data.id, name: storeRes.data.name });

      // Pre-fill form with logged-in user details
      setForm((f) => ({
        ...f,
        reviewer_email: storedEmail,
        reviewer_name: storedName,
      }));

      // Check if this user already submitted a review
      if (storedEmail) {
        const hasReview = fetchedReviews.some(
          (r: any) => r.reviewer_email === storedEmail || r.reviewer_name === storedName
        );
        // Use the dedicated check endpoint for authoritative result
        if (!hasReview) {
          api.get(`/products/${productId}/reviews/check?email=${encodeURIComponent(storedEmail)}`)
            .then((res) => setAlreadyReviewed(res.data.reviewed))
            .catch(() => {});
        } else {
          setAlreadyReviewed(true);
        }
      }
    }).catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [productId, storeId]);

  const qty = cart?.items.find((i) => i.productId === productId)?.quantity ?? 0;
  const outOfStock = product ? product.stock_quantity === 0 : false;

  const handleAdd = () => {
    if (!product || !store) return;
    const result = addItem(store.id, store.name, {
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      image: product.images?.[0] ?? null,
    });
    if (result === "store_conflict") {
      setConflictItem({ storeId: store.id, storeName: store.name, item: { productId: product.id, productName: product.name, price: Number(product.price), image: product.images?.[0] ?? null } });
    } else {
      toast.success(`${product.name} added to cart`);
    }
  };

  const handleClearAndAdd = () => {
    if (!conflictItem) return;
    clearCart();
    addItem(conflictItem.storeId, conflictItem.storeName, conflictItem.item);
    setConflictItem(null);
    toast.success("Cart cleared and item added");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rating) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/products/${productId}/reviews`, form);
      setReviews((prev) => [res.data, ...prev]);
      setAlreadyReviewed(true);
      setSubmitted(true);
      toast.success("Review submitted!");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Failed to submit review";
      toast.error(msg);
      if (err?.response?.status === 409) setAlreadyReviewed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading product…</div>;
  if (!product) return <div className="p-8 text-red-500">Product not found</div>;

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

      {/* Nav row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={14} /> Back
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

      {/* Product detail card */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div>
            <div className="rounded-xl overflow-hidden border bg-gray-50 h-72 flex items-center justify-center mb-3">
              {product.images?.[activeImage] ? (
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="text-gray-300" size={64} />
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${activeImage === i ? "border-blue-500" : "border-transparent"}`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            {product.category && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full self-start mb-2">{product.category}</span>
            )}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={16} className={s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
              </div>
            )}

            <p className="text-3xl font-extrabold text-gray-900 mb-2">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>

            <p className={`text-sm font-medium mb-4 ${outOfStock ? "text-red-500" : "text-green-600"}`}>
              {outOfStock ? "Out of Stock" : `${product.stock_quantity} in stock`}
            </p>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{product.description}</p>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h3>
                <div className="border rounded-lg divide-y text-sm">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex px-3 py-2 gap-2">
                      <span className="text-gray-500 w-36 flex-shrink-0">{k}</span>
                      <span className="text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            {!outOfStock && (
              qty > 0 ? (
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center border rounded-xl overflow-hidden">
                    <button
                      onClick={() => qty === 1 ? removeItem(product.id) : updateQty(product.id, qty - 1)}
                      className="px-4 py-3 hover:bg-gray-100 text-gray-700"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-3 text-base font-semibold">{qty}</span>
                    <button onClick={handleAdd} className="px-4 py-3 hover:bg-gray-100 text-gray-700">
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => router.push("/customer/checkout")}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Go to Checkout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="mt-auto w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review list */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Customer Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
          </h2>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <Star size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-semibold text-sm text-gray-800">{r.reviewer_name}</span>
                      {r.title && <p className="text-sm font-medium text-gray-700 mt-0.5">{r.title}</p>}
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={13} className={s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  {r.body && <p className="text-sm text-gray-600 leading-relaxed mt-1">{r.body}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a review */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Write a Review</h2>
          <div className="bg-white rounded-xl border p-5">
            {alreadyReviewed || submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle size={48} className="text-green-500 mb-3" />
                <p className="font-semibold text-gray-800">
                  {submitted ? "Thanks for your review!" : "You've already reviewed this product"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {submitted
                    ? "Your feedback helps other customers."
                    : "You can only submit one review per product."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setForm((f) => ({ ...f, rating: s }))}
                        className="p-0.5"
                      >
                        <Star
                          size={28}
                          className={`transition ${s <= (hoverRating || form.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      </button>
                    ))}
                    {form.rating > 0 && (
                      <span className="ml-2 text-sm text-gray-500 self-center">
                        {["","Terrible","Poor","Average","Good","Excellent"][form.rating]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={form.reviewer_name}
                      onChange={(e) => setForm((f) => ({ ...f, reviewer_name: e.target.value }))}
                      readOnly={!!loggedName}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${loggedName ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}`}
                      placeholder="Akshar Patel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.reviewer_email}
                      onChange={(e) => setForm((f) => ({ ...f, reviewer_email: e.target.value }))}
                      readOnly={!!loggedEmail}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${loggedEmail ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}`}
                      placeholder="akshar@example.com"
                    />
                    {loggedEmail && (
                      <p className="text-xs text-gray-400 mt-1">Using your account email</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Summarise your experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                  <textarea
                    rows={4}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tell others about your experience with this product…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
