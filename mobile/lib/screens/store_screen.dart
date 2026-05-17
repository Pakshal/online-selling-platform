import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:selling_platform/providers/store_provider.dart';
import 'package:selling_platform/providers/cart_provider.dart';
import 'package:selling_platform/models.dart';

class StoreScreen extends StatefulWidget {
  final String storeId;
  const StoreScreen({super.key, required this.storeId});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  String _view = 'grid';
  String? _category;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StoreProvider>().fetchProducts(widget.storeId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<StoreProvider>();
    final cartCount = context.watch<CartProvider>().itemCount;
    final categories = provider.products.map((p) => p.category).whereType<String>().toSet().toList();
    final filtered = _category == null
        ? provider.products
        : provider.products.where((p) => p.category == _category).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () => context.push('/cart'),
              ),
              if (cartCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    child: Text('$cartCount',
                        style: const TextStyle(color: Colors.white, fontSize: 10)),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: Icon(_view == 'grid' ? Icons.list : Icons.grid_view),
            onPressed: () => setState(() => _view = _view == 'grid' ? 'list' : 'grid'),
          ),
        ],
      ),
      body: Column(
        children: [
          if (categories.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _CategoryChip(label: 'All', selected: _category == null,
                      onTap: () => setState(() => _category = null)),
                  ...categories.map((c) => _CategoryChip(
                        label: c,
                        selected: _category == c,
                        onTap: () => setState(() => _category = c),
                      )),
                ],
              ),
            ),
          Expanded(
            child: provider.loadingProducts
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? const Center(child: Text('No products found'))
                    : _view == 'grid'
                        ? _ProductGrid(products: filtered)
                        : _ProductList(products: filtered),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _CategoryChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _ProductGrid extends StatelessWidget {
  final List<ProductModel> products;
  const _ProductGrid({required this.products});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, childAspectRatio: 0.7, crossAxisSpacing: 12, mainAxisSpacing: 12,
      ),
      itemCount: products.length,
      itemBuilder: (_, i) => _ProductCard(product: products[i]),
    );
  }
}

class _ProductList extends StatelessWidget {
  final List<ProductModel> products;
  const _ProductList({required this.products});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: products.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _ProductListTile(product: products[i]),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final ProductModel product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    return GestureDetector(
      onTap: () => context.push('/product/${product.id}'),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: product.images.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: product.images.first,
                      height: 120, width: double.infinity, fit: BoxFit.cover,
                      placeholder: (_, __) => Container(height: 120, color: Colors.grey[200]),
                      errorWidget: (_, __, ___) => Container(
                        height: 120, color: Colors.grey[200],
                        child: const Icon(Icons.image_not_supported),
                      ),
                    )
                  : Container(height: 120, color: Colors.grey[200],
                      child: const Icon(Icons.image_not_supported)),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text('₹${product.price.toStringAsFixed(0)}',
                      style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: product.stockQuantity > 0
                          ? () { cart.addItem(product); ScaffoldMessenger.of(context)
                                .showSnackBar(const SnackBar(content: Text('Added to cart'), duration: Duration(seconds: 1))); }
                          : null,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        textStyle: const TextStyle(fontSize: 11),
                      ),
                      child: Text(product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'),
                    ),
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

class _ProductListTile extends StatelessWidget {
  final ProductModel product;
  const _ProductListTile({required this.product});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        onTap: () => context.push('/product/${product.id}'),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: product.images.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: product.images.first,
                  width: 56, height: 56, fit: BoxFit.cover,
                  placeholder: (_, __) => Container(width: 56, height: 56, color: Colors.grey[200]),
                  errorWidget: (_, __, ___) => Container(width: 56, height: 56, color: Colors.grey[200],
                      child: const Icon(Icons.image_not_supported, size: 16)),
                )
              : Container(width: 56, height: 56, color: Colors.grey[200]),
        ),
        title: Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text('₹${product.price.toStringAsFixed(0)}',
            style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
        trailing: IconButton(
          icon: const Icon(Icons.add_shopping_cart),
          onPressed: product.stockQuantity > 0
              ? () { cart.addItem(product); }
              : null,
        ),
      ),
    );
  }
}
