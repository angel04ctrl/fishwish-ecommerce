# 🚀 GUÍA DE EJECUCIÓN, TESTING Y DEPLOYMENT
## Stripe + Mercado Pago Integration - Fishwish E-Commerce

---

## 1️⃣ INICIALIZACIÓN Y SETUP LOCAL

### 1.1 Preparar Ambiente de Desarrollo

```bash
# 1. Clonar repositorio (si aplica)
cd ~/projects
git clone <repo-url> fishwish-ecommerce
cd fishwish-ecommerce

# 2. Crear variables de entorno
cat > .env.local << 'EOF'
# Database
PGHOST=localhost
PGPORT=5432
PGDATABASE=fishwish_db
PGUSER=postgres
PGPASSWORD=yourpassword123

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET

# Mercado Pago (Sandbox)
MERCADOPAGO_ACCESS_TOKEN=APP_USR_TEST-YOUR_ACTUAL_TOKEN
MERCADOPAGO_PUBLIC_KEY=APP_USR_TEST-YOUR_ACTUAL_PUBLIC_KEY
MERCADOPAGO_WEBHOOK_TOKEN=your_custom_webhook_token_12345

# Services
PRODUCT_SERVICE_URL=http://localhost:8081/api/products
MERCADOPAGO_NOTIFICATION_URL=http://localhost:8082/api/webhooks/mercadopago
MERCADOPAGO_RETURN_URL=http://localhost:3000/order-confirmation

# Application
SPRING_PROFILES_ACTIVE=dev
EOF

# 3. Crear archivo .env.local en apps/web/
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_PRODUCT_API_URL=http://localhost:8081
NEXT_PUBLIC_ORDER_API_URL=http://localhost:8082
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR_TEST-YOUR_ACTUAL_PUBLIC_KEY
NEXT_PUBLIC_ENV=development
EOF

# 4. Instalar dependencias
pnpm install

# 5. Verificar estructura
tree -L 2 apps/
```

### 1.2 Configurar Base de Datos PostgreSQL

```bash
# 1. Asegurarse que PostgreSQL está corriendo
# En Windows (si usas WSL):
sudo service postgresql start

# En Mac (Homebrew):
brew services start postgresql@15

# 2. Crear BD y usuario
psql -U postgres
# En consola psql:

CREATE DATABASE fishwish_db;
CREATE USER fishwish_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fishwish_db TO fishwish_user;
\c fishwish_db
GRANT ALL ON SCHEMA public TO fishwish_user;
\q

# 3. Verificar conexión
psql -h localhost -U fishwish_user -d fishwish_db -c "SELECT 1;"
# Resultado: debe retornar "1" si conexión es exitosa
```

### 1.3 Iniciar Servicios Backend

```bash
# Terminal 1: Product Service
cd apps/product-service
mvn clean install
mvn spring-boot:run

# Verificar: http://localhost:8081/api/products
# Resultado esperado: [] (array vacío, sin datos aún)

# Terminal 2: Order Service
cd apps/order-service
mvn clean install
mvn spring-boot:run

# Verificar: http://localhost:8082/api/orders
# Resultado esperado: [] (array vacío)
```

### 1.4 Iniciar Frontend

```bash
# Terminal 3: Frontend
cd apps/web
pnpm dev

# Abrir navegador: http://localhost:3000
# Verificar: Página inicio carga sin errores de conexión
```

### 1.5 Validar Setup Completo

```bash
# Checklist:
✓ PostgreSQL conectada
✓ Product Service corriendo en 8081
✓ Order Service corriendo en 8082
✓ Frontend corriendo en 3000
✓ Variables ENV cargadas correctamente

# Test rápido:
curl -X GET http://localhost:8081/api/products
# Debe retornar: []

curl -X GET http://localhost:8082/api/orders
# Debe retornar: []

curl -X GET http://localhost:3000
# Debe retornar HTML de página
```

---

## 2️⃣ TESTING EN MODO SANDBOX (No Real Money)

### 2.1 Configurar Webhooks Locales con Stripe CLI

```bash
# 1. Descargar Stripe CLI
# Windows (PowerShell):
choco install stripe-cli

# Mac:
brew install stripe/stripe-cli/stripe

# Linux:
curl https://files.stripe.com/stripe-cli/install.sh -O
bash install.sh

# 2. Autenticarse
stripe login
# Abre navegador para autenticarse
# Seleccionar cuenta de prueba

# 3. Forwarding de webhooks locales
stripe listen --forward-to localhost:8082/api/webhooks/stripe

# Resultado esperado:
# Ready! Your webhook signing secret is: whsec_test_1234567890...
# ⚠️ IMPORTANTE: Copiar este secreto a .env.local STRIPE_WEBHOOK_SECRET

# 4. En otra terminal, trigger webhooks de prueba
stripe trigger payment_intent.succeeded

# El webhook debe llegar a tu orden-service y procesar
```

### 2.2 Testing Stripe Payment Flow

```bash
# 1. Obtener test cards en:
# https://stripe.com/docs/testing#international-cards

Test Cards:
├─ Sucesoso: 4242 4242 4242 4242
├─ Falso: 4000 0000 0000 0002
├─ Requiere auth: 4000 0025 0000 3155
├─ Expiración: 12/25 (cualquier mes/año futuro)
├─ CVC: 123 (cualquier 3 dígitos)

# 2. En navegador, ir a http://localhost:3000
# 3. Agregar productos al carrito
# 4. Ir a checkout
# 5. Elegir "Pagar con Stripe"
# 6. Ingresar tarjeta de prueba: 4242 4242 4242 4242
# 7. Completar otros datos (nombre, email, etc.)
# 8. Click "Pagar"

# 9. Verificar en logs:
# - order-service debe loguear: "PaymentIntent creado: pi_xxx"
# - Frontend debe mostrar: "Pago procesado exitosamente"
# - BD debe tener registro en tabla orders con status PAGADO

# 10. En terminal Stripe CLI:
# Debe aparecer log: "payment_intent.succeeded"
```

### 2.3 Testing Mercado Pago Flow

```bash
# 1. Obtener test credentials:
# Dashboard MP: https://www.mercadopago.com/developers/panel/apps
# Usar "Credentials" sección
# Copy: Access Token, Public Key (SANDBOX)

# 2. En navegador, http://localhost:3000
# 3. Agregar productos
# 4. Checkout → "Pagar con Mercado Pago"
# 5. Click "Pagar con MP"

# Resultado: Redirige a página MP (test mode)

# 6. Rellenar formulario MP:
Email: TESTUSER123456789@testuser.com
Cédula: 12345678
Nombre: Test User

# 7. Seleccionar método pago: "Tarjeta de Crédito"
# 8. Ingresar card test:
Card: 4111 1111 1111 1111
Mes/Año: 11/25
CVC: 123

# 9. Submit → Debe procesar

# 10. Redirige de vuelta a http://localhost:3000/order-confirmation
# 11. Verificar BD: order con status PAGADO

# 12. Testing IPN webhook:
# Usar Postman para simular IPN:
POST http://localhost:8082/api/webhooks/mercadopago
Headers:
  Content-Type: application/json
  Authorization: Bearer your_webhook_token
Body:
{
  "id": "123456789",
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "12345678901"
  }
}

# Backend debe procesar sin errores
```

### 2.4 Scenario Testing Completo

```
ESCENARIO 1: Compra Exitosa con Stripe
├─ Iniciar en home
├─ Añadir 2 productos al carrito
├─ Ver carrito (verificar totales)
├─ Click Checkout
├─ Rellenar datos envío
├─ Seleccionar "Stripe"
├─ Ingresar 4242 4242 4242 4242 (exitoso)
├─ Click Pagar
├─ Esperar 2-3 segundos (webhook llega)
├─ ✓ Redirige a order-confirmation
├─ ✓ Email confirmación enviado
└─ ✓ BD: order status = PAGADO

ESCENARIO 2: Compra con Fallo en Stripe
├─ Repetir hasta "Click Pagar"
├─ Ingresar 4000 0000 0000 0002 (fallo)
├─ Click Pagar
├─ ✓ Muestra error: "Card declined"
├─ Usuario puede reintentar
└─ ✓ BD: order status = FAILED, payment_attempts = 1

ESCENARIO 3: Compra con Mercado Pago (Exitosa)
├─ Carrito con productos
├─ Click Checkout
├─ Rellenar datos envío
├─ Seleccionar "Mercado Pago"
├─ Click "Pagar con MP"
├─ Redirige a sitio MP
├─ Rellenar formulario MP (test mode)
├─ Submit pago
├─ Redirige de vuelta a order-confirmation
├─ ✓ Orden confirmada
└─ ✓ Stock decrementado

ESCENARIO 4: Usuario Cancela Pago
├─ En pantalla Stripe/MP
├─ Click "Cancelar" o cerrar navegador
├─ ✓ Orden queda con status PENDING_PAYMENT
├─ Usuario puede intentar de nuevo
└─ ✓ Stock NO se decrementa (aún)

ESCENARIO 5: Webhook Tardío / Duplicado
├─ Completar pago
├─ Antes de que webhook llegue: Cerrar app
├─ Reiniciar app
├─ Webhook llega después (retry Stripe)
├─ ✓ Detecta por externalEventId → idempotencia
├─ ✓ No duplica status update
└─ ✓ Solo 1 confirmación email
```

---

## 3️⃣ VALIDACIÓN DE SEGURIDAD (Pre-Producción)

### 3.1 Checklist OWASP Top 10

```
1️⃣ INJECTION (SQL, Command, LDAP)
   ✓ Usar JpaRepository (previene SQL injection)
   ✓ Usar @PathVariable en controladoras (no concatenación)
   ✓ Validar inputs con @Valid + annotations
   Test: Intentar " OR 1=1 --" en campos buscar
   Resultado esperado: Error sin revelar SQL

2️⃣ BROKEN AUTHENTICATION
   ✓ JWT tokens si requiere login (no en alcance actual)
   ✓ HTTPS obligatorio (no HTTP)
   ✓ No guardar passwords en plaintext (no aplica, pero recordar)
   Test: Intentar acceder /api/payments/xxx sin HTTPS
   Resultado esperado: 403 o redirect HTTPS

3️⃣ SENSITIVE DATA EXPOSURE
   ✓ NUNCA loguear tarjetas, CVV, SSN
   ✓ Encriptar en tránsito (HTTPS)
   ✓ Encriptar en reposo (si aplica)
   Test: Revisar logs (tail order-service.log)
   Resultado esperado: Sin números tarjeta

4️⃣ BROKEN ACCESS CONTROL
   ✓ Usuario A no puede ver orden de Usuario B
   ✓ Solo propietario orden puede confirmar pago
   Test: GET /api/orders/999 (orden ajena)
   Resultado esperado: 403 Forbidden

5️⃣ BROKEN OBJECT REFERENCE (BFLAC)
   ✓ Cambiar cantidad order en formulario
   ✓ Backend debe recalcular (no confiar cliente)
   Test: Modificar JavaScript: cartStore.items[0].price = 0.01
   Ir a checkout, submit
   Resultado esperado: Backend rechaza, precio original
   
6️⃣ CSRF - CROSS SITE REQUEST FORGERY
   ✓ CORS configurado (no * en production)
   ✓ SameSite cookie flags
   ✓ CSRF tokens en formularios (si aplica)
   Test: Formulario desde otro dominio
   Resultado esperado: CORS block

7️⃣ XSS - CROSS SITE SCRIPTING
   ✓ Sanitizar inputs del usuario
   ✓ React automáticamente escapa JSX
   ✓ CSP headers activos
   Test: Ingresar <script>alert('xss')</script> en nombre
   Resultado esperado: Se guarda como string literal, no ejecuta

8️⃣ INSECURE DESERIALIZATION
   ✓ Usar JSON schema validation (zod, @Valid)
   ✓ No deserializar clases arbitrarias
   Test: POST /api/orders con JSON malformado
   Resultado esperado: 400 Bad Request

9️⃣ USING COMPONENTS WITH KNOWN VULNERABILITIES
   ✓ Ejecutar: npm audit
   ✓ mvn dependency-check (backend)
   Resultado esperado: Sin vulnerabilidades críticas

🔟 INSUFFICIENT LOGGING & MONITORING
   ✓ Loguear eventos críticos (pago, webhook)
   ✓ Alertas para anomalías
   ✓ Logs no contienen datos sensibles
   Test: Revisar logs después de transacción
   Resultado esperado: "OrderId 123 payment SUCCEEDED" (sin $)
```

### 3.2 Tests de Carga & Performance

```bash
# 1. Instalar herramienta de carga (Apache JMeter o Artillery)
npm install -g artillery

# 2. Crear test plan
cat > load-test.yml << 'EOF'
config:
  target: "http://localhost:8082"
  phases:
    - duration: 30
      arrivalRate: 10
      name: "Warm up"
    - duration: 60
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Stress"
scenarios:
  - name: "Payment Flow"
    flow:
      - get:
          url: "/api/orders"
      - post:
          url: "/api/payments/stripe/intent"
          json:
            orderId: 1
            amount: 100
EOF

# 3. Ejecutar
artillery run load-test.yml

# Resultado esperado:
# - Latency p95 < 500ms
# - Error rate < 1%
# - Throughput: >50 req/sec
```

### 3.3 Test de Validación de Firmas Webhook

```bash
# 1. Crear script de validación
cat > test-webhook-signature.js << 'EOF'
const crypto = require('crypto');

const payload = JSON.stringify({ test: "data" });
const secret = "whsec_test_your_secret";

// Crear signature como lo hace Stripe
const timestamp = Math.floor(Date.now() / 1000);
const signedContent = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', secret)
  .update(signedContent)
  .digest('hex');

const header = `t=${timestamp},v1=${signature}`;

console.log("Signature header:", header);
console.log("Payload:", payload);
EOF

# 2. Ejecutar
node test-webhook-signature.js

# 3. Hacer POST a /api/webhooks/stripe con header
curl -X POST http://localhost:8082/api/webhooks/stripe \
  -H "stripe-signature: $SIGNATURE_HEADER" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# Resultado esperado:
# - Si firma válida: 200 OK
# - Si firma inválida: 401 Unauthorized
```

---

## 4️⃣ DEPLOYMENT A PRODUCCIÓN

### 4.1 Pre-Deploy Checklist

```
CREDENCIALES:
☐ Obtener claves LIVE de Stripe Dashboard
☐ Obtener claves LIVE de Mercado Pago
☐ Generar nuevos webhook secrets (LIVE)
☐ Guardar en AWS Secrets Manager (o similar)
☐ NO commitear a git

CERTIFICADOS:
☐ Certificado SSL válido para dominio
☐ Verificar expiración (configurar auto-renew con Let's Encrypt)
☐ HTTPS forzado en todos /api/payments/*

CONFIGURACIÓN:
☐ application-prod.yml configurado
☐ CORS: Solo dominios permitidos (no *)
☐ Rate limiting activo
☐ Logs enviados a archivo/Cloud (no stdout)

BASE DE DATOS:
☐ Backup completo hecho
☐ Migraciones aplicadas (Flyway/Liquibase)
☐ Índices creados (payment_events, payment_attempts)
☐ Connection pool optimizado para carga

MONITOREO:
☐ Alertas configuradas (fallos webhook, alta latencia)
☐ Dashboard de métricas (Prometheus/Grafana)
☐ Logs centralizados (ELK, Splunk, etc.)
☐ Runbook para incidents disponible

PRUEBAS:
☐ Full regression testing en SANDBOX
☐ Performance testing (carga esperada + 50%)
☐ Security audit (penetration testing)
☐ Disaster recovery plan

CUMPLIMIENTO:
☐ PCI-DSS Self-Assessment completo
☐ Documentación de compliance
☐ Privacy policy actualizada
☐ Términos de servicio mencionan Stripe/MP
```

### 4.2 Pasos de Deployment

```bash
# 1. Build backend
cd apps/order-service
mvn clean package -DskipTests -Dspring.profiles.active=prod

# Generar JAR en: target/order-service-0.0.1-SNAPSHOT.jar

# 2. Build frontend
cd apps/web
pnpm build

# Generar build estático en: .next

# 3. Dockerizar (opcional pero recomendado)
# En order-service: Usar Dockerfile existente
docker build -t fishwish/order-service:prod .
docker tag fishwish/order-service:prod fishwish/order-service:latest

# 4. Push a registry
docker push fishwish/order-service:prod

# 5. Deploy order-service a servidor
# Opción A: Docker container en AWS ECS/EKS
aws ecs update-service --cluster fishwish --service order-service --force-new-deployment

# Opción B: JAR directo en servidor
scp target/order-service-0.0.1-SNAPSHOT.jar user@prod-server:/app/
ssh user@prod-server
  systemctl restart order-service

# 6. Deploy frontend
# Opción A: Vercel
vercel deploy --prod --scope fishwish

# Opción B: AWS S3 + CloudFront
aws s3 sync apps/web/.next s3://fishwish-web-prod/.next

# 7. Verificar deployments
curl https://api.fishwish.com/api/orders  # Backend
curl https://fishwish.com                  # Frontend

# 8. Fumar testing (smoke tests)
npm run test:e2e:prod

# 9. Monitoreo post-deploy
tail -f /var/log/order-service/order-service.log
# Buscar: "Order Service iniciado" + "Payment config loaded"
```

### 4.3 Cambiar de SANDBOX a LIVE (Stripe)

```bash
# PASO CRÍTICO: Cambiar keys de test a live

# 1. En AWS Secrets Manager (o tu vault):
# Actualizar:
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx (cambiar de sk_test_)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx (cambiar de pk_test_)
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx (cambiar de whsec_test_)

# 2. En application-prod.yml: Actualizar payment.stripe.api-version si hay cambios
# (Stripe usa versionado de API)

# 3. Re-deploy order-service
mvn package -DskipTypes -Dspring.profiles.active=prod
docker build -t fishwish/order-service:prod .
docker push ...

# 4. Registrar webhook endpoint en Stripe Dashboard LIVE
# Stripe Dashboard → Webhooks → Add an endpoint
# Endpoint URL: https://api.fishwish.com/api/webhooks/stripe
# Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
# Copiar: Signing secret → actualizar STRIPE_WEBHOOK_SECRET

# 5. Verificar conexión
curl -X POST https://api.fishwish.com/api/webhooks/stripe \
  -H "stripe-signature: fake_signature" \
  -d "test"

# Resultado esperado:
# 401 Unauthorized (firma inválida, pero endpoint responde)

# 6. Stripe Dashboard: Enviar test event
# Webhooks → Seleccionar endpoint → Send test webhook
# Debe recibir en servidor

# 7. Prueba con tarjeta real
# ⚠️ CUIDADO: Esto cobra real money
# Usar tarjeta de prueba LIVE (requiere solicitar a Stripe)
# O usar tarjeta personal con monto $1 (reembolsable)
```

### 4.4 Cambiar de SANDBOX a LIVE (Mercado Pago)

```bash
# 1. Obtener credenciales LIVE en MP Dashboard
# https://www.mercadopago.com/developers/panel/apps
# Generar nuevas credentials (LIVE, no sandbox)

# 2. Actualizar secretos:
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx (cambiar de APP_USR_TEST-)
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx (cambiar de APP_USR_TEST-)

# 3. En MP Dashboard:
# Webhooks → Agregar endpoint
# URL: https://api.fishwish.com/api/webhooks/mercadopago
# Events: payment.updated, merchant_order.updated

# 4. Re-deploy frontend
# En apps/web/.env:
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx (no test)

# 5. Prueba con tarjeta
# Usar tarjeta test MP que funciona con producción:
# Tarjeta: 5031 7557 3453 5995
# Mes/Año: 11/25
# CVC: 123

# O usar tarjeta personal (real)
```

---

## 5️⃣ MONITOREO Y MANTENIMIENTO POST-DEPLOY

### 5.1 Métricas Clave a Monitorear

```
TRANSACCIONES:
├─ Total órdenes/día (trend)
├─ Monto total vendido/día
├─ Tasa éxito pago (expected: >95%)
├─ Tasa rechazo pago (expected: <5%)
├─ Tiempo promedio procesamiento pago (expected: <2s)

ERRORES:
├─ Webhook failures (alert si >5 en 10 min)
├─ Payment timeouts (alert si >3 en 10 min)
├─ DB connection errors
├─ API response errors (5xx)

INFRAESTRUCTURA:
├─ CPU orden-service (alert si >80%)
├─ Memory uso (alert si >85%)
├─ DB connection pool (alert si >90%)
├─ Disk space (alert si <10% libre)

SEGURIDAD:
├─ Intentos fallidos webhook (posible ataque)
├─ Rate limit violations
├─ Accesos no autorizados (403 anormales)
└─ Cambios en webhooks/configuración
```

### 5.2 Dashboard Prometheus Queries

```prometheus
# Tasa éxito pago Stripe
100 * (stripe_payment_succeeded_total / stripe_payment_attempts_total)

# Latencia promedio pago
histogram_quantile(0.95, stripe_payment_duration_seconds)

# Errores webhook últimas 10 minutos
increase(webhook_errors_total[10m])

# Conexiones DB activas
pg_stat_activity_count{state="active"}
```

### 5.3 Alertas Recomendadas

```yaml
# prometheus/rules.yml
groups:
  - name: payment-alerts
    rules:
      - alert: HighPaymentFailureRate
        expr: |
          (stripe_payment_failed_total / stripe_payment_attempts_total) > 0.05
        for: 10m
        annotations:
          summary: "Alta tasa de fallos en pagos Stripe"
          
      - alert: WebhookProcessingError
        expr: increase(webhook_errors_total[5m]) > 5
        annotations:
          summary: "Múltiples errores procesando webhooks"
          
      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 19  # Si max_connections=20
        annotations:
          summary: "Pool de conexiones DB casi lleno"
```

### 5.4 Runbook para Incidents

```markdown
# INCIDENT: Payment Gateway Down

## SÍNTOMAS:
- Alta tasa de errores pago (>50%)
- Webhooks no llegan
- Clientes reportan "puede't complete purchase"

## DIAGNOSIS (5 min):
1. Verificar status Stripe: https://status.stripe.com
2. Verificar status MP: https://status.mercadopago.com
3. Check logs: grep -i error order-service.log | tail -20
4. Verificar conectividad: curl https://api.stripe.com (debe 200)

## MITIGACIÓN (10 min):
1. Si is down en Stripe:
   - Informar a clientes: "Pagos temporalmente no disponibles"
   - Switch a MP solo (si está up)
   - Crear ticket en Stripe support

2. Si es problema DB:
   - Reiniciar connection pool: docker restart order-service
   - Verificar: docker logs order-service

3. Si es problema webhooks:
   - Verificar endpoint registrado: Stripe/MP Dashboard
   - Revisar firewall rules
   - Test webhook manual: curl + stripe-signature

## RECOVERY (15-30 min):
1. Cuando gateway está up:
   - Test pago: Usar card test, verify success
   - Verificar webhooks: trigger manual en dashboard
   - Monitor error rate: debe volver a <1%

2. Post-incident:
   - Root cause analysis
   - Update runbook
   - Schedule postmortem
```

### 5.5 Auditoría Seguridad Periódica

```bash
# Ejecutar MENSUALMENTE:

# 1. Revisar logs de pago
SELECT * FROM payment_events WHERE status = 'FAILED' AND created_at > now() - interval '30 days'

# 2. Verificar integridad datos
SELECT COUNT(*) FROM orders WHERE total_amount <> (SELECT SUM(unit_price * quantity) FROM order_items WHERE order_id = orders.id)

# 3. Revisar webhooks no procesados
SELECT * FROM payment_events WHERE status = 'RECEIVED' AND created_at < now() - interval '1 hour'

# 4. Ejecutar npm audit
cd apps/web
npm audit

cd apps/order-service
mvn dependency-check:check

# 5. Revisar acceso BD
SELECT * FROM pg_stat_statements WHERE calls > 1000 ORDER BY mean_time DESC LIMIT 10

# 6. Certificado SSL
openssl s_client -connect api.fishwish.com:443 | grep "Not After"
```

---

## 6️⃣ TROUBLESHOOTING COMÚN

### Problema: "Webhook nunca llega"

```
CAUSAS POSIBLES:
1. Endpoint no registrado correctamente en dashboard
2. Firewall bloquea webhook
3. URL tiene typo
4. Backend no está corriendo

SOLUCIÓN:
- Ir a Stripe/MP Dashboard → Webhooks
- Verificar URL: debe ser HTTPS completo
- Enviar test webhook desde dashboard
- Revisar logs: tail -f order-service.log | grep webhook
- Verificar CORS: está /api/webhooks/stripe permitido?
```

### Problema: "Signature validation fails"

```
CAUSAS:
1. Secret key incorrecta (test vs live)
2. Payload modificado antes de validar
3. Encoding issue (binary vs string)

SOLUCIÓN:
- Copiar secret de dashboard (copy button)
- Verificar en .env.local: STRIPE_WEBHOOK_SECRET=whsec_...
- No parsear JSON antes de validar firma
- Usar webhook testing tool: stripe listen
```

### Problema: "Payment timeout (30s)"

```
CAUSAS:
1. Stripe/MP API lento
2. Conexión internet lenta
3. Timeout configurado muy bajo

SOLUCIÓN:
- Aumentar timeout en application.yml: stripe.timeout-ms: 60000
- Implementar retry logic (exponential backoff)
- Verificar latencia: ping api.stripe.com
- Monitorear: Top P95 latency < 2s
```

### Problema: "Order creada pero status no actualiza después pago"

```
CAUSAS:
1. Webhook no procesa
2. paymentIntentId no coincide
3. Tabla payment_events llena → intento falla

SOLUCIÓN:
- SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 1
- Verificar externalEventId existe
- Si stuck: UPDATE payment_events SET status = 'RECEIVED' WHERE status = 'PROCESSING' AND created_at < now() - interval '5 minutes'
- Retry: Manualmente disparar webhook desde dashboard
- Verificar logs: grep paymentIntentId order-service.log
```

---

## 7️⃣ ESCALABILIDAD FUTURA

```
CUANDO CREZCA A:

100 órdenes/día:
- Setup actual es suficiente
- Monitorear DB queries

1000 órdenes/día:
- Implementar Redis para cache órdenes
- Adicionar réplica DB (read-only)
- Usar message queue (RabbitMQ) para webhooks async

10,000 órdenes/día:
- Sharding BD por región
- Load balancer múltiples instances order-service
- CDN para frontend
- Memcached para sesiones

100,000+ órdenes/día:
- Event sourcing (Event Store)
- CQRS pattern (Command Query Responsibility Segregation)
- Microservices por dominio (Payment Service separado)
- Kubernetes orquestación
```

---

**Documento Preparado Por:** Arquitecto Senior - Seguridad PCI-DSS
**Versión:** 1.0 - Mayo 2026
