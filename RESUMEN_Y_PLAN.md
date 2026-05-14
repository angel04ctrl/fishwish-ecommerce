# 🎯 RESUMEN EJECUTIVO Y PLAN DE ACCIÓN
## Auditoría Stripe - Fishwish E-Commerce

---

## 🔴 VEREDICTO FINAL

**Status:** ❌ **NO APTO PARA DEPLOY**  
**Bloqueadores:** 6 problemas críticos  
**Tiempo de Corrección Estimado:** 4-6 horas  
**Prioridad:** 🚨 URGENTE

---

## 📊 PROBLEMAS POR SEVERIDAD

### 🔴 CRÍTICOS (Bloquean Deploy)

| ID | Problema | Archivos | Riesgo |
|---|---|---|---|
| **1** | API Keys hardcodeadas en yml | application.yml | Exposición credenciales |
| **2** | Conversión de centavos incorrecta | StripeService.java | Usuario paga monto erróneo |
| **3** | PaymentIntentId no se guarda | PaymentController.java | Webhook no correlaciona orden |
| **4** | Webhook no actualiza BD | StripeWebhookController.java | Orden no se confirma |
| **5** | Sin error handling en frontend | CheckoutForm.tsx | UX rota si falla pago |
| **6** | CORS demasiado permisivo | CorsConfig.java | Vulnerabilidad CSRF |

### 🟠 SEGURIDAD (Alta Prioridad)

| ID | Problema | Archivo | Fix Time |
|---|---|---|---|
| **7** | Webhook público sin rate limit | StripeWebhookController.java | 15 min |
| **8** | Return URL sin orderId | CheckoutForm.tsx | 5 min |
| **9** | Race condition webhook/frontend | CheckoutPage.tsx | 20 min |

---

## ⏱️ PLAN DE ACCIÓN POR HORA

### Hora 0-1: Análisis y Preparación
```
☐ Leer auditoría completa (AUDITORIA_PREDEPLOYMENT_STRIPE.md)
☐ Cambiar API keys Stripe (crear nuevas LIVE en dashboard)
☐ Revocar antiguas claves comprometidas (sk_test_*, pk_test_*, whsec_*)
☐ Crear .env.local con nuevas credenciales
```

### Hora 1-2: Backend Crítico
```
☐ Actualizar application.yml (credenciales a ENV)
☐ Modificar StripeService.java (conversión centavos)
☐ Modificar PaymentController.java (guardar PaymentIntentId)
☐ Actualizar Order.java (nuevos campos)
☐ Crear método OrderRepository.findByStripePaymentIntentId()
```

### Hora 2-3: Backend Webhooks
```
☐ Implementar StripeWebhookController.java completamente
☐ Agregar manejo de 3 eventos: succeeded, failed, canceled
☐ Ejecutar migración SQL en BD local
☐ Test webhook en Stripe CLI
```

### Hora 3-4: Frontend
```
☐ Actualizar CheckoutForm.tsx (error handling)
☐ Agregar polling en order-confirmation
☐ Test en modo SANDBOX
☐ Verificar conversión centavos end-to-end
```

### Hora 4-5: Seguridad
```
☐ Actualizar CorsConfig.java (whitelist headers)
☐ Agregar rate limiting webhook
☐ Incluir orderId en return URL
☐ Test CORS desde Vercel
```

### Hora 5-6: Testing y Deployment
```
☐ Testing E2E en sandbox
☐ Cambiar a credenciales LIVE
☐ Configurar variables en Railway + Vercel
☐ Deploy final
☐ Verificar webhooks en producción
```

---

## 🛠️ CHECKLIST DETALLADO DE CAMBIOS

### PASO 1: Backend - application.yml

```
Archivo: apps/order-service/src/main/resources/application.yml

❌ Actual:
   payment:
     stripe:
       secret-key: ${sk_test_51TWuTWRUi90V6BGx8k...}
       webhook-secret: ${whsec_TEwjNaSydwqDBzCEWq2x...}

✅ Nuevo:
   payment:
     stripe:
       secret-key: ${STRIPE_SECRET_KEY}
       webhook-secret: ${STRIPE_WEBHOOK_SECRET}

Cambios:
☐ Reemplazar líneas 31-33
☐ Verificar no haya hardcodeo
☐ Commit sin cambiar .env
```

### PASO 2: Backend - StripeService.java

```
Archivo: apps/order-service/src/main/java/.../StripeService.java

Cambios:
☐ Agregar validaciones de monto
☐ Documentar que amountInCents = centavos
☐ Agregar logs descriptivos

Líneas a cambiar: 1-25
Complejidad: BAJA
```

### PASO 3: Backend - PaymentController.java

```
Archivo: apps/order-service/src/main/java/.../PaymentController.java

Cambios:
☐ Inyectar OrderRepository
☐ Convertir pesos a centavos (*100)
☐ Guardar PaymentIntentId en orden
☐ Actualizar paymentStatus a "PENDING"

Líneas a cambiar: 1-45
Complejidad: MEDIA
```

### PASO 4: Backend - Modelo Order.java

```
Archivo: apps/order-service/src/main/java/.../Order.java

Agregar campos:
☐ stripePaymentIntentId: String
☐ paymentStatus: String = "PENDING"
☐ paidAt: LocalDateTime
☐ paymentErrorMessage: String

☐ Getters/Setters para cada campo

Complejidad: BAJA
```

### PASO 5: Backend - OrderRepository.java

```
Archivo: apps/order-service/src/main/java/.../OrderRepository.java

Agregar:
☐ Optional<Order> findByStripePaymentIntentId(String paymentIntentId);

Complejidad: MUY BAJA (1 línea)
```

### PASO 6: Backend - StripeWebhookController.java

```
Archivo: apps/order-service/src/main/java/.../StripeWebhookController.java

Cambios:
☐ Inyectar OrderRepository
☐ Buscar orden por PaymentIntentId
☐ Actualizar paymentStatus
☐ Manejar múltiples eventos
☐ Mejorar error handling

Líneas a cambiar: 1-100
Complejidad: ALTA
```

### PASO 7: Backend - CorsConfig.java

```
Archivo: apps/order-service/src/main/java/.../CorsConfig.java

Cambios:
☐ Cambiar config.setAllowedHeaders("*") → whitelist
☐ Cambiar config.setExposedHeaders("*") → whitelist

Headers a permitir:
  - Content-Type
  - Authorization
  - Accept
  - Origin
  
Complejidad: BAJA
```

### PASO 8: Database - SQL Migration

```
Ejecutar en PostgreSQL:

☐ ALTER TABLE orders ADD COLUMN stripe_payment_intent_id
☐ ALTER TABLE orders ADD COLUMN payment_status
☐ ALTER TABLE orders ADD COLUMN paid_at
☐ ALTER TABLE orders ADD COLUMN payment_error_message
☐ CREATE INDEX idx_orders_payment_intent

Complejidad: BAJA
```

### PASO 9: Frontend - CheckoutForm.tsx

```
Archivo: apps/web/app/payment/CheckoutForm.tsx

Cambios:
☐ Agregar error state management
☐ Agregar message state management
☐ Implementar error handling específico
☐ Agregar botón "Reintentar"
☐ Mejorar UX con loading states

Líneas a cambiar: 1-120
Complejidad: MEDIA
```

### PASO 10: Frontend - CheckoutPage.tsx

```
Archivo: apps/web/app/checkout/page.tsx

Cambios:
☐ Incluir orderId en return_url
☐ Verificar orderId existe
☐ Pasar orderId a CheckoutForm

Líneas a cambiar: 10-20
Complejidad: BAJA
```

### PASO 11: Frontend - order-confirmation/page.tsx

```
Archivo: apps/web/app/order-confirmation/page.tsx

Cambios:
☐ Extraer orderId de searchParams
☐ Hacer fetch a backend: /api/orders/{orderId}
☐ Esperar 2 segundos antes de consultar
☐ Mostrar estado basado en paymentStatus
☐ Implementar polling si PENDING

Complejidad: MEDIA
```

### PASO 12: Configuración - Variables ENV

Railway (Backend):
```
☐ STRIPE_SECRET_KEY=sk_live_xxxxx
☐ STRIPE_PUBLIC_KEY=pk_live_xxxxx
☐ STRIPE_WEBHOOK_SECRET=whsec_xxxxx
☐ PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
```

Vercel (Frontend):
```
☐ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
☐ NEXT_PUBLIC_API_URL=https://order-service-prod.up.railway.app
```

---

## 🧪 TESTING POR FASE

### Fase 1: Local (SANDBOX)

```
Prerequisitos:
☐ Stripe CLI instalado
☐ Backend corriendo en 8082
☐ Frontend corriendo en 3000
☐ PostgreSQL corriendo

Tests:
☐ Test 1: Crear PaymentIntent
  - POST /api/payments/create-intent { amount: 50, orderId: 1 }
  - Verificar: clientSecret retornado
  - Verificar: BD guardó paymentIntentId

☐ Test 2: Webhook de éxito
  - Ejecutar: stripe trigger payment_intent.succeeded
  - Verificar: BD actualizó paymentStatus = "SUCCEEDED"

☐ Test 3: E2E Frontend a Backend
  - Navegar a /checkout
  - Ingresar card: 4242 4242 4242 4242
  - Click Pagar
  - Verificar: Redirección a /order-confirmation
  - Verificar: BD muestra pago confirmado

☐ Test 4: Error Handling
  - Ingresar card: 4000 0000 0000 0002 (rechazada)
  - Verificar: Error message mostrado
  - Verificar: Botón "Reintentar" disponible
```

### Fase 2: Staging (Vercel + Railway)

```
Deploy:
☐ Build Backend: mvn clean package -DskipTests
☐ Build Frontend: pnpm build
☐ Deploy Railway: git push
☐ Deploy Vercel: vercel deploy

Tests:
☐ Test webhook endpoint: curl -X POST https://order-service-prod.../api/payments/webhooks/stripe
☐ CORS test: desde https://fishwish-web-prod.vercel.app
☐ E2E test: realizar pago real (usar tarjeta test)
☐ Verificar logs en Railway y Vercel
```

### Fase 3: Producción (Después de changeover LIVE)

```
Pre-go-live:
☐ Cambiar a credenciales LIVE en Stripe
☐ Registrar webhook en Stripe Dashboard LIVE
☐ Prueba pago real con $1 MXN
☐ Verificar webhook llega
☐ Verificar BD se actualiza

Post-go-live:
☐ Monitoreo por 1 hora (buscar errores)
☐ Verificar 10 transacciones exitosas
☐ Revisar logs de webhook
☐ Estar atento a reportes de clientes
```

---

## 📞 RECURSOS DE AYUDA

### Si se atasca en...

| Problema | Referencia |
|---|---|
| **Conversión centavos** | CAMBIOS_CODIGO → Sección 3 |
| **Guardado PaymentIntentId** | CAMBIOS_CODIGO → Sección 3 |
| **Webhook no actualiza** | CAMBIOS_CODIGO → Sección 5 |
| **Error handling frontend** | CAMBIOS_CODIGO → Sección 9 |
| **Variables ENV Railway** | CAMBIOS_CODIGO → Sección 12 |
| **Testing Stripe CLI** | AUDITORIA → Problema 4 |
| **CORS whitelist** | CAMBIOS_CODIGO → Sección 7 |

---

## ✅ CHECKLIST PRE-DEPLOY FINAL

```
ANTES DE HACER DEPLOY:

Credenciales:
☐ Cambiar TODAS las claves Stripe (las actuales están públicas)
☐ Revocar claves test antiguas
☐ Generar nuevas claves LIVE
☐ Guardar en 1Password o vault (no en código)

Backend:
☐ Todos los archivos Java actualizados
☐ Migraciones SQL ejecutadas en BD
☐ Tests locales pasados
☐ Build sin errores: mvn clean package -DskipTests
☐ No hay logging de secrets

Frontend:
☐ CheckoutForm.tsx actualizado
☐ Error handling completo
☐ order-confirmation con polling
☐ Build sin errores: pnpm build
☐ Variables ENV en Vercel

Railway:
☐ Variables ENV configuradas
☐ Dockerfile sin cambios (ya está bien)
☐ Health check OK

Stripe Dashboard:
☐ Webhook endpoint registrado (LIVE)
☐ Events seleccionados: payment_intent.succeeded, payment_intent.payment_failed
☐ Signing secret copiado y guardado

Testing:
☐ Prueba SANDBOX completada
☐ Prueba E2E local OK
☐ Prueba staging (Railway + Vercel) OK
☐ Verificación CORS desde Vercel OK

Documentación:
☐ Archivos de auditoría guardados
☐ Contraseña de Stripe vault actualizada
☐ Runbook de incidents creado
☐ Contacto de soporte Stripe guardado
```

---

## 🚀 COMANDO RÁPIDO PARA DEPLOY

Una vez que todos los cambios están listos:

```bash
# 1. Backend
cd apps/order-service
mvn clean package -DskipTests -Dspring.profiles.active=prod
# Verificar: target/*.jar creado sin errores

# 2. Frontend
cd apps/web
pnpm build
# Verificar: .next creado sin errores

# 3. Commit (sin secretos)
git add .
git commit -m "fix: PCI-DSS compliance for Stripe integration"
git push origin main

# 4. Railway automatically deploys after push
# Monitor: Railway dashboard

# 5. Vercel automatically deploys after push
# Monitor: Vercel dashboard

# 6. Verify webhooks
# Test: Stripe Dashboard → Webhooks → Seleccionar endpoint → Send test webhook
```

---

## 🎓 PRÓXIMOS PASOS

### Inmediatamente (Hoy):

1. ✅ Leer AUDITORIA_PREDEPLOYMENT_STRIPE.md (este documento)
2. ✅ Cambiar API keys Stripe (URGENTE - están comprometidas)
3. ✅ Crear .env.local con nuevas credenciales
4. ✅ Comenzar implementación de cambios

### Mañana:

5. Completar cambios backend (Pasos 1-8)
6. Completar cambios frontend (Pasos 9-11)
7. Testing local exhaustivo

### Próximo Día:

8. Deploy a Railway + Vercel (staging)
9. Testing en staging
10. Verificación final antes de LIVE

---

## 📋 SOPORTE

**Preguntas sobre:**
- Auditoría → AUDITORIA_PREDEPLOYMENT_STRIPE.md
- Código → CAMBIOS_CODIGO_PREDEPLOYMENT.md
- Plan → Este documento (RESUMEN_Y_PLAN.md)
- Arquitectura → ANALISIS_ARQUITECTONICO_PASARELAS_PAGO.md

---

**Auditoría Completada:** 14 Mayo 2026  
**Arquitecto:** Senior PCI-DSS Specialist  
**Veredicto:** ❌ NO APTO - Requiere correcciones inmediatas
