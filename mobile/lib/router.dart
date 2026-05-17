import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:selling_platform/screens/home_screen.dart';
import 'package:selling_platform/screens/store_screen.dart';
import 'package:selling_platform/screens/product_detail_screen.dart';
import 'package:selling_platform/screens/cart_screen.dart';
import 'package:selling_platform/screens/checkout_screen.dart';
import 'package:selling_platform/screens/order_success_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    GoRoute(
      path: '/store/:storeId',
      builder: (_, state) => StoreScreen(storeId: state.pathParameters['storeId']!),
    ),
    GoRoute(
      path: '/product/:productId',
      builder: (_, state) => ProductDetailScreen(productId: state.pathParameters['productId']!),
    ),
    GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
    GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
    GoRoute(
      path: '/order-success',
      builder: (_, state) {
        final extra = state.extra as Map<String, dynamic>;
        return OrderSuccessScreen(
          orderNumber: extra['orderNumber'],
          orderId: extra['orderId'],
        );
      },
    ),
  ],
);
