import 'package:flutter/foundation.dart';
import 'package:selling_platform/models.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  String? _storeId;

  List<CartItem> get items => List.unmodifiable(_items);
  String? get storeId => _storeId;
  int get itemCount => _items.fold(0, (s, i) => s + i.quantity);

  double get subtotal => _items.fold(0, (s, i) => s + i.subtotal);
  double deliveryCharge = 50;
  double get total => subtotal + deliveryCharge;

  void addItem(ProductModel product) {
    if (_storeId != null && _storeId != product.storeId) {
      _items.clear();
    }
    _storeId = product.storeId;
    final existing = _items.where((i) => i.product.id == product.id);
    if (existing.isNotEmpty) {
      existing.first.quantity++;
    } else {
      _items.add(CartItem(product: product));
    }
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    if (_items.isEmpty) _storeId = null;
    notifyListeners();
  }

  void updateQuantity(String productId, int qty) {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    final item = _items.firstWhere((i) => i.product.id == productId);
    item.quantity = qty;
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _storeId = null;
    notifyListeners();
  }
}
