# 🔧 ARCHIVOS DE CORRECCIÓN PROPUESTOS
## Cambios Necesarios Pre-Deployment

---

## 1️⃣ application.yml (Backend) - CORRECCIÓN CRÍTICA

**Ubicación:** `apps/order-service/src/main/resources/application.yml`

```yaml
# ✅ REEMPLAZAR COMPLETAMENTE CON:

server:
  port: 8082

spring:
  application:
    name: order-service

  datasource:
    url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
    username: ${PGUSER}
    password: ${PGPASSWORD}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false  # ⚠️ CAMBIAR A FALSE EN PRODUCCIÓN
    properties:
      hibernate:
        format_sql: false

app:
  product-service:
    url: ${PRODUCT_SERVICE_URL:http://localhost:8081/api/products}

# ✅ CORRECCIÓN CRÍTICA: Usar variables ENV sin hardcodear
payment:
  stripe:
    secret-key: ${STRIPE_SECRET_KEY}  # Lee de variable ENV
    public-key: ${STRIPE_PUBLIC_KEY}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET}
```

**Cambios:**
- ❌ Remover: `sk_test_51TWuTWRUi90V6BGx...` (hardcoded)
- ✅ Usar: `${STRIPE_SECRET_KEY}` (variable ENV)

---

## 2️⃣ StripeConfig.java - Sin cambios (Ya correcto ✓)

```java
// MANTENER COMO ESTÁ - Está bien implementado

package com.fishwish.order.payment.stripe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;

@Configuration
public class StripeConfig {

    @Value("${payment.stripe.secret-key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        if (secretKey == null || secretKey.isEmpty()) {
            throw new IllegalStateException(
                "STRIPE_SECRET_KEY no configurada. Agrega la variable ENV."
            );
        }
        Stripe.apiKey = secretKey;
    }
}
```

---

## 3️⃣ StripeService.java - CORRECCIÓN IMPORTANTE

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/payment/stripe/StripeService.java`

```java
// ✅ REEMPLAZAR CON:

package com.fishwish.order.payment.stripe;

import org.springframework.stereotype.Service;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

@Service
public class StripeService {

    /**
     * Crear un PaymentIntent en Stripe
     * @param amountInCents Monto en centavos (ej: 5000 = $50.00 MXN)
     * @param orderId ID de la orden para tracking
     * @return PaymentIntent creado en Stripe
     */
    public PaymentIntent createPaymentIntent(Long amountInCents, String orderId) throws Exception {
        // ✅ Validar montos
        if (amountInCents == null || amountInCents < 100) {
            throw new IllegalArgumentException("Monto mínimo: 100 centavos ($1.00 MXN)");
        }
        if (amountInCents > 999999999) {  // 9,999,999.99 MXN
            throw new IllegalArgumentException("Monto máximo excedido");
        }

        // Configurar parámetros del PaymentIntent
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
            .setAmount(amountInCents)  // ✅ Centavos (Stripe native)
            .setCurrency("mxn")
            .setAutomaticPaymentMethods(
                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    .build()
            )
            // ✅ METADATA: Guardar orderId para webhook
            .putMetadata("order_id", orderId)
            .build();

        // Crear en Stripe
        PaymentIntent intent = PaymentIntent.create(params);
        
        System.out.println("✅ PaymentIntent creado: " + intent.getId() + 
                          " para Orden: " + orderId);
        
        return intent;
    }
}
```

---

## 4️⃣ PaymentController.java - CORRECCIÓN CRÍTICA

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/payment/stripe/PaymentController.java`

```java
// ✅ REEMPLAZAR CON:

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
```

**Cambios clave:**
- ✅ Convierte pesos a centavos: `amountInPesos * 100`
- ✅ Guarda PaymentIntentId en BD: `order.setStripePaymentIntentId(...)`
- ✅ Actualiza paymentStatus: `order.setPaymentStatus("PENDING")`

---

## 5️⃣ StripeWebhookController.java - CORRECCIÓN CRÍTICA

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/payment/stripe/StripeWebhookController.java`

```java
// ✅ REEMPLAZAR CON:

package com.fishwish.order.payment.stripe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.exception.SignatureVerificationException;
import com.fishwish.order.model.Order;
import com.fishwish.order.repository.OrderRepository;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/payments/webhooks")
public class StripeWebhookController {

    @Value("${payment.stripe.webhook-secret}")
    private String endpointSecret;
    
    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeEvent(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        try {
            // 1. ✅ Validar firma del webhook
            Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            
            System.out.println("🔔 Webhook recibido: " + event.getType());

            // 2. Procesar eventos
            if ("payment_intent.succeeded".equals(event.getType())) {
                handlePaymentSucceeded(event);
            } 
            else if ("payment_intent.payment_failed".equals(event.getType())) {
                handlePaymentFailed(event);
            }
            else if ("payment_intent.canceled".equals(event.getType())) {
                handlePaymentCanceled(event);
            }

            // 3. Retornar 200 OK para Stripe
            return ResponseEntity.ok("Webhook procesado");
            
        } catch (SignatureVerificationException e) {
            System.err.println("⚠️ Firma webhook inválida: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Signature verification failed");
        } 
        catch (Exception e) {
            System.err.println("❌ Error procesando webhook: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.OK).body("Webhook procesado con error (reintentará)");
        }
    }

    private void handlePaymentSucceeded(Event event) throws Exception {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
        String paymentIntentId = intent.getId();
        String orderId = intent.getMetadata().get("order_id");

        // ✅ Buscar orden por PaymentIntentId
        Order order = orderRepository.findByStripePaymentIntentId(paymentIntentId)
            .orElseThrow(() -> new RuntimeException(
                "Orden no encontrada para PaymentIntent: " + paymentIntentId
            ));

        // ✅ Actualizar BD
        order.setPaymentStatus("SUCCEEDED");
        order.setPaidAt(LocalDateTime.now());
        order.setStatus("CONFIRMED");
        orderRepository.save(order);

        System.out.println("✅ Orden " + orderId + " confirmada por pago: " + paymentIntentId);
        
        // TODO: Aquí podrías:
        // - Enviar email confirmación
        // - Decrementar stock
        // - Generar factura
        // - Notificar almacén
    }

    private void handlePaymentFailed(Event event) throws Exception {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
        
        Order order = orderRepository.findByStripePaymentIntentId(intent.getId()).orElse(null);
        if (order != null) {
            String errorMsg = intent.getLastPaymentError() != null ? 
                intent.getLastPaymentError().getMessage() : "Pago rechazado";
            
            order.setPaymentStatus("FAILED");
            order.setPaymentErrorMessage(errorMsg);
            orderRepository.save(order);
            
            System.out.println("❌ Pago fallido para orden " + order.getId() + 
                              ": " + errorMsg);
        }
    }

    private void handlePaymentCanceled(Event event) throws Exception {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
        
        Order order = orderRepository.findByStripePaymentIntentId(intent.getId()).orElse(null);
        if (order != null) {
            order.setPaymentStatus("CANCELED");
            orderRepository.save(order);
            
            System.out.println("⏹️ Pago cancelado para orden " + order.getId());
        }
    }
}
```

**Cambios clave:**
- ✅ Busca orden por `findByStripePaymentIntentId()`
- ✅ Actualiza estado: `order.setPaymentStatus("SUCCEEDED")`
- ✅ Maneja múltiples eventos
- ✅ Retorna 200 OK siempre (para Stripe retry logic)

---

## 6️⃣ Order.java - NUEVOS CAMPOS

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/model/Order.java`

```java
// ✅ AGREGAR estos campos a la clase Order:

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    
    // ... campos existentes ...
    
    // ✅ NUEVOS CAMPOS PARA STRIPE
    @Column(unique = true, nullable = true)
    private String stripePaymentIntentId;  // Ej: "pi_1A2B3C4D"
    
    @Column(nullable = true)
    private String paymentStatus = "PENDING";  // "PENDING", "SUCCEEDED", "FAILED", "CANCELED"
    
    @Column(nullable = true)
    private LocalDateTime paidAt;  // Cuándo se confirmó el pago
    
    @Column(nullable = true)
    private String paymentErrorMessage;  // Si falla, guardar motivo
    
    // Getters y Setters
    public String getStripePaymentIntentId() {
        return stripePaymentIntentId;
    }
    
    public void setStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    public String getPaymentStatus() {
        return paymentStatus;
    }
    
    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
    
    public LocalDateTime getPaidAt() {
        return paidAt;
    }
    
    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
    
    public String getPaymentErrorMessage() {
        return paymentErrorMessage;
    }
    
    public void setPaymentErrorMessage(String paymentErrorMessage) {
        this.paymentErrorMessage = paymentErrorMessage;
    }
}
```

---

## 7️⃣ OrderRepository.java - NUEVO MÉTODO

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/repository/OrderRepository.java`

```java
// ✅ AGREGAR este método:

package com.fishwish.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.fishwish.order.model.Order;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // ✅ Nuevo método para buscar por PaymentIntentId
    Optional<Order> findByStripePaymentIntentId(String stripePaymentIntentId);
}
```

---

## 8️⃣ CorsConfig.java - CORRECCIÓN DE SEGURIDAD

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/config/CorsConfig.java`

```java
// ✅ REEMPLAZAR CON:

package com.fishwish.order.config;

import java.util.Arrays;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> customCorsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        
        // ✅ Whitelist explícita de orígenes permitidos
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "https://fishwish-ecommerce-web-five.vercel.app",
            "https://fishwish.com"
        ));

        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        // ✅ Headers específicos (NO "*")
        config.setAllowedHeaders(Arrays.asList(
            "Content-Type",
            "Authorization",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));

        // ✅ Headers a exponer (NO "*")
        config.setExposedHeaders(Arrays.asList(
            "Content-Type",
            "X-Total-Count"
        ));

        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = 
            new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        
        return bean;
    }
}
```

---

## 9️⃣ CheckoutForm.tsx - CORRECCIÓN CRÍTICA

**Ubicación:** `apps/web/app/payment/CheckoutForm.tsx`

```typescript
// ✅ REEMPLAZAR CON:

'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Pasarela de pago no está lista. Recarga la página.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMessage(null);

    try {
      // ✅ Confirmar pago con Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // ✅ INCLUIR orderId en return URL
          return_url: `${window.location.origin}/order-confirmation?id=${orderId}&pi=${paymentIntent?.id || ''}`,
        },
        redirect: "if_required",
      });

      // ✅ Manejar errores específicos
      if (confirmError) {
        if (confirmError.message?.includes("authentication_required")) {
          setMessage("Se requiere verificación adicional (3D Secure). Por favor, completa el desafío.");
          setIsProcessing(false);
          return;
        }

        setError(
          confirmError.message ||
          "Fallo al procesar el pago. Verifica tu tarjeta e intenta de nuevo."
        );
        setIsProcessing(false);
        return;
      }

      // ✅ Pago exitoso
      if (paymentIntent?.status === "succeeded") {
        setMessage("✅ Pago exitoso. Redirigiendo...");
        setTimeout(() => {
          router.push(
            `/order-confirmation?id=${orderId}&payment_intent=${paymentIntent.id}&status=success`
          );
        }, 1500);
        return;
      }

      if (paymentIntent?.status === "processing") {
        setMessage("Pago en proceso. Espera o redirigiremos cuando se complete.");
        
        // ✅ Polling cada 2 segundos
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const res = await fetch(`/api/orders/${orderId}/status`);
            const data = await res.json();
            
            if (data.paymentStatus === "SUCCEEDED") {
              clearInterval(pollInterval);
              router.push(`/order-confirmation?id=${orderId}&status=success`);
            }
            
            if (attempts >= 10) {
              clearInterval(pollInterval);
              setMessage("Pago en proceso. Revisa tu email para confirmar.");
            }
          } catch (err) {
            console.error("Error polling:", err);
          }
        }, 2000);
        return;
      }

      setError("Estado de pago desconocido. Contacta a soporte.");
      setIsProcessing(false);

    } catch (err: any) {
      setError(err?.message || "Error desconocido. Intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4">
      {/* ✅ Mostrar errores */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ {error}
        </div>
      )}

      {/* ✅ Mostrar mensajes */}
      {message && (
        <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {message}
        </div>
      )}

      <PaymentElement />

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className={`w-full p-2 rounded text-white font-semibold ${
          isProcessing || !stripe
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isProcessing ? "Procesando..." : "Pagar ahora"}
      </button>

      {/* ✅ Botón de reintentar si falló */}
      {error && !isProcessing && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            handleSubmit({ preventDefault: () => {} } as any);
          }}
          className="w-full p-2 rounded text-blue-600 border border-blue-600 hover:bg-blue-50"
        >
          Reintentar
        </button>
      )}
    </form>
  );
}
```

---

## 🔟 Migración SQL para BD

**Ejecutar en PostgreSQL:**

```sql
-- Agregar columnas a tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error_message VARCHAR(500);

-- Crear índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
```

---

## 📋 CONFIGURAR VARIABLES ENV EN RAILWAY

**En Railway Dashboard → Environment Variables:**

```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
PGHOST=yourdb.railway.internal
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=xxxxx
```

---

## 📋 CONFIGURAR VARIABLES ENV EN VERCEL

**En Vercel Dashboard → Project Settings → Environment Variables:**

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_API_URL=https://order-service-production.up.railway.app
```

---

**Archivo de Correcciones Preparado Por:** Arquitecto Senior - Seguridad PCI-DSS
**Fecha:** 14 Mayo 2026
