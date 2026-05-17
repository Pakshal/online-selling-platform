import 'package:flutter/foundation.dart';
import 'package:selling_platform/models.dart';
import 'package:selling_platform/services/api_service.dart';

class StoreProvider extends ChangeNotifier {
  List<StoreModel> _stores = [];
  List<ProductModel> _products = [];
  bool _loadingStores = false;
  bool _loadingProducts = false;
  String? _error;

  List<StoreModel> get stores => _stores;
  List<ProductModel> get products => _products;
  bool get loadingStores => _loadingStores;
  bool get loadingProducts => _loadingProducts;
  String? get error => _error;

  Future<void> fetchStores() async {
    _loadingStores = true;
    _error = null;
    notifyListeners();
    try {
      _stores = await ApiService.getStores();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingStores = false;
      notifyListeners();
    }
  }

  Future<void> fetchProducts(String storeId, {String? category}) async {
    _loadingProducts = true;
    _error = null;
    notifyListeners();
    try {
      _products = await ApiService.getProducts(storeId, category: category);
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingProducts = false;
      notifyListeners();
    }
  }
}
