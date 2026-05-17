class StoreModel {
  final String id;
  final String name;
  final String? description;
  final String? logoUrl;
  final String adminEmail;
  final bool isActive;
  final int productCount;

  const StoreModel({
    required this.id,
    required this.name,
    this.description,
    this.logoUrl,
    required this.adminEmail,
    required this.isActive,
    required this.productCount,
  });

  factory StoreModel.fromJson(Map<String, dynamic> json) => StoreModel(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        logoUrl: json['logo_url'],
        adminEmail: json['admin_email'],
        isActive: json['is_active'] ?? true,
        productCount: json['product_count'] ?? 0,
      );
}

class ProductModel {
  final String id;
  final String storeId;
  final String name;
  final String? description;
  final double price;
  final int stockQuantity;
  final String? category;
  final List<String> images;
  final Map<String, dynamic> specifications;
  final bool isActive;

  const ProductModel({
    required this.id,
    required this.storeId,
    required this.name,
    this.description,
    required this.price,
    required this.stockQuantity,
    this.category,
    required this.images,
    required this.specifications,
    required this.isActive,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
        id: json['id'],
        storeId: json['store_id'],
        name: json['name'],
        description: json['description'],
        price: double.parse(json['price'].toString()),
        stockQuantity: json['stock_quantity'] ?? 0,
        category: json['category'],
        images: List<String>.from(json['images'] ?? []),
        specifications: Map<String, dynamic>.from(json['specifications'] ?? {}),
        isActive: json['is_active'] ?? true,
      );
}

class CartItem {
  final ProductModel product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get subtotal => product.price * quantity;
}
