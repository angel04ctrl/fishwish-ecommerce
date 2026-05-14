package com.fishwish.order.payment.stripe;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.stripe.model.PaymentIntent;
import com.fishwish.order.model.Order;
import com.fishwish.order.repository.OrderRepository;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;
    
    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/create-intent")
    public Map<String, Object> createIntent(@RequestBody Map<String, Object> data) throws Exception {
        try {
            // 1. Extraer datos del frontend
            Long orderId = Long.parseLong(data.get("orderId").toString());
            Double amountInPesos = Double.parseDouble(data.get("amount").toString());
            
            // 2. ✅ Convertir pesos a centavos
            // Frontend envía: 50 (pesos) → Backend convierte a 5000 (centavos)
            Long amountInCents = Math.round(amountInPesos * 100);
            
            // 3. Validar que orden existe
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no existe: " + orderId));
            
            // 4. Crear PaymentIntent en Stripe
            PaymentIntent intent = stripeService.createPaymentIntent(amountInCents, orderId.toString());
            
            // 5. ✅ GUARDAR en BD (CRÍTICO)
            order.setStripePaymentIntentId(intent.getId());
            order.setPaymentStatus("PENDING");
            orderRepository.save(order);
            
            System.out.println("💾 Guardado PaymentIntent " + intent.getId() + 
                              " para Orden " + orderId);
            
            // 6. Retornar al frontend
            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret", intent.getClientSecret());
            response.put("paymentIntentId", intent.getId());
            response.put("amount", amountInCents);
            response.put("currency", "mxn");
            
            return response;
            
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Formato de datos inválido: " + e.getMessage());
        }
    }
}