package com.fishwish.order.payment.stripe;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fishwish.order.model.Order;
import com.fishwish.order.repository.OrderRepository;
import com.stripe.model.PaymentIntent;

/**
 * 💳 PaymentController - Maneja créación de PaymentIntents para Stripe
 * 
 * Endpoint: POST /api/payments/create-intent
 * Body: { "orderId": 123, "amount": 50 }
 * Response: { "clientSecret": "pi_xxx_secret", "paymentIntentId": "pi_xxx" }
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;
    
    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/create-intent")
    public ResponseEntity<?> createIntent(
        @RequestBody Map<String, Object> data,
        @RequestHeader(value = "Origin", required = false) String origin
    ) {
        System.out.println("\n📍 ===== POST /api/payments/create-intent =====");
        System.out.println("🌐 Origin: " + origin);
        System.out.println("📦 Data recibido: " + data);

        try {
            // 1. Extraer datos del frontend
            Long orderId = Long.parseLong(data.get("orderId").toString());
            Double amountInPesos = Double.parseDouble(data.get("amount").toString());
            
            System.out.println("✅ Datos parseados: orderId=" + orderId + ", amount=" + amountInPesos + " pesos");
            
            // 2. ✅ Convertir pesos a centavos
            Long amountInCents = Math.round(amountInPesos * 100);
            System.out.println("✅ Convertido a centavos: " + amountInCents);
            
            // 3. Validar que orden existe en BD
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    System.out.println("❌ ERROR: Orden no existe con ID: " + orderId);
                    return new IllegalArgumentException("Orden no existe: " + orderId);
                });
            
            System.out.println("✅ Orden encontrada en BD: " + order.getId() + " - Total: $" + order.getTotalAmount());
            
            // 4. Crear PaymentIntent en Stripe
            System.out.println("🔄 Creando PaymentIntent en Stripe...");
            PaymentIntent intent = stripeService.createPaymentIntent(amountInCents, orderId.toString());
            
            System.out.println("✅ PaymentIntent creado: " + intent.getId());
            
            // 5. ✅ GUARDAR en BD (CRÍTICO)
            order.setStripePaymentIntentId(intent.getId());
            order.setPaymentStatus("PENDING");
            orderRepository.save(order);
            
            System.out.println("💾 PaymentIntent guardado en BD para Orden " + orderId);
            
            // 6. Retornar al frontend
            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret", intent.getClientSecret());
            response.put("paymentIntentId", intent.getId());
            response.put("amount", amountInCents);
            response.put("currency", "mxn");
            response.put("status", intent.getStatus());
            
            System.out.println("✅ Respuesta enviada al frontend");
            System.out.println("===== FIN /api/payments/create-intent ===== \n");
            
            return ResponseEntity.ok(response);
            
        } catch (NumberFormatException e) {
            String error = "Formato de datos inválido: " + e.getMessage();
            System.out.println("❌ ERROR: " + error);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", error);
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (IllegalArgumentException e) {
            String error = e.getMessage();
            System.out.println("❌ ERROR: " + error);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", error);
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            String error = "Error procesando pago: " + e.getMessage();
            System.out.println("❌ ERROR CRÍTICO: " + error);
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", error);
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}