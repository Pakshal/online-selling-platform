import 'package:dio/dio.dart';
import 'package:selling_platform/constants.dart';
import 'package:selling_platform/models.dart';

class ApiService {
  static final _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  static Future<List<StoreModel>> getStores() async {
    final res = await _dio.get('/stores');
    return (res.data as List).map((e) => StoreModel.fromJson(e)).toList();
  }

  static Future<List<ProductModel>> getProducts(String storeId, {String? category}) async {
    final res = await _dio.get(
      '/stores/$storeId/products',
      queryParameters: category != null ? {'category': category} : null,
    );
    return (res.data as List).map((e) => ProductModel.fromJson(e)).toList();
  }

  static Future<ProductModel> getProduct(String productId) async {
    final res = await _dio.get('/products/$productId');
    return ProductModel.fromJson(res.data);
  }

  static Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> payload) async {
    final res = await _dio.post('/orders', data: payload);
    return Map<String, dynamic>.from(res.data);
  }

  static Future<Map<String, dynamic>> getOrder(String orderId) async {
    final res = await _dio.get('/orders/$orderId');
    return Map<String, dynamic>.from(res.data);
  }
}
