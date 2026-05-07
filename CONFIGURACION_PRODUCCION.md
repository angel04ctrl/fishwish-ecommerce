# Configuración Correcta para Producción

## 🔧 Cambios Realizados

### ✅ Frontend (Vercel) - YA CORREGIDO
Se actualizó el nombre de la variable de entorno en 3 archivos:
- `apps/web/app/page.tsx`
- `apps/web/app/productos/page.tsx`
- `apps/web/app/cart/page.tsx`

**Cambio:** `NEXT_PUBLIC_PRODUCT_URL` → `NEXT_PUBLIC_PRODUCT_API_URL`

### ✅ Backend - Order Service (application.yml) - YA CORREGIDO
Se externalizó la URL del product-service:

```yaml
app:
  product-service:
    url: ${PRODUCT_SERVICE_URL:http://localhost:8081/api/products}
```

### ✅ Backend - Database Connection (application.yml) - YA CORREGIDO
Se cambió la conexión a BD de hardcodeada a variables de entorno de Railway:

**De:**
```yaml
datasource:
  url: jdbc:postgresql://localhost:5433/fishwish
  username: fishwish
  password: fishwish123
```

**A:**
```yaml
datasource:
  url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
  username: ${PGUSER}
  password: ${PGPASSWORD}
```

**Archivos actualizados:**
- `apps/order-service/src/main/resources/application.yml`
- `apps/product-service/src/main/resources/application.yml`

### ✅ Backend - Order Service CORS Configuration - YA CORREGIDO
Se corrigió la configuración de CORS que tenía headers mal configurados.

**Archivo:** `apps/order-service/src/main/java/com/fishwish/order/config/CorsConfig.java`

---

## 📋 Variables de Entorno Requeridas en Railway

### Order-Service
Necesita agregar en Railway la variable:
```
PRODUCT_SERVICE_URL = https://product-service-production-0df4.up.railway.app/api/products
```

(Obtén la URL exacta del producto-service desde el panel de Railway)

### Product-Service
Ya está correctamente configurada:
- ✅ Base de datos
- ✅ Puerto

### Verificar en Vercel
Las variables ya existen pero verifica que tengan estos valores exactos:
- `NEXT_PUBLIC_PRODUCT_API_URL` = `https://product-service-production-0df4.up.railway.app`
- `NEXT_PUBLIC_ORDER_URL` = `https://order-service-production-58b9.up.railway.app`

---

## 🔍 Puntos de Configuración

| Servicio | Variable | Valor | Estado |
|----------|----------|-------|--------|
| Vercel (Frontend) | `NEXT_PUBLIC_PRODUCT_API_URL` | `https://product-service-production-0df4.up.railway.app` | ✅ Configurada |
| Vercel (Frontend) | `NEXT_PUBLIC_ORDER_URL` | `https://order-service-production-58b9.up.railway.app` | ✅ Configurada |
| Railway (Order-Service) | `PRODUCT_SERVICE_URL` | `https://product-service-production-0df4.up.railway.app/api/products` | ⚠️ **FALTA AGREGAR** |

---

## 🚀 Próximos Pasos

### 1. **Hacer Commit y Push a GitHub**
```bash
git add -A
git commit -m "Fix database and product-service URL configuration for Railway"
git push origin main
```
Railway se redeploy automáticamente en 1-2 minutos.

### 2. **En Railway - Order Service (si no lo hace automáticamente):**
   - Ir a `Settings` → `Variables`
   - Agregar nueva variable: `PRODUCT_SERVICE_URL`
   - Valor: `https://product-service-production-0df4.up.railway.app/api/products`
   - Hacer re-deploy

### 3. **Verificar que los servicios se levanten correctamente:**
   - En Railway → Logs
   - Deberías ver:
     ```
     ✅ Order Service iniciado en http://localhost:8082
     ✅ Product Service INICIADO correctamente en http://localhost:8081
     ```
   - Si ves errores de BD, algo sigue mal

### 4. **Probar la aplicación:**
   - Abre https://fishwish-ecommerce-web-five.vercel.app
   - Carga productos ✅
   - Agrega al carrito ✅
   - Haz checkout ✅
   - Crea un pedido ✅

---

## ✅ CORS - Ya Corregido

**Product-Service (`CorsConfig.java`):** ✅ CORRECTO
- ✅ Permite `https://fishwish-ecommerce-web-five.vercel.app`
- ✅ Métodos: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
- ✅ Headers: `*` (acepta todos)

**Order-Service (`CorsConfig.java`):** ✅ CORREGIDO
- ✅ Permite `https://fishwish-ecommerce-web-five.vercel.app`
- ✅ Métodos: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
- ✅ Headers: `*` (era el error - ahora está correcto)
- ✅ Exposed Headers: `*` (ahora agregado)

---

## 📝 Resumen de Problemas Encontrados y Solucionados

### ❌ Problema 1: Frontend buscaba variable incorrecta
- **Causa:** Código usaba `NEXT_PUBLIC_PRODUCT_URL` pero estaba configurada como `NEXT_PUBLIC_PRODUCT_API_URL`
- **Resultado del Error:** El frontend siempre usaba el fallback `http://localhost:8081` que no existe en producción
- **Solución:** ✅ APLICADA - Actualizar nombre en 3 archivos TypeScript

### ❌ Problema 2: Order-Service tenía URL del product-service hardcodeada
- **Causa:** `application.yml` tenía `http://localhost:8081/api/products` directamente
- **Resultado del Error:** Order-service en Railway no podía conectar con product-service
- **Solución:** ✅ APLICADA - Usar variable de entorno `${PRODUCT_SERVICE_URL:...}`

### ❌ Problema 3: CORS configurado incorrectamente en Order-Service
- **Causa:** `setAllowedHeaders()` recibía orígenes en lugar de headers HTTP
- **Archivo:** `apps/order-service/src/main/java/com/fishwish/order/config/CorsConfig.java`
- **Error en línea 31:** `config.setAllowedHeaders(Arrays.asList("http://localhost:3000", "https://fishwish-ecommerce-web-five.vercel.app"));`
- **Resultado del Error:** El navegador rechaza el preflight request
- **Error en consola:** "Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header"
- **Síntoma:** Error al hacer checkout, no se puede enviar el formulario
- **Solución:** ✅ APLICADA - Cambiar a `config.setAllowedHeaders(Arrays.asList("*"));` y agregar `config.setExposedHeaders(Arrays.asList("*"));`

### ❌ Problema 4: Base de datos hardcodeada en ambos servicios (ERROR 502 en Railway)
- **Causa:** Las URLs de base de datos estaban hardcodeadas a `localhost:5433`
- **Archivos afectados:**
  - `apps/order-service/src/main/resources/application.yml`
  - `apps/product-service/src/main/resources/application.yml`
- **Error en Railway:** HTTP 502 "connection refused"
- **Síntoma:** Aplicaciones no podían conectar a BD y fallaban al iniciar
- **Lo que pasaba:** Los logs de build eran correctos, pero en runtime fallaba porque no encontraba la BD
- **Solución:** ✅ APLICADA - Usar variables de entorno que Railway proporciona automáticamente:
```yaml
datasource:
  url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
  username: ${PGUSER}
  password: ${PGPASSWORD}
```

### ❌ Problema 5: Variable de entorno no existe en Railway
- **Causa:** No se agregó `PRODUCT_SERVICE_URL` en las variables del order-service
- **Resultado del Error:** El placeholder usaría el default local que no funciona en producción
- **Solución:** ⚠️ MANUAL - Agregar en Railway (paso 2 abajo)
