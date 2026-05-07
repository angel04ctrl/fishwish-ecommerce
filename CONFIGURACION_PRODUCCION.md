# Configuración Correcta para Producción

## 🔧 Cambios Realizados

### ✅ Frontend (Vercel) - YA CORREGIDO
Se actualizó el nombre de la variable de entorno en 3 archivos:
- `apps/web/app/page.tsx`
- `apps/web/app/productos/page.tsx`
- `apps/web/app/cart/page.tsx`

**Cambio:** `NEXT_PUBLIC_PRODUCT_URL` → `NEXT_PUBLIC_PRODUCT_API_URL`

### ✅ Backend - Order Service (application.yml) - YA CORREGIDO
Se externalizada la URL del product-service:

**De:**
```yaml
app:
  product-service:
    url: http://localhost:8081/api/products
```

**A:**
```yaml
app:
  product-service:
    url: ${PRODUCT_SERVICE_URL:http://localhost:8081/api/products}
```

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

1. **En Railway - Order Service:**
   - Ir a `Settings` → `Variables`
   - Agregar nueva variable: `PRODUCT_SERVICE_URL`
   - Valor: `https://product-service-production-0df4.up.railway.app/api/products`
   - Hacer re-deploy

2. **Re-deploy en Vercel:**
   - Hacer un nuevo deploy del frontend (puede ser con un push a main o hacer redeploy manual)

3. **Probar:**
   - Cargar la app en Vercel
   - Los productos deberían cargar sin error
   - El carrito debería funcionar
   - El checkout debería procesar pedidos

---

## ✅ CORS - Ya Configurado

Ambos servicios ya permiten peticiones desde `https://fishwish-ecommerce-web-five.vercel.app`:

**Product-Service (`CorsConfig.java`):**
- ✅ Permite `https://fishwish-ecommerce-web-five.vercel.app`
- ✅ Métodos: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD

**Order-Service (`CorsConfig.java`):**
- ✅ Permite `https://fishwish-ecommerce-web-five.vercel.app`
- ✅ Métodos: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD

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

### ❌ Problema 3: Variable de entorno no existe en Railway
- **Causa:** No se agregó `PRODUCT_SERVICE_URL` en las variables del order-service
- **Resultado del Error:** El placeholder usaría el default local que no funciona en producción
- **Solución:** ⚠️ MANUAL - Agregar en Railway (paso 1 arriba)
