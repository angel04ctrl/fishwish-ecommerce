# 🏗️ ANÁLISIS ARQUITECTÓNICO Y GUÍA DE IMPLEMENTACIÓN
## Integración Segura de Stripe y Mercado Pago (PCI-DSS Compliant)

**Documento Clasificado:** Arquitectónica Crítica  
**Fecha:** Mayo 2026  
**Responsable:** Arquitecto Senior - Seguridad PCI-DSS  
**Stack Actual:** Java 21 + Spring Boot 3.3.4 | Next.js 16.2 + React 19 | PostgreSQL | Microservicios

---

## 📊 PARTE 1: MAPEO VISUAL Y ANÁLISIS DEL PROYECTO

### 1.1 Estructura Completa de Directorios

```
fishwish-ecommerce (Monorepo pnpm + Turbo)
│
├── 📦 RAÍZ (Configuración Global)
│   ├── package.json ..................... Definición del workspace pnpm
│   ├── pnpm-lock.yaml ................... Lock file de dependencias
│   ├── pnpm-workspace.yaml .............. Configuración monorepo
│   ├── turbo.json ....................... Orquestación de build (cache, parallelización)
│   └── CONFIGURACION_PRODUCCION.md ..... Instrucciones de deploy
│
├── 📁 apps/ ............................ Aplicaciones principales
│   │
│   ├── 🔵 order-service/ ................ MICROSERVICIO CRÍTICO (Port: 8082)
│   │   ├── pom.xml
│   │   │   ├── Spring Boot 3.3.4
│   │   │   ├── Spring Cloud OpenFeign (comunicación inter-servicios)
│   │   │   ├── Spring Data JPA (ORM)
│   │   │   └── PostgreSQL Driver
│   │   │
│   │   ├── Dockerfile ................. Containerización para producción
│   │   │
│   │   └── src/main/java/com/fishwish/order/
│   │       ├── 🎯 OrderApplication.java
│   │       │   └── @SpringBootApplication + @EnableFeignClients
│   │       │       RESPONSABILIDAD: Punto de entrada, activa escaneo de clientes HTTP
│   │       │
│   │       ├── 🛣️ controller/OrderController.java
│   │       │   ├── POST /api/orders .......... Recibe orden completa con ítems
│   │       │   └── GET /api/orders .......... Obtiene todas las órdenes
│   │       │   RESPONSABILIDAD: Punto de entrada HTTP, valida y delega a servicio
│   │       │
│   │       ├── ⚙️ service/OrderService.java
│   │       │   ├── createOrder(Order) ....... Orquesta validación y persistencia
│   │       │   ├── validateOrderItem() ..... Verifica producto existencia/stock
│   │       │   ├── calculateTotalAndPrepareItems() ... Cálculo de totales
│   │       │   └── updateStockForOrderItems() ...... Descuenta stock en product-service
│   │       │   RESPONSABILIDAD: Lógica de negocio compleja (transaccional @Transactional)
│   │       │
│   │       ├── 🗄️ model/Order.java
│   │       │   ├── id: Long (PK)
│   │       │   ├── customerName, address, city, phone
│   │       │   ├── items: List<OrderItem> (OneToMany cascade)
│   │       │   ├── totalAmount: Double
│   │       │   ├── status: String ["PENDIENTE", "PAGADO", "CANCELADO"]
│   │       │   └── orderDate: LocalDateTime
│   │       │   RESPONSABILIDAD: Entidad JPA persistida en BD
│   │       │
│   │       ├── 🗄️ model/OrderItem.java
│   │       │   ├── productId
│   │       │   ├── productName
│   │       │   ├── quantity
│   │       │   └── presentation
│   │       │   RESPONSABILIDAD: Línea de orden (detalle de producto)
│   │       │
│   │       ├── 💾 repository/OrderRepository.java
│   │       │   └── extends JpaRepository<Order, Long>
│   │       │   RESPONSABILIDAD: Acceso a datos, queries automatizadas
│   │       │
│   │       ├── 🔗 client/ProductServiceClient.java
│   │       │   ├── @FeignClient("product-service")
│   │       │   ├── getProductById(Long): ResponseEntity<ProductDTO>
│   │       │   └── Comunicación HTTP con product-service
│   │       │   RESPONSABILIDAD: Cliente HTTP declarativo hacia otro microservicio
│   │       │
│   │       ├── 📤 dto/ProductDTO.java
│   │       │   ├── id, name, stock, price
│   │       │   └── Mapea respuesta del product-service
│   │       │   RESPONSABILIDAD: Contrato de datos inter-servicios
│   │       │
│   │       ├── ⚙️ config/RestTemplateConfig.java
│   │       │   └── Configuración de cliente HTTP
│   │       │   RESPONSABILIDAD: Inyección de dependencias de conectividad
│   │       │
│   │       ├── ⚙️ config/CorsConfig.java
│   │       │   ├── AllowedOrigins: frontend (3000)
│   │       │   └── AllowedMethods: GET, POST, PUT, DELETE
│   │       │   RESPONSABILIDAD: Previene ataques CSRF, habilita frontend
│   │       │
│   │       └── src/main/resources/application.yml
│   │           ├── server.port: 8082
│   │           ├── datasource.url: ${PGHOST}:${PGPORT}/${PGDATABASE}
│   │           ├── datasource credentials: ${PGUSER}, ${PGPASSWORD} (ENV VARS)
│   │           └── app.product-service.url: ${PRODUCT_SERVICE_URL}
│   │           RESPONSABILIDAD: Externalización de configuración (12-factor)
│   │
│   ├── 🟢 product-service/ ............... MICROSERVICIO SECUNDARIO (Port: 8081)
│   │   ├── pom.xml
│   │   │   ├── Spring Boot 3.3.4
│   │   │   ├── Spring Data JPA
│   │   │   ├── PostgreSQL Driver
│   │   │   └── Lombok (reducir boilerplate)
│   │   │
│   │   ├── Dockerfile .................. Containerización
│   │   │
│   │   └── src/main/java/com/fishwish/product/
│   │       ├── ProductApplication.java
│   │       ├── controller/ProductController.java (GET /api/products/{id})
│   │       ├── model/Product.java (Entidad JPA)
│   │       ├── config/CorsConfig.java
│   │       └── src/main/resources/application.yml
│   │
│   ├── 🔴 web/ .......................... FRONTEND (Port: 3000)
│   │   ├── package.json
│   │   │   ├── next: 16.2.0 (Framework React Meta)
│   │   │   ├── react: 19.2.0 (Biblioteca UI)
│   │   │   ├── zustand: 5.0.12 (Estado global ligero)
│   │   │   ├── tailwindcss: 4.2.2 (Estilos utilidad)
│   │   │   └── sonner: 2.0.7 (Notificaciones toast)
│   │   │
│   │   ├── tsconfig.json ............... Configuración TypeScript strict
│   │   ├── next.config.js .............. Configuración Next.js
│   │   ├── tailwind.config.ts .......... Temas y breakpoints
│   │   │
│   │   └── app/ ........................ App Router (Next.js 13+)
│   │       ├── layout.tsx ............. Layout global
│   │       ├── page.tsx ............... Página inicio (/productos)
│   │       │   ├── 'use client' directive
│   │       │   ├── useState, useEffect (hooks)
│   │       │   ├── fetch(NEXT_PUBLIC_PRODUCT_API_URL/api/products)
│   │       │   ├── mapea a ProductCard para cada producto
│   │       │   ├── Botón "Agregar al carrito" → addToCart(zustand)
│   │       │   └── Muestra modal del carrito
│   │       │   RESPONSABILIDAD: Catálogo de productos interactivo
│   │       │
│   │       ├── lib/cartStore.ts ....... Zustand store
│   │       │   ├── items: CartItem[] (estado global)
│   │       │   ├── addToCart(product)
│   │       │   ├── removeFromCart(id)
│   │       │   ├── increaseQuantity(id)
│   │       │   ├── decreaseQuantity(id)
│   │       │   ├── clearCart()
│   │       │   ├── totalItems(), totalPrice()
│   │       │   └── persist middleware (localStorage)
│   │       │   RESPONSABILIDAD: Gestión de carrito persistente en cliente
│   │       │
│   │       ├── components/ui/CartModal.tsx
│   │       │   └── Muestra productos en carrito con cantidades
│   │       │   RESPONSABILIDAD: Componente UI para revisar carrito
│   │       │
│   │       ├── components/ui/ProductCard.tsx
│   │       │   └── Tarjeta de producto con precio y botón añadir
│   │       │   RESPONSABILIDAD: Componente reutilizable para producto
│   │       │
│   │       ├── checkout/page.tsx ...... Página de compra (/checkout)
│   │       │   ├── 'use client'
│   │       │   ├── Formulario: customerName, address, city, phone
│   │       │   ├── Revisa items del carrito
│   │       │   ├── Muestra totalPrice
│   │       │   ├── POST /api/orders (orden completa)
│   │       │   ├── clearCart() si éxito
│   │       │   └── Redirige a /order-confirmation
│   │       │   RESPONSABILIDAD: Recopila datos cliente y envía orden
│   │       │
│   │       ├── order-confirmation/page.tsx
│   │       │   └── Confirma orden recibida
│   │       │   RESPONSABILIDAD: Feedback positivo al cliente
│   │       │
│   │       ├── cart/page.tsx ......... Carrito detallado
│   │       ├── productos/page.tsx .... Catálogo (mismo que home)
│   │       ├── about/page.tsx
│   │       ├── contacto/page.tsx
│   │       └── impacto/page.tsx
│   │
│   └── 📘 docs/ ........................ Documentación (Next.js)
│       └── Sitio de documentación del proyecto
│
├── 📦 packages/ ....................... Configuración compartida (monorepo)
│   ├── ui/ ........................... Componentes reutilizables
│   │   └── src/button.tsx, card.tsx, code.tsx
│   │
│   ├── eslint-config/ ................ Reglas de linting compartidas
│   │   └── base.js, next.js, react-internal.js
│   │
│   └── typescript-config/ ............ Configuraciones TS compartidas
│       └── base.json, nextjs.json, react-library.json
│
└── 🐳 docker/ ......................... Configuración de contenedores
    └── docker-compose.yml ........... Orquestación local (PostgreSQL, servicios)
```

---

### 1.2 Flujo de Datos Actual: De Usuario a Base de Datos

```
CLIENTE (Navegador)
     ↓
     └─→ GET /productos
         │
         └─→ [Frontend Next.js - page.tsx]
             ├─ Renderiza ProductCard × N
             ├─ useCartStore() (Zustand) → guardar carrito en localStorage
             └─ Botón "Agregar al carrito"
             │
             └─→ Usuario completa carrito
                 │
                 └─→ Navega a /checkout
                     │
                     └─→ [checkout/page.tsx]
                         ├─ Lee itemsdelCart de Zustand
                         ├─ Formulario: nombre, dirección, teléfono
                         ├─ POST /api/orders {customerName, address, city, phone, items: [{productId, quantity}]}
                         │
                         └─→ [Backend Order Service - OrderController]
                             ├─ @PostMapping("/api/orders")
                             │
                             └─→ [OrderService.createOrder()]
                                 ├─ FASE 1: Validación
                                 │   ├─ Para cada OrderItem:
                                 │   │  └─ ProductServiceClient.getProductById(productId)
                                 │   │     (via Feign OpenFeign HTTP call)
                                 │   │     └─→ [Product Service - /api/products/{id}]
                                 │   │         └─ Retorna ProductDTO {id, name, stock, price}
                                 │   │
                                 │   ├─ Verifica: stock >= quantity solicitada
                                 │   └─ Si ✗: Lanza IllegalArgumentException
                                 │
                                 ├─ FASE 2: Si validación ✓
                                 │   ├─ calculateTotalAndPrepareItems()
                                 │   ├─ order.setTotalAmount(total)
                                 │   ├─ order.setStatus("PENDIENTE")
                                 │   └─ orderRepository.save(order) 
                                 │       └─→ [PostgreSQL - tabla "orders"]
                                 │
                                 └─ FASE 3: Actualizar stock
                                     └─ updateStockForOrderItems()
                                         └─→ [Product Service - descuenta stock]

RESULTADO:
✓ Order guardada en BD con status = "PENDIENTE"
✓ Stock decrementado en product-service
✓ Frontend redirige a /order-confirmation
```

---

### 1.3 Responsabilidades por Archivo/Módulo

| Archivo/Módulo | Tipo | Responsabilidad | Puerto | BD |
|---|---|---|---|---|
| **OrderApplication.java** | Punto entrada | Inicializa Spring Boot + activa FeignClients | 8082 | PostgreSQL |
| **OrderController** | HTTP Layer | Expone endpoints REST, valida requests, maneja excepciones | 8082 | - |
| **OrderService** | Business Logic | Orquesta transacciones, coordina validaciones, maneja consistencia | 8082 | - |
| **Order (Entity)** | Domain Model | Estructura orden con cascada a OrderItem | 8082 | orders table |
| **OrderItem** | Domain Model | Detalle de línea de orden | 8082 | order_items table |
| **OrderRepository** | Data Access | Consultas a BD, CRUD operaciones | 8082 | - |
| **ProductServiceClient** | Integration | HTTP Feign client a product-service (discovery automático) | 8082 | - |
| **ProductDTO** | Data Transfer | DTO para respuesta inter-servicios | 8082 | - |
| **CorsConfig** | Infrastructure | Habilita CORS desde frontend (localhost:3000) | 8082 | - |
| **application.yml** | Configuration | Variables entorno, datasource, URLs externas | 8082 | - |
| **ProductController** | HTTP Layer | Expone /api/products/{id}, GET todos | 8081 | - |
| **Product (Entity)** | Domain Model | Estructura producto con stock | 8081 | products table |
| **page.tsx (inicio)** | UI / Client | Renderiza catálogo, integra Zustand carrito | 3000 | - |
| **cartStore.ts** | State Management | Gestión estado carrito (Zustand + localStorage) | 3000 | - |
| **CheckoutPage.tsx** | UI / Client | Recopila datos envío, POST a /api/orders | 3000 | - |

---

## 🔐 PARTE 2: CONSIDERACIONES PCI-DSS ACTUALES

### 2.1 Vulnerabilidades Detectadas (Pre-Pago)

| Riesgo | Severidad | Descripción | Impacto |
|---|---|---|---|
| **Datos de tarjeta en BD** ⚠️ | CRÍTICO | Si guardas # tarjeta en Order.java/BD → Incumplimiento PCI-DSS Level 1 | Multas $100K+, cierre negocio |
| **Credenciales en código** ⚠️ | ALTO | Si hardcodeas API keys en clases Java → Exposición en repositorio | Acceso no autorizado a cuentas Stripe/MP |
| **HTTPS no forzado** ⚠️ | ALTO | request/response sin SSL → Man-in-the-middle attack | Interceptación de datos cliente |
| **CORS demasiado permisivo** | MEDIO | Si permites todos los orígenes (*) → CSRF posible | Ataques desde sitios maliciosos |
| **Logs de datos sensibles** ⚠️ | ALTO | show-sql: true en BD → logs contienen números tarjeta | Exposición en archivos de log |
| **Sin validación webhook** ⚠️ | ALTO | Si aceptas webhook sin verificar firma → Falsificación | Actualizaciones de pago fraudulentas |

---

## 💳 PARTE 3: PLAN DETALLADO DE INSTALACIÓN DE SDKs

### 3.1 Stripe: Instalación Completa

#### 3.1.1 Backend (Java) - order-service

**Paso 1: Actualizar pom.xml**

```xml
<!-- Ubicación: apps/order-service/pom.xml -->
<!-- Agregar DENTRO de <dependencies> -->

<!-- STRIPE SDK Server-Side para Java -->
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>28.2.0</version>  <!-- ⚠️ Consulta última en: mvnrepository.com/artifact/com.stripe -->
</dependency>

<!-- Para manejo de secretos en tiempo de ejecución -->
<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>java-dotenv</artifactId>
    <version>5.2.2</version>
</dependency>
```

**Paso 2: Ubicación de archivos**

- Crear: `apps/order-service/src/main/java/com/fishwish/order/payment/stripe/`
  - `StripePaymentService.java` (lógica de negocio)
  - `StripeWebhookHandler.java` (escucha eventos Stripe)
  - `StripeConfig.java` (inicialización SDK)

**Paso 3: Configuración de credenciales**

```yaml
# Ubicación: apps/order-service/src/main/resources/application.yml
# AGREGAR al final del archivo:

stripe:
  api-key: ${STRIPE_SECRET_KEY}  # Inyección desde ENV
  webhook-secret: ${STRIPE_WEBHOOK_SECRET}
  publishable-key: ${STRIPE_PUBLISHABLE_KEY}
```

#### 3.1.2 Frontend (Next.js) - web

**Paso 1: Instalar SDK Cliente Stripe**

```bash
cd apps/web
npm install @stripe/react-stripe-js @stripe/stripe-js
# O con pnpm (recomendado en tu proyecto):
pnpm add @stripe/react-stripe-js @stripe/stripe-js
```

**Paso 2: Ubicación de archivos**

- Crear: `apps/web/app/payment/`
  - `StripeCheckoutForm.tsx` (componente formulario tarjeta)
  - `StripeProvider.tsx` (proveedor wrapper)
  - `useStripePayment.ts` (hook personalizado)

**Paso 3: Variables de entorno**

```bash
# Ubicación: apps/web/.env.local (gitignore)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # Pública (cliente)
STRIPE_SECRET_KEY=sk_live_xxxxx                    # Privada (servidor solo)
```

---

### 3.2 Mercado Pago: Instalación Completa

#### 3.2.1 Backend (Java) - order-service

**Paso 1: Actualizar pom.xml**

```xml
<!-- Ubicación: apps/order-service/pom.xml -->
<!-- Agregar DENTRO de <dependencies> -->

<!-- MERCADO PAGO SDK Server-Side para Java -->
<dependency>
    <groupId>com.mercadopago</groupId>
    <artifactId>sdk-java</artifactId>
    <version>2.1.10</version>  <!-- ⚠️ Consulta última versión -->
</dependency>
```

**Paso 2: Ubicación de archivos**

- Crear: `apps/order-service/src/main/java/com/fishwish/order/payment/mercadopago/`
  - `MercadoPagoPaymentService.java` (lógica de negocio)
  - `MercadoPagoWebhookHandler.java` (escucha IPN webhooks)
  - `MercadoPagoConfig.java` (inicialización SDK)

**Paso 3: Configuración de credenciales**

```yaml
# Ubicación: apps/order-service/src/main/resources/application.yml
# AGREGAR al final del archivo:

mercadopago:
  access-token: ${MERCADOPAGO_ACCESS_TOKEN}  # Token de acceso
  public-key: ${MERCADOPAGO_PUBLIC_KEY}      # Clave pública
  webhook-token: ${MERCADOPAGO_WEBHOOK_TOKEN}  # Para verificar IPN
```

#### 3.2.2 Frontend (Next.js) - web

**Paso 1: Instalar SDK Cliente Mercado Pago (Checkout Bricks)**

```bash
cd apps/web
npm install @mercadopago/sdk-js
# O con pnpm:
pnpm add @mercadopago/sdk-js
```

**Paso 2: Ubicación de archivos**

- Crear: `apps/web/app/payment/`
  - `MercadoPagoCheckoutForm.tsx` (componente Checkout Bricks)
  - `useMercadoPagoPayment.ts` (hook personalizado)

**Paso 3: Variables de entorno**

```bash
# Ubicación: apps/web/.env.local
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR_xxxxx  # Pública (cliente)
MERCADOPAGO_ACCESS_TOKEN=APP_USR_xxxxx             # Privada (servidor)
```

---

## 🎯 PARTE 4: GUÍA ARQUITECTÓNICA DE IMPLEMENTACIÓN SEGURA

### 4.1 Seguridad de Credenciales: El Factor Crítico

#### 🚨 Regla de Oro: NUNCA exponer API Keys privadas

**Dónde SÍ están seguras:**
```
✅ Variables de entorno del servidor (application.yml, .env del contenedor)
✅ AWS Secrets Manager, Azure Key Vault (producción)
✅ Archivos .env locales (gitignore obligatorio)
```

**Dónde NUNCA van:**
```
❌ Código fuente Java/TypeScript
❌ archivo package.json o pom.xml
❌ Commits en git
❌ Cliente JavaScript (excepto claves públicas prefijadas con pk_live_/pk_test_)
❌ Logs de aplicación
❌ Comentarios en código
```

#### Implementación en Order Service

**Paso 1: Crear clase de configuración centralizada**

```
Ubicación: apps/order-service/src/main/java/com/fishwish/order/config/PaymentConfig.java

Responsabilidad:
- Leer variables ENV en construcción
- Inicializar clientes Stripe/MercadoPago
- Validar que claves existan antes de startup
- Inyectar como beans singleton

No hacer:
- No leer API keys en cada request (ineficiente)
- No pasar como parámetro por métodos (innecesario)
- No usar @Value en controladores directamente
```

**Paso 2: Estructura de configuración**

```
# En application.yml
payment:
  stripe:
    secret-key: ${STRIPE_SECRET_KEY}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET}
    timeout-ms: 30000
    max-retries: 3
  
  mercadopago:
    access-token: ${MERCADOPAGO_ACCESS_TOKEN}
    webhook-token: ${MERCADOPAGO_WEBHOOK_TOKEN}
    notification-url: ${MP_NOTIFICATION_URL}

# Validación en PaymentConfig:
if (payment.stripe.secret-key == null)
  throw new IllegalStateException("STRIPE_SECRET_KEY no configurada");
```

---

### 4.2 Puntos de Inyección en Backend: Dónde Crear Endpoints

#### Arquitectura Propuesta (3 capas de pago)

```
Frontend (Next.js)
     ↓
[CAPA 1: PaymentController] ← Nuevos endpoints
     ↓
[CAPA 2: PaymentService] ← Lógica orquestación
     ↓
[CAPA 3: StripeService / MercadoPagoService] ← SDKs
     ↓
[Stripe API / Mercado Pago API] (Internet)
```

#### 4.2.1 Crear PaymentController

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/controller/PaymentController.java`

**Endpoints a crear:**

```
1️⃣  POST /api/payments/stripe/intent
    ├─ Recibe: { orderId: Long, amount: Double, currency: "USD" }
    ├─ Retorna: { clientSecret: "String", paymentIntentId: "String" }
    ├─ Responsabilidad: Crear PaymentIntent en Stripe
    └─ Flujo: Controller → PaymentService → StripeService → Stripe API

2️⃣  POST /api/payments/stripe/confirm
    ├─ Recibe: { paymentIntentId: "String", orderId: Long }
    ├─ Retorna: { status: "SUCCEEDED|PROCESSING|FAILED", orderId: Long }
    ├─ Responsabilidad: Confirmar pago recibido
    └─ Actualiza Order.status = "PAGADO"

3️⃣  POST /api/payments/mercadopago/preference
    ├─ Recibe: { orderId: Long, items: [...], returnUrl: "String" }
    ├─ Retorna: { preferenceId: "String", initPoint: "String" }
    ├─ Responsabilidad: Crear preferencia en Mercado Pago
    └─ initPoint es URL a redirigir cliente para pagar

4️⃣  POST /api/payments/webhooks/stripe
    ├─ Recibe: Evento Stripe (sin body, headers con firma)
    ├─ Responsabilidad: Validar firma, procesar evento asíncronamente
    └─ No retornar lógica de negocio aquí (async/queue)

5️⃣  POST /api/payments/webhooks/mercadopago
    ├─ Recibe: IPN notification del servidor MP
    ├─ Responsabilidad: Validar token, procesar pago
    └─ No retornar errores de BD aquí
```

#### 4.2.2 Crear PaymentService (Orquestadora)

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/service/PaymentService.java`

**Métodos:**

```
1. createStripePaymentIntent(Order order)
   ├─ Recibe Order de BD
   ├─ Extrae: totalAmount, customerName, currency
   ├─ Llama: stripeService.createIntent()
   ├─ Actualiza: Order.paymentIntentId = intentId
   └─ Retorna: intentId + clientSecret

2. processStripeWebhookEvent(String signature, String payload)
   ├─ Valida firma webhook con STRIPE_WEBHOOK_SECRET
   ├─ Parsea payload → Event object
   ├─ Switch por tipo evento:
   │  ├─ "payment_intent.succeeded" → updateOrderStatus("PAGADO")
   │  ├─ "payment_intent.payment_failed" → updateOrderStatus("RECHAZADO")
   │  └─ "charge.refunded" → updateOrderStatus("REEMBOLSADO")
   └─ Actualiza Order en BD

3. createMercadoPagoPreference(Order order)
   ├─ Mapea Order.items → Preference items
   ├─ Llama: mercadoPagoService.createPreference()
   ├─ Guarda: preferenceId en tabla payment_records
   └─ Retorna: preferenceId + init_point URL

4. processMercadoPagoNotification(Map notification)
   ├─ Valida token IPN (MERCADOPAGO_WEBHOOK_TOKEN)
   ├─ Extrae: payment_id, status, external_reference (orderId)
   ├─ Consulta pago a MP API para confirmar (anti-fraud)
   ├─ Actualiza Order basado en estado pago
   └─ Genera evento asíncronamente para inventory
```

---

### 4.3 Flujo Frontend: Componentes de Pago Seguros

#### 4.3.1 Arquitectura de Componentes

```
CheckoutPage.tsx (página existente)
     ↓
PaymentMethodSelector.tsx (Nuevo)
├─ Radio buttons: "Stripe" vs "Mercado Pago"
└─ Renderiza componente según selección
     ↓
┌─ Si Stripe:
│  └─ StripeCheckoutForm.tsx
│     ├─ Integra @stripe/react-stripe-js
│     ├─ CardElement para entrada de tarjeta
│     ├─ Envía clientSecret al backend
│     └─ Espera webhook confirmación
│
└─ Si Mercado Pago:
   └─ MercadoPagoCheckout.tsx
      ├─ Integra MercadoPago Checkout Bricks
      ├─ Renderiza brick en container
      ├─ Redirige a MP checkout page
      └─ Retorna con payment_id
```

#### 4.3.2 Componente StripeCheckoutForm.tsx

**Ubicación:** `apps/web/app/components/payment/StripeCheckoutForm.tsx`

**Estructura (sin código, solo arquitectura):**

```
Responsabilidades:
1. Importar componentes Stripe (@stripe/react-stripe-js)
2. Envolver con StripeProvider (clave pública)
3. Form local con:
   - CardElement (capturo tarjeta)
   - Nombre titular
   - Email
4. Event handlers:
   - onChange: validar estructura card
   - onSubmit: 
     a) Crear PaymentMethod con Stripe.js (NO enviamos tarjeta al servidor)
     b) POST /api/payments/stripe/confirm {paymentMethodId, orderId}
     c) Si response.success: redirige a /order-confirmation
     d) Si response.requiresAction: muestra 3D Secure challenge

PCI-DSS Compliance:
✓ Tarjeta NUNCA toca servidor (Stripe maneja cifrado)
✓ Solo PaymentMethodId viaja en red
✓ HTTPS obligatorio
✓ CSP headers previenen inyección scripts
```

#### 4.3.3 Componente MercadoPagoCheckout.tsx

**Ubicación:** `apps/web/app/components/payment/MercadoPagoCheckout.tsx`

**Estructura (sin código):**

```
Responsabilidades:
1. Importar MercadoPago SDK (@mercadopago/sdk-js)
2. Inicializar con clave pública
3. Crear Checkout Brick con opciones:
   - locale: "es-MX"
   - theme: "dark"
4. Render brick en container
5. Listeners:
   - onSubmit: Captura evento cuando usuario paga
   - onError: Maneja rechazos/errores
   - onReady: Habilita botón pagar
6. POST /api/payments/mercadopago/verify {paymentId}
   a) Backend consulta MP API para confirmar
   b) Si APPROVED: actualiza orden
   c) Redirige a confirmación

PCI-DSS Compliance:
✓ Formulario Bricks alojado por MP (seguro por defecto)
✓ Cliente nunca maneja números tarjeta
✓ Redirect flow es estándar industria
✓ IPN webhooks para confirmación server-to-server
```

---

### 4.4 Manejo de Webhooks: Flujo Asíncronos Seguro

#### 4.4.1 Webhook Stripe

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/controller/StripeWebhookController.java`

**Arquitectura:**

```
POST /api/webhooks/stripe
│
├─ PASO 1: Validación de Firma
│  ├─ Header "stripe-signature" contiene: timestamp.signature
│  ├─ Recrear signature: HMAC-SHA256(timestamp.payload, STRIPE_WEBHOOK_SECRET)
│  ├─ Comparar con signature recibida
│  └─ Si ✗: Retornar 401 Unauthorized
│
├─ PASO 2: Parsear Payload
│  ├─ JSON parse: id, type, data.object
│  └─ type ej: "payment_intent.succeeded"
│
├─ PASO 3: Procesar Asincronía
│  ├─ Guardar evento en tabla "payment_events" (idempotencia)
│  ├─ Publicar evento a message queue (si tienes RabbitMQ/Kafka)
│  │  O
│  └─ Ejecutar en thread pool async (Spring @Async)
│
├─ PASO 4: Retornar 200 OK INMEDIATAMENTE
│  └─ No esperar procesamiento (Stripe reintenta si timeout)
│
└─ PASO 5: Procesar Evento
   ├─ Si "payment_intent.succeeded":
   │  ├─ Obtener Order por paymentIntentId
   │  ├─ Order.setStatus("PAGADO")
   │  ├─ Order.setPaidAt(now())
   │  ├─ orderRepository.save()
   │  ├─ Enviar email confirmación al cliente
   │  └─ Trigger inventory reduction (si aún no hecho)
   │
   └─ Si "payment_intent.canceled":
      ├─ Order.setStatus("CANCELADO")
      ├─ Restaurar stock (si ya fue decrementado)
      └─ Notificar cliente
```

#### 4.4.2 Webhook Mercado Pago (IPN)

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/controller/MercadoPagoWebhookController.java`

**Arquitectura:**

```
POST /api/webhooks/mercadopago
│
├─ PASO 1: Recibir Notificación IPN
│  └─ Query params: id, type, action (ej: "payment.updated")
│
├─ PASO 2: Verificar Token
│  ├─ Header "Authorization" debe contener token
│  └─ Comparar con MERCADOPAGO_WEBHOOK_TOKEN
│
├─ PASO 3: Consultar Pago a MP (Anti-Fraud)
│  ├─ No confiar solo en notificación
│  ├─ MP API: GET /v1/payments/{payment_id}
│  └─ Verificar: status, amount, currency, payer
│
├─ PASO 4: Guardar Evento (Idempotencia)
│  ├─ Tabla "mp_payment_events" con unique constraint (payment_id)
│  └─ Si ya existe: Log y retornar (no duplicar)
│
├─ PASO 5: Procesar Asincronía
│  └─ Similar a Stripe (queue o @Async)
│
├─ PASO 6: Retornar 200 OK INMEDIATAMENTE
│  └─ Stripe reintenta si no recibe 200-299
│
└─ PASO 7: Procesar Pago
   ├─ Si status = "approved":
   │  ├─ Order.setStatus("PAGADO")
   │  ├─ Registrar external_reference como payment_id
   │  └─ Actualizar BD
   │
   ├─ Si status = "pending":
   │  ├─ Order.setStatus("PENDIENTE_CONFIRMACION")
   │  └─ Enviar email: "Pago en proceso, no cierres navegador"
   │
   └─ Si status = "rejected":
      ├─ Order.setStatus("RECHAZADO")
      ├─ Restaurar stock
      └─ Notificar cliente con motivo rechazo
```

#### 4.4.3 Tabla de Eventos para Idempotencia

**Ubicación:** Crear migración JPA entity en order-service

```java
Entity: PaymentEvent
├─ id: Long (PK)
├─ externalEventId: String (Stripe event_id o MP payment_id) [UNIQUE]
├─ eventType: String (ej: "payment_intent.succeeded")
├─ status: String ["RECEIVED", "PROCESSED", "FAILED"]
├─ payload: TEXT (JSON del evento)
├─ orderId: Long (FK Order)
├─ processedAt: LocalDateTime
└─ retryCount: Integer

Beneficios:
✓ Si webhook se recibe 2x: Detectamos por externalEventId
✓ Auditaría completa de transacciones
✓ Permite retry manual si falló procesamiento
```

---

### 4.5 Actualización del Modelo Order

**Ubicación:** `apps/order-service/src/main/java/com/fishwish/order/model/Order.java`

**Campos a AGREGAR:**

```java
// Stripe
private String stripePaymentIntentId;  // ID único en Stripe
private String stripeClientSecret;     // Para frontend confirmar pago
@Enumerated(EnumType.STRING)
private PaymentGateway paymentGateway; // Enum: STRIPE, MERCADOPAGO

// Mercado Pago
private String mercadoPagoPreferenceId;
private String mercadoPagoPaymentId;

// Seguimiento pago
private LocalDateTime paidAt;          // Cuándo se confirmó pago
private String paymentStatus;          // "PENDING", "SUCCEEDED", "FAILED"
private Double paidAmount;             // Monto real pagado
private String paymentMethod;          // "card", "bank_transfer", etc.
private LocalDateTime refundedAt;      // Si fue reembolsado
private Double refundedAmount;         // Monto reembolsado
```

**Importante:** NO guardes datos de tarjeta (números, CVV, etc.)

---

### 4.6 Cambios en OrderService.createOrder()

**Adaptaciones necesarias:**

```
Flujo ANTES (sin pago):
Order recibida → Validación → Persistir → Stock actualizado ✓ COMPLETO

Flujo DESPUÉS (con pago):
Order recibida 
  ├─ Cambiar status a "PENDING_PAYMENT"
  ├─ Persistir en BD (todavía sin pago)
  └─ Retornar datos pago al frontend:
     ├─ Si Stripe: { clientSecret, paymentIntentId }
     └─ Si MP: { preferenceId, initPoint }

LUEGO (async vía webhook):
Webhook recibido
  ├─ Validar firma
  ├─ Actualizar Order.paymentStatus = "SUCCEEDED"
  ├─ Actualizar Order.status = "CONFIRMED"
  ├─ Decrementar stock en product-service
  └─ Enviar email confirmación

Ventaja: Si cliente cierra navegador después de pagar, webhook aún procesa.
```

---

### 4.7 Flujo Completo Frontend → Backend → Stripe/MP

```
╔════════════════════════════════════════════════════════════╗
║ ESCENARIO 1: Cliente elige STRIPE                          ║
╚════════════════════════════════════════════════════════════╝

1. Frontend: [CheckoutPage → StripeCheckoutForm]
   └─ Usuario rellenar: nombre, dirección, teléfono, tarjeta
   └─ Click: "Pagar con Stripe"

2. Frontend: StripeCheckoutForm.tsx
   ├─ POST /api/payments/stripe/intent
   │  ├─ Body: { orderId: 123, amount: 150.00, currency: "USD" }
   │  └─ Response: { clientSecret: "pi_xxx_secret", paymentIntentId: "pi_xxx" }
   │
   └─ Stripe.js en cliente:
      ├─ Confirmar pago con clientSecret
      ├─ Envía tarjeta a Stripe (NO a tu servidor)
      └─ Retorna paymentMethodId

3. Backend: POST /api/payments/stripe/intent
   ├─ Recibe orderId
   ├─ Obtener Order de BD
   ├─ Llamar: stripeService.createPaymentIntent(amount, currency)
   ├─ Stripe API retorna clientSecret
   ├─ Guardar: Order.stripePaymentIntentId = "pi_xxx"
   ├─ Order.paymentStatus = "INTENT_CREATED"
   ├─ orderRepository.save()
   └─ Retornar al cliente: clientSecret + paymentIntentId

4. Frontend: Componente procesa clientSecret
   ├─ Stripe.js confirma pago
   └─ Si success → POST /api/payments/stripe/confirm
                └─ Body: { paymentIntentId: "pi_xxx", orderId: 123 }

5. Backend: POST /api/payments/stripe/confirm
   ├─ Recibe paymentIntentId + orderId
   ├─ stripeService.retrievePaymentIntent(paymentIntentId)
   ├─ Valida que status = "succeeded"
   ├─ Order.paymentStatus = "CONFIRMED"
   ├─ Persistir pero status sigue "PENDING_PAYMENT"
   └─ Retornar: { status: "success", orderId: 123 }

6. Frontend: Redirige a /order-confirmation
   └─ Muestra: "Tu pago está procesándose, recibirás email..."

7. Stripe: Envía webhook después de algunos segundos
   └─ POST /api/webhooks/stripe
      ├─ Body: { id: "evt_xxx", type: "payment_intent.succeeded", data: {...} }
      ├─ Backend valida firma
      ├─ Obtiene Order por paymentIntentId
      ├─ Order.status = "PAGADO"
      ├─ Decrementar stock
      ├─ Enviar email confirmación
      └─ Retornar: 200 OK

╔════════════════════════════════════════════════════════════╗
║ ESCENARIO 2: Cliente elige MERCADO PAGO                    ║
╚════════════════════════════════════════════════════════════╝

1. Frontend: [CheckoutPage → MercadoPagoCheckout]
   └─ Mostrar datos envío
   └─ Click: "Pagar con Mercado Pago"

2. Frontend: MercadoPagoCheckout.tsx
   ├─ POST /api/payments/mercadopago/preference
   │  ├─ Body: { orderId: 123, items: [{productId, quantity, price}], returnUrl: "..." }
   │  └─ Response: { preferenceId: "xxxxx", initPoint: "https://www.mercadopago.com/checkout/v1/..." }
   │
   └─ window.location.href = initPoint
      └─ Redirige a sitio MP (cliente sale de tu sitio)

3. Backend: POST /api/payments/mercadopago/preference
   ├─ Recibe orderId + items
   ├─ Obtener Order de BD
   ├─ Llamar: mercadoPagoService.createPreference(items, totalAmount)
   ├─ MP API retorna preferenceId + init_point
   ├─ Guardar: Order.mercadoPagoPreferenceId = "xxxxx"
   ├─ Order.paymentStatus = "PREFERENCE_CREATED"
   ├─ orderRepository.save()
   └─ Retornar: { preferenceId, initPoint }

4. Cliente: En sitio MP
   ├─ Selecciona método pago (tarjeta, transferencia, etc.)
   ├─ Completa datos
   └─ MP procesa pago

5. MP Webhooks: Después de procesamiento
   └─ POST /api/webhooks/mercadopago?id={payment_id}&type=payment
      ├─ Backend obtiene payment_id
      ├─ Valida token IPN
      ├─ MP API: GET /v1/payments/{payment_id} (verificación)
      ├─ Obtiene orden por preferenceId
      ├─ Si status="approved" → Order.status = "PAGADO"
      ├─ Decrementar stock
      ├─ Generar confirmación
      └─ Retornar: 200 OK

6. Cliente: Redirige de vuelta
   └─ Si success → returnUrl?payment_id=xxxxx&status=approved
   └─ Frontend: Detecta success, redirige a /order-confirmation
```

---

## 🔒 PARTE 5: ADVERTENCIAS DE SEGURIDAD CRÍTICAS (PCI-DSS)

### 5.1 Lo que DEBES Hacer

```
✅ OBLIGATORIO:

1. HTTPS en PRODUCCIÓN
   └─ Todos los endpoints /api/payments/* solo via HTTPS
   └─ Forzar redirect HTTP → HTTPS

2. Rate Limiting en webhooks
   └─ Máximo 100 requests/minuto por IP
   └─ Previene brute-force de webhooks

3. Validar firma de TODOS los webhooks
   └─ Nunca confiar en que webhook venga de Stripe/MP
   └─ Usar HMAC-SHA256 con secret key

4. Timeout en llamadas API
   └─ Stripe: máximo 30 segundos
   └─ MP: máximo 30 segundos
   └─ Prevenir resource exhaustion

5. Logs de auditoría
   └─ Registrar TODOS los eventos pago (Saved Events table)
   └─ Auditoría: Quién, Qué, Cuándo, Por qué
   └─ NO loguear números tarjeta o CVV

6. Encriptación de datos sensibles en BD
   └─ stripePaymentIntentId: puede ser plaintext (puedes verificarlo público)
   └─ paymentStatus: plaintext (público)
   └─ Pero: Si guardas tokens/secrets → ENCRIPTAR con algoritmo reversible

7. JWT o sesión segura para API
   └─ Si tienes usuarios autenticados: Usar JWT + HTTPS
   └─ Solo el usuario que hizo la orden puede ver/modificar su pago

8. Validar moneda y monto en backend
   └─ No confiar en cantidad del frontend (podría modificar JavaScript)
   └─ Backend: Obtener totalAmount de Order BD (autoridad)
   └─ Comparar con lo que envía cliente
   └─ Si mismatch → Rechazar transacción
```

### 5.2 Lo que NUNCA Debes Hacer

```
❌ PROHIBIDO TERMINANTEMENTE:

1. ❌ Guardar números de tarjeta
   └─ "4532 1111 1111 1111" NUNCA en BD
   └─ Violación PCI-DSS Level 1 (multa $100,000+)

2. ❌ Loguear datos de tarjeta
   └─ No escribas CVV en logs
   └─ No logues responses completas de pago

3. ❌ Hardcodear API keys en código
   └─ Stripe secret en clases Java
   └─ MP access token en archivos .ts
   └─ Usar SOLO variables de entorno

4. ❌ Confiar en frontend para validaciones críticas
   └─ Cliente puede modificar JavaScript
   └─ Validar SIEMPRE en backend
   └─ Ej: cantidad, precio, tipo de producto

5. ❌ Enviar datos tarjeta entre servicios
   └─ Si tienes payment-service separado
   └─ NUNCA pasar {"cardNumber": "xxxx"} via HTTP
   └─ Solo pasar IDs seguros: paymentIntentId

6. ❌ Retornar datos sensibles en errores
   └─ Error HTTP: No revelar estructura interna
   └─ NO: { error: "Usuario con id 123 no existe" }
   └─ SÍ: { error: "No pudimos procesar tu solicitud" }

7. ❌ Permitir cambios de orden después de pago
   └─ Una vez paymentIntentId asignado
   └─ totalAmount es inmutable
   └─ items son inmutables

8. ❌ No validar webhook o validar insuficientemente
   └─ Attacker podría falsificar webhook
   └─ Siempre validar firma HMAC
   └─ Siempre consultar API original (anti-fraud)

9. ❌ Procesar webhook sincronía (bloqueante)
   └─ Si webhook tarda, Stripe/MP timeout (retoma)
   └─ Usar @Async, message queue, thread pool
   └─ Siempre retornar 200 OK rápido
```

### 5.3 Checklist de Seguridad Pre-Producción

```
ANTES DE DEPLOYING A PRODUCCIÓN:

Credenciales:
 ☐ Todas las API keys en variables ENV (no en código)
 ☐ .env.local en .gitignore
 ☐ Diferentes claves dev vs prod
 ☐ Usar AWS Secrets Manager o similar en prod

HTTPS & Comunicación:
 ☐ HTTPS forzado en todos /api/payments/*
 ☐ Certificados SSL válidos
 ☐ CORS configurado (no * para payment endpoints)
 ☐ CSP headers (Content-Security-Policy) para prevenir XSS

Validaciones Backend:
 ☐ Nunca confiar en montos del frontend
 ☐ Validar cantidad de items
 ☐ Chequear disponibilidad producto
 ☐ Validar que usuario sea dueño de la orden

Webhooks:
 ☐ Todas las firmas validadas (HMAC-SHA256)
 ☐ Tabla de eventos guardada antes de procesar
 ☐ Validación de timeout (<2 minutos)
 ☐ Logs de eventos guardados por ≥1 año (auditoría)

Logs & Monitoring:
 ☐ Logging de eventos críticos (pago recibido, rechazado)
 ☐ NO loguear tarjetas/CVV
 ☐ Alertas para anomalías (400 rechazos en 10 min)
 ☐ Monitoreo de Stripe/MP dashboards

Tests:
 ☐ Tests unitarios de creación de payment intent
 ☐ Tests de webhook (simular Stripe/MP)
 ☐ Tests de error handling (conexión caída)
 ☐ Tests de idempotencia (webhook 2x)

Documentación:
 ☐ Procedimiento de refundos documentado
 ☐ Procedimiento de disputas documentado
 ☐ Runbook para incidentes de pago
 ☐ Documentación de arquitectura pago

Acuerdos:
 ☐ Certificado PCI-DSS (Self-Assessment si SAQ A-EP)
 ☐ Política de privacidad actualizada
 ☐ Términos de servicio mencionan Stripe/MP
 ☐ Consentimiento del usuario para procesador pago
```

---

## 📋 PARTE 6: RESUMEN DE IMPLEMENTACIÓN POR FASE

### FASE 1: Preparación (Semana 1)

```
1. Crear archivo de notas proyecto
   └─ Documentar decisiones arquitectónicas
   └─ Decidir: ¿Stripe + MP en paralelo o secuencial?

2. Crear estructura de directorios
   ├─ apps/order-service/src/main/java/com/fishwish/order/payment/stripe/
   ├─ apps/order-service/src/main/java/com/fishwish/order/payment/mercadopago/
   ├─ apps/web/app/components/payment/
   └─ apps/web/app/payment/

3. Solicitar credenciales
   ├─ Stripe: Crear cuenta en dashboard.stripe.com
   │  └─ Obtener: Secret Key, Publishable Key, Webhook Endpoint Secret
   └─ MP: Crear cuenta en developers.mercadopago.com
      └─ Obtener: Access Token, Public Key, Webhook Token

4. Crear archivos .env.local (gitignored)
   ├─ apps/order-service/.env.local
   └─ apps/web/.env.local

5. Actualizar application.yml (sin valores, solo placeholders)
```

### FASE 2: Backend - SDKs e Inicialización (Semana 2)

```
1. Agregar dependencias Maven
   ├─ pom.xml: stripe-java + mercadopago-sdk
   ├─ Ejecutar: mvn clean install
   └─ Verificar: Maven Central descarga todo

2. Crear PaymentConfig.java
   ├─ Leer variables ENV
   ├─ Inicializar clientes Stripe/MP
   ├─ Validaciones pre-startup
   └─ @Configuration con @Bean

3. Crear tablas BD (migraciones JPA)
   ├─ PaymentEvent (para webhooks)
   ├─ PaymentRecord (historial pagos)
   └─ Actualizar Order: nuevos campos pago

4. Crear servicios de pago
   ├─ StripeService.java (lógica Stripe)
   ├─ MercadoPagoService.java (lógica MP)
   └─ PaymentService.java (orquestadora)
```

### FASE 3: Backend - Controladores (Semana 3)

```
1. Crear PaymentController.java
   ├─ POST /api/payments/stripe/intent
   ├─ POST /api/payments/stripe/confirm
   ├─ POST /api/payments/mercadopago/preference
   └─ Exception handling global

2. Crear StripeWebhookController.java
   ├─ POST /api/webhooks/stripe
   ├─ Validación de firma
   ├─ Procesamiento async

3. Crear MercadoPagoWebhookController.java
   ├─ POST /api/webhooks/mercadopago
   ├─ Validación de token
   ├─ Procesamiento async

4. Tests unitarios
   ├─ Mock de Stripe API
   ├─ Mock de MP API
   ├─ Tests de webhooks
```

### FASE 4: Frontend - Componentes (Semana 4)

```
1. Instalar SDKs
   ├─ pnpm add @stripe/react-stripe-js @stripe/stripe-js
   ├─ pnpm add @mercadopago/sdk-js
   └─ Verificar en node_modules

2. Crear componentes Stripe
   ├─ StripeProvider.tsx
   ├─ StripeCheckoutForm.tsx
   ├─ useStripePayment.ts hook

3. Crear componentes MP
   ├─ MercadoPagoCheckout.tsx
   ├─ useMercadoPagoPayment.ts hook

4. Refactorizar CheckoutPage.tsx
   ├─ Agregar PaymentMethodSelector
   ├─ Renderizar componente dinámico
   └─ Manejar estados (loading, error, success)

5. Tests e2e
   ├─ Stripe test mode
   ├─ MP test mode
   └─ Validación flujo completo
```

### FASE 5: Testing & QA (Semana 5)

```
1. Testing en ambiente SANDBOX
   ├─ Stripe: Usar test card 4242 4242 4242 4242
   ├─ MP: Usar test mode
   └─ Crear múltiples scenarios

2. Tests de seguridad
   ├─ OWASP Top 10
   ├─ SQL injection (inputs validados?)
   ├─ XSS (outputs escapados?)
   └─ CSRF (tokens presentes?)

3. Carga testing
   ├─ Simular 100 órdenes concurrentes
   ├─ Verificar rate limiting
   └─ Monitorear recursos DB

4. Audit trail
   ├─ Verificar logs contienen eventos correctos
   ├─ Verificar NO contiene datos sensibles
```

### FASE 6: Deployment (Semana 6)

```
1. Cambiar credenciales a LIVE
   ├─ Obtener claves producción Stripe
   ├─ Obtener claves producción MP
   └─ Configurar en variables ENV servidor

2. Configurar webhooks en paneles
   ├─ Stripe Dashboard: Registrar webhook endpoint
   ├─ MP Dashboard: Registrar webhook endpoint
   └─ Validar que reciben eventos

3. Certificado PCI-DSS
   ├─ Completar Self-Assessment Questionnaire (SAQ A-EP)
   ├─ Si procesa tarjetas: Certificación nivel requerido
   └─ Documentar compliance

4. Monitoreo post-deploy
   ├─ Alertas para fallos webhook
   ├─ Dashboards de transacciones
   ├─ Respuesta ante incidentes

5. Documentación
   ├─ Runbook operaciones
   ├─ Procedimiento refundos
   ├─ Escalación de problemas
```

---

## 🎓 PARTE 7: RECURSOS Y REFERENCIAS

### SDKs Oficiales
- **Stripe Java SDK:** https://github.com/stripe/stripe-java
- **Stripe React:** https://stripe.com/docs/stripe-js/react
- **Mercado Pago Java SDK:** https://github.com/mercadopago/sdk-java
- **Mercado Pago JS:** https://developers.mercadopago.com/en/guides/checkout-bricks/intro

### Documentación
- Stripe Payments: https://stripe.com/docs/payments/payment-intents
- Stripe Webhooks: https://stripe.com/docs/webhooks
- MP Preferences: https://developers.mercadopago.com/en/guides/checkout-api/create-preference
- PCI-DSS 4.0: https://www.pcisecuritystandards.org/

### Spring Boot
- Spring Data JPA: https://spring.io/projects/spring-data-jpa
- Spring Cloud OpenFeign: https://spring.io/projects/spring-cloud-openfeign
- Spring Security: https://spring.io/projects/spring-security

### Frontend
- Next.js 16: https://nextjs.org/docs
- Zustand: https://github.com/pmndrs/zustand
- Tailwind CSS: https://tailwindcss.com/docs

---

**Documento Preparado Por:** Arquitecto Senior - Seguridad PCI-DSS  
**Fecha:** Mayo 2026  
**Clasificación:** Arquitectónica Crítica  
**Versión:** 1.0
