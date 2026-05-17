import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:selling_platform/providers/cart_provider.dart';
import 'package:selling_platform/services/api_service.dart';
import 'package:selling_platform/models.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  ProductModel? _product;
  bool _loading = true;
  int _qty = 1;
  int _imgIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await ApiService.getProduct(widget.productId);
      setState(() { _product = p; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();

    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_product == null) return const Scaffold(body: Center(child: Text('Product not found')));

    final p = _product!;

    return Scaffold(
      appBar: AppBar(title: Text(p.name)),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (p.images.isNotEmpty) ...[
              SizedBox(
                height: 280,
                child: PageView.builder(
                  itemCount: p.images.length,
                  onPageChanged: (i) => setState(() => _imgIndex = i),
                  itemBuilder: (_, i) => CachedNetworkImage(
                    imageUrl: p.images[i],
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: Colors.grey[200]),
                    errorWidget: (_, __, ___) => Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.image_not_supported, size: 48),
                    ),
                  ),
                ),
              ),
              if (p.images.length > 1)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(p.images.length, (i) => Container(
                    margin: const EdgeInsets.all(4),
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _imgIndex == i ? const Color(0xFF2563EB) : Colors.grey[300],
                    ),
                  )),
                ),
            ] else
              Container(
                height: 280,
                color: Colors.grey[200],
                child: const Center(child: Icon(Icons.image_not_supported, size: 64)),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('₹${p.price.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 24, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    p.stockQuantity > 0 ? 'In Stock (${p.stockQuantity})' : 'Out of Stock',
                    style: TextStyle(
                      color: p.stockQuantity > 0 ? Colors.green : Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (p.description != null) ...[
                    const SizedBox(height: 12),
                    Text(p.description!, style: TextStyle(color: Colors.grey[700], height: 1.5)),
                  ],
                  if (p.specifications.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text('Specifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...p.specifications.entries.map((e) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Text('${e.key}: ', style: const TextStyle(fontWeight: FontWeight.w500)),
                          Text('${e.value}'),
                        ],
                      ),
                    )),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Text('Quantity:', style: TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('$_qty', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      IconButton(
                        onPressed: _qty < p.stockQuantity ? () => setState(() => _qty++) : null,
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.tonal(
                          onPressed: p.stockQuantity > 0 ? () {
                            for (var i = 0; i < _qty; i++) cart.addItem(p);
                            context.push('/cart');
                          } : null,
                          child: const Text('Add to Cart'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: p.stockQuantity > 0 ? () {
                            for (var i = 0; i < _qty; i++) cart.addItem(p);
                            context.push('/checkout');
                          } : null,
                          child: const Text('Buy Now'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
