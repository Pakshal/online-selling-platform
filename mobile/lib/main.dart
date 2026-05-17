import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:selling_platform/providers/cart_provider.dart';
import 'package:selling_platform/providers/store_provider.dart';
import 'package:selling_platform/router.dart';

void main() {
  runApp(const SellingPlatformApp());
}

class SellingPlatformApp extends StatelessWidget {
  const SellingPlatformApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => StoreProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: MaterialApp.router(
        title: 'Selling Platform',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
          useMaterial3: true,
        ),
        routerConfig: appRouter,
      ),
    );
  }
}
