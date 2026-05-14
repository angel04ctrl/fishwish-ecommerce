# 🔍 DIAGRAMA VISUAL DE PROBLEMAS ENCONTRADOS

## Flujo Actual (CON PROBLEMAS)

```
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js/React)                       │
│                                                                  │
│  CheckoutPage.tsx                                               │
│  ├─ Carga Stripe (PUBLIC KEY) ← ✅ BIEN                         │
│  └─ Llama POST /api/payments/create-intent                      │
│                                                                  │
│  CheckoutForm.tsx                                               │
│  ├─ confirmPayment() ← ❌ PROBLEMA #5: Sin error handling       │
│  └─ return_url: /order-confirmation ← ❌ PROBLEMA #8: Sin ID    │
│                                                                  │
│  order-confirmation                                             │
│  └─ Sin polling ← ❌ PROBLEMA #9: Race condition               │
└─────────────────────────────────────────────────────────────────┘
                            │
                HTTP (POST) │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (Java/Spring Boot)                      │
│                                                                  │
│  PaymentController.createIntent()                               │
│  ├─ Recibe: { amount: 50, orderId: "1" }                        │
│  ├─ ❌ PROBLEMA #2: No convierte pesos a centavos               │
│  │                  amount debe ser 5000 (centavos)             │
│  ├─ StripeService.createPaymentIntent(amount, orderId)          │
│  │  └─ Crea PaymentIntent en Stripe ✓                          │
│  ├─ ❌ PROBLEMA #3: NO GUARDA paymentIntentId en BD             │
│  │                  order.setStripePaymentIntentId("pi_xxx")    │
│  └─ Retorna: { clientSecret: "pi_xxx_secret" }                 │
│                                                                  │
│  ❌ PROBLEMA #1: API keys hardcodeadas                          │
│     payment:                                                     │
│       stripe:                                                    │
│         secret-key: ${sk_test_51TWuTWRUi90V6BGx8k...}           │
└─────────────────────────────────────────────────────────────────┘
                            │
            stripe.confirmPayment() │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STRIPE (Cloud)                             │
│                                                                  │
│  1. Crea PaymentIntent { amount: 50 o 5000?, metadata }         │
│  2. Usuario paga con tarjeta                                    │
│  3. Event: payment_intent.succeeded ✓                           │
│  └─ Webhook → tu backend                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                Webhook HTTPS│
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         StripeWebhookController.handleStripeEvent()             │
│                                                                  │
│  ✅ Valida firma: Webhook.constructEvent() ← BIEN               │
│                                                                  │
│  ❌ PROBLEMA #4: NO ACTUALIZA la orden en BD                    │
│     paymentIntentId = "pi_1A2B3C4D" (del evento)               │
│     Debería: order.findByPaymentIntentId("pi_1A2B3C4D")        │
│              order.setPaymentStatus("SUCCEEDED")               │
│              orderRepository.save(order)                        │
│                                                                  │
│  Retorna: 200 OK (pero BD no se actualizó)                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                              │
│                                                                  │
│  orders table:                                                   │
│  ├─ id: 1                                                        │
│  ├─ status: "PENDING" ← ❌ NO se actualiza a "CONFIRMED"       │
│  ├─ total: 50                                                    │
│  ├─ stripe_payment_intent_id: NULL ← ❌ NO se guarda            │
│  ├─ payment_status: NULL ← ❌ NO se actualiza                   │
│  └─ paid_at: NULL ← ❌ NO se guarda                             │
│                                                                  │
│  Resultado: ❌ Orden queda como "PENDIENTE" aunque se pagó      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo CORREGIDO (Cómo debería funcionar)

```
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js/React)                       │
│                                                                  │
│  CheckoutPage.tsx                                               │
│  ├─ stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_KEY) ✅       │
│  └─ fetch POST /api/payments/create-intent                      │
│     { amount: 50, orderId: "1" }                                │
│                                                                  │
│  CheckoutForm.tsx                                               │
│  ├─ confirmPayment({                                            │
│  │   return_url: /order-confirmation?id=1 ✅ CON ID             │
│  │ })                                                            │
│  ├─ Si error: mostrar error, botón reintentar ✅                │
│  ├─ Si processing: esperar o redirigir ✅                       │
│  └─ Si success: redirigir con status ✅                         │
│                                                                  │
│  order-confirmation                                             │
│  ├─ Esperar 2 segundos (webhook puede llegar) ✅                │
│  └─ Fetch /api/orders/1/status                                  │
│     Si SUCCEEDED: mostrar confirmación ✅                        │
│     Si PENDING: polling cada 2 seg ✅                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                HTTP (POST) │ { amount: 50, orderId: "1" }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (Java/Spring Boot)                      │
│                                                                  │
│  PaymentController.createIntent()                               │
│  ├─ amountInPesos = 50                                          │
│  ├─ ✅ CONVIERTE a centavos: 50 * 100 = 5000                    │
│  ├─ Busca orden en BD: order = findById(1)                      │
│  ├─ Crea PaymentIntent:                                         │
│  │  StripeService.createPaymentIntent(5000, "1")                │
│  ├─ ✅ GUARDA paymentIntentId:                                  │
│  │  order.setStripePaymentIntentId("pi_1A2B3C4D")              │
│  │  order.setPaymentStatus("PENDING")                           │
│  │  orderRepository.save(order) ← PERSISTE EN BD ✅             │
│  └─ Retorna: { clientSecret, paymentIntentId, amount: 5000 }  │
│                                                                  │
│  ✅ Variables ENV (NO hardcodeadas):                            │
│     payment.stripe.secret-key: ${STRIPE_SECRET_KEY}             │
│     (Lee de: export STRIPE_SECRET_KEY=sk_live_xxx)              │
└─────────────────────────────────────────────────────────────────┘
                            │
            stripe.confirmPayment(){ │
              amount: 5000,           │
              currency: "mxn",        │
              metadata: {order_id:1}  │
            }                         │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STRIPE (Cloud)                             │
│                                                                  │
│  1. Crea PaymentIntent { id: "pi_1A2B3C4D", amount: 5000 } ✅   │
│  2. Usuario paga: $50.00 MXN ✅                                 │
│  3. Event: payment_intent.succeeded                             │
│  └─ Webhook → 🔐 con firma HMAC-SHA256                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                Webhook JSON │ { event: "payment_intent.succeeded",
                            │   data: { id: "pi_1A2B3C4D", ... }
                            │ }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         StripeWebhookController.handleStripeEvent()             │
│                                                                  │
│  1. ✅ Valida firma:                                            │
│     Event event = Webhook.constructEvent(payload, sig, secret)  │
│                                                                  │
│  2. ✅ Si payment_intent.succeeded:                             │
│     PaymentIntent intent = event.getData()                      │
│     intent.getId() = "pi_1A2B3C4D"                              │
│                                                                  │
│  3. ✅ BUSCA orden por PaymentIntentId:                         │
│     Order order = orderRepository.                              │
│       findByStripePaymentIntentId("pi_1A2B3C4D")                │
│                                                                  │
│  4. ✅ ACTUALIZA estado:                                        │
│     order.setPaymentStatus("SUCCEEDED")                         │
│     order.setPaidAt(LocalDateTime.now())                        │
│     order.setStatus("CONFIRMED")                                │
│     orderRepository.save(order)                                 │
│                                                                  │
│  5. ✅ Retorna: 200 OK (indica a Stripe: procesado OK)          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                              │
│                                                                  │
│  orders table:                                                   │
│  ├─ id: 1                                                        │
│  ├─ status: "CONFIRMED" ✅ ACTUALIZADO                         │
│  ├─ total: 50                                                    │
│  ├─ stripe_payment_intent_id: "pi_1A2B3C4D" ✅ GUARDADO        │
│  ├─ payment_status: "SUCCEEDED" ✅ GUARDADO                     │
│  ├─ paid_at: "2026-05-14 14:32:15" ✅ GUARDADO                 │
│  └─ payment_error_message: NULL                                 │
│                                                                  │
│  Resultado: ✅ Orden confirmada, pago procesado                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                Frontend polls│ /api/orders/1/status
                            │ Respuesta: { paymentStatus: "SUCCEEDED" }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              order-confirmation page                            │
│                                                                  │
│  ✅ Muestra: "¡Pago confirmado! Orden #1"                      │
│  ✅ Siguiente: Redirigir a /dashboard o /productos             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Matriz de Cambios

```
┌─────────────────────────────────────────────────────────────────┐
│  Problema  │  Archivo           │  Líneas  │  Cambio            │
├─────────────────────────────────────────────────────────────────┤
│ #1 Keys    │ application.yml    │ 31-33   │ Hardcode → ENV     │
│ #2 Centavos│ StripeService.java │ 10-12   │ Agregar conversión │
│ #3 Intent  │ PaymentController  │ 25-30   │ Guardar en BD      │
│ #4 Webhook │ StripeWebhookCtrl  │ 30-50   │ Actualizar orden   │
│ #5 Errors  │ CheckoutForm.tsx   │ 15-45   │ Error handling     │
│ #6 CORS    │ CorsConfig.java    │ 20-25   │ Whitelist headers  │
│ #7 Rate    │ StripeWebhookCtrl  │ 5-10    │ Rate limiter       │
│ #8 RetURL  │ CheckoutForm.tsx   │ 25      │ Incluir ID         │
│ #9 Race    │ order-confirmation │ NEW     │ Polling + delay    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparativa Antes vs Después

### Antes (ACTUAL - CON ERRORES)

```javascript
// CheckoutForm
return_url: `${window.location.origin}/order-confirmation`
// ❌ Frontend no sabe qué orden se pagó

// PaymentController
Long amount = Long.parseLong(data.get("amount").toString());
// ❌ No convierte a centavos (50 pesos = 50 centavos, INCORRECTO)

// No guarda PaymentIntentId
// ❌ Webhook no puede correlacionar pago → orden

// Webhook solo retorna 200
// ❌ Nunca actualiza estado de orden en BD

// Result: Usuario paga pero orden queda "PENDIENTE"
```

### Después (CORRECTO)

```javascript
// CheckoutForm
return_url: `${window.location.origin}/order-confirmation?id=${orderId}`
// ✅ Frontend sabe qué orden fue pagada

// PaymentController
Long amountInCents = amountInPesos * 100;
// ✅ Convierte correctamente (50 pesos = 5000 centavos)

// Guarda PaymentIntentId
order.setStripePaymentIntentId(intent.getId());
orderRepository.save(order);
// ✅ Webhook puede buscar: findByStripePaymentIntentId()

// Webhook actualiza estado
order.setPaymentStatus("SUCCEEDED");
orderRepository.save(order);
// ✅ Orden se marca como "CONFIRMADA" cuando webhook llega

// Result: Usuario paga y orden se confirma automáticamente
```

---

## Flujo de Datos - ANTES (CON PROBLEMAS)

```
Usuario    Frontend    Backend    Stripe    Webhook    Database
  │          │          │         │          │           │
  │ 1. Fill  │          │         │          │           │
  │─────────>│          │         │          │           │
  │          │ 2. POST  │         │          │           │
  │          │ /create  │         │          │           │
  │          │─────────>│         │          │           │
  │          │ 3. amount│         │          │           │
  │          │ not      │         │          │           │
  │          │ converted│         │          │           │
  │          │          │ 4.      │          │           │
  │          │          │ Create  │          │           │
  │          │          │ with    │          │           │
  │          │          │ WRONG   │          │           │
  │          │          │ amount  │          │           │
  │          │          │────────>│          │           │
  │ 5. Pay   │ 6. Click │         │ 7. Event│           │
  │─────────>│ confirm  │         │ ────────────────┐    │
  │          │ payment  │         │          │      │    │
  │          │─────────────────────────────>│      │    │
  │          │          │         │          │      │    │
  │ 8.       │ 9.       │         │          │ 10.  │    │
  │ Redirect │ Redirect │         │          │ POST │    │
  │          │ /confirm │         │          │/webhook    │
  │          │←─────────────────────────────────────┤    │
  │          │          │         │          │ 11. Nothing│
  │          │          │         │          │ happens    │
  │          │          │         │          │ ❌         │
  │          │          │         │          │           │
  │ ❌ User thinks paid │         │          │           │
  │    But order is     │         │          │           │
  │    still PENDING    │         │          │           │
```

## Flujo de Datos - DESPUÉS (CORRECTO)

```
Usuario    Frontend    Backend    Stripe    Webhook    Database
  │          │          │         │          │           │
  │ 1. Fill  │          │         │          │           │
  │─────────>│          │         │          │           │
  │          │ 2. POST  │         │          │           │
  │          │ /create  │         │          │           │
  │          │─────────>│         │          │           │
  │          │ 3. ✅    │         │          │           │
  │          │ Convert  │         │          │           │
  │          │ to       │         │          │           │
  │          │ cents    │         │          │           │
  │          │ 4. ✅    │         │          │           │
  │          │ Save in  │         │          │           │
  │          │ DB       │         │          │           │
  │          │────────>│ 5. ✅   │          │           │
  │          │         │ Create  │          │           │
  │ 6. Pay   │         │────────>│          │           │
  │─────────>│ 7. Click│         │ 8. Event│           │
  │          │ confirm │         │ ────────────────┐    │
  │          │─────────────────────────────>│      │    │
  │          │         │         │          │      │    │
  │ 9.       │ 10.     │         │          │ 11.  │    │
  │ Redirect │ Redirect│         │          │ POST │    │
  │ ?id=1    │ with ID │         │          │/webhook    │
  │          │────────>│         │          │────────────┤
  │          │         │         │          │ 12. ✅     │
  │          │         │         │          │ Find order │
  │          │         │         │          │ by PaymentID
  │          │         │         │          │ 13. ✅     │
  │          │         │         │          │ Update BD  │
  │          │         │         │          │ SUCCEEDED  │
  │          │         │         │          │           │
  │ 14.      │ 15.     │         │          │           │
  │ Poll     │ Poll    │         │          │           │
  │ /status  │────────────────────────────────────────>│
  │          │ 16.     │         │          │           │
  │          │ ✅      │         │          │           │
  │          │ Status: │         │          │           │
  │          │<─────────────────────────────────────────│
  │          │ SUCCEEDED
  │          │         │         │          │           │
  │ ✅ User  │ 17.     │         │          │           │
  │ sees     │ Success │         │          │           │
  │ payment  │ message │         │          │           │
  │ confirmed│         │         │          │           │
```

---

## Estado de Cada Componente

| Componente | Estado | Acción |
|---|---|---|
| **application.yml** | ❌ FALLO | Reemplazar hardcode con ENV |
| **StripeService.java** | ⚠️ PARCIAL | Agregar conversión centavos |
| **PaymentController.java** | ❌ FALLO | Guardar PaymentIntentId + Status |
| **Order.java** | ❌ FALLO | Agregar 4 columnas |
| **OrderRepository.java** | ❌ FALLO | Agregar 1 método búsqueda |
| **StripeWebhookController.java** | ❌ FALLO | Implementar lógica completa |
| **CorsConfig.java** | ⚠️ INSEGURO | Cambiar wildcard por whitelist |
| **CheckoutForm.tsx** | ⚠️ PARCIAL | Agregar error handling |
| **CheckoutPage.tsx** | ⚠️ PARCIAL | Incluir orderId en return URL |
| **order-confirmation/page.tsx** | ❌ NO EXISTE | Crear página con polling |

---

**Diagrama Preparado Por:** Arquitecto Senior - Seguridad PCI-DSS
**Fecha:** 14 Mayo 2026
