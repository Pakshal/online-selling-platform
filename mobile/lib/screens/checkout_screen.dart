import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:selling_platform/providers/cart_provider.dart';
import 'package:selling_platform/services/api_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _pincode = TextEditingController();
  final _notes = TextEditingController();
  bool _placing = false;

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _address, _city, _pincode, _notes]) c.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;
    final cart = context.read<CartProvider>();
    setState(() => _placing = true);
    try {
      final payload = {
        'store_id': cart.storeId,
        'customer': {
          'name': _name.text.trim(),
          'phone': _phone.text.trim(),
          'email': _email.text.trim(),
          'address': _address.text.trim(),
          'city': _city.text.trim(),
          'pincode': _pincode.text.trim(),
        },
        'items': cart.items.map((i) => {
          'product_id': i.product.id,
          'product_name': i.product.name,
          'price': i.product.price,
          'quantity': i.quantity,
        }).toList(),
        'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        'subtotal': cart.subtotal,
        'delivery_charges': cart.deliveryCharge,
        'total_amount': cart.total,
      };
      final result = await ApiService.placeOrder(payload);
      cart.clear();
      if (mounted) {
        context.go('/order-success', extra: {
          'orderNumber': result['orderNumber'],
          'orderId': result['orderId'],
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to place order: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Customer Information',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              _Field('Full Name', _name, required: true),
              _Field('Phone Number', _phone, required: true,
                  keyboard: TextInputType.phone),
              _Field('Email Address', _email, required: true,
                  keyboard: TextInputType.emailAddress),
              _Field('Delivery Address', _address, required: true, maxLines: 2),
              _Field('City', _city, required: true),
              _Field('Pincode', _pincode, required: true,
                  keyboard: TextInputType.number),
              _Field('Notes (Optional)', _notes, maxLines: 2),
              const SizedBox(height: 16),
              const Text('Order Summary',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...cart.items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('${item.product.name} × ${item.quantity}',
                        overflow: TextOverflow.ellipsis)),
                    Text('₹${item.subtotal.toStringAsFixed(0)}'),
                  ],
                ),
              )),
              const Divider(height: 20),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text('Subtotal'), Text('₹${cart.subtotal.toStringAsFixed(0)}')]),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text('Delivery'), Text('₹${cart.deliveryCharge.toStringAsFixed(0)}')]),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('₹${cart.total.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF2563EB))),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _placing ? null : _placeOrder,
                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: _placing
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Place Order', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool required;
  final int maxLines;
  final TextInputType keyboard;

  const _Field(this.label, this.controller, {
    this.required = false,
    this.maxLines = 1,
    this.keyboard = TextInputType.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboard,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          filled: true,
          fillColor: Colors.grey[50],
        ),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }
}
