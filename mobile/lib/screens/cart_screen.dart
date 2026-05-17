import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:selling_platform/providers/cart_provider.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: cart.items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text('Your cart is empty', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => context.go('/'),
                    child: const Text('Continue Shopping'),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final item = cart.items[i];
                      return Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: item.product.images.isNotEmpty
                                    ? CachedNetworkImage(
                                        imageUrl: item.product.images.first,
                                        width: 64, height: 64, fit: BoxFit.cover,
                                        placeholder: (_, __) => Container(width: 64, height: 64, color: Colors.grey[200]),
                                        errorWidget: (_, __, ___) => Container(width: 64, height: 64, color: Colors.grey[200]),
                                      )
                                    : Container(width: 64, height: 64, color: Colors.grey[200]),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.product.name,
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                        maxLines: 2, overflow: TextOverflow.ellipsis),
                                    Text('₹${item.product.price.toStringAsFixed(0)}',
                                        style: const TextStyle(color: Color(0xFF2563EB))),
                                  ],
                                ),
                              ),
                              Column(
                                children: [
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove, size: 16),
                                        onPressed: () => context.read<CartProvider>()
                                            .updateQuantity(item.product.id, item.quantity - 1),
                                      ),
                                      Text('${item.quantity}',
                                          style: const TextStyle(fontWeight: FontWeight.bold)),
                                      IconButton(
                                        icon: const Icon(Icons.add, size: 16),
                                        onPressed: () => context.read<CartProvider>()
                                            .updateQuantity(item.product.id, item.quantity + 1),
                                      ),
                                    ],
                                  ),
                                  Text('₹${item.subtotal.toStringAsFixed(0)}',
                                      style: const TextStyle(fontWeight: FontWeight.bold)),
                                  TextButton(
                                    onPressed: () => context.read<CartProvider>()
                                        .removeItem(item.product.id),
                                    child: const Text('Remove', style: TextStyle(color: Colors.red, fontSize: 12)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                  ),
                  child: Column(
                    children: [
                      _SummaryRow('Subtotal', '₹${cart.subtotal.toStringAsFixed(0)}'),
                      _SummaryRow('Delivery', '₹${cart.deliveryCharge.toStringAsFixed(0)}'),
                      const Divider(),
                      _SummaryRow('Total', '₹${cart.total.toStringAsFixed(0)}',
                          bold: true, large: true),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: () => context.push('/checkout'),
                          child: const Text('Proceed to Checkout'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  final bool large;
  const _SummaryRow(this.label, this.value, {this.bold = false, this.large = false});

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.bold : FontWeight.normal,
      fontSize: large ? 16 : 14,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label, style: style), Text(value, style: style)],
      ),
    );
  }
}
