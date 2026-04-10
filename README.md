# FishWish E-commerce

FishWish es una plataforma de comercio electrónico orientada a la venta de productos del mar frescos, que conecta directamente a los pescadores con los consumidores.

## Arquitectura del Proyecto

El proyecto utiliza una arquitectura de microservicios con las siguientes tecnologías:
- **Frontend (Web)**: Next.js (React), Tailwind CSS, Zustand para gestión de estado.
- **Backend (Microservicios)**: Spring Boot (Java 21), Spring Data JPA.
  - `product-service` (Puerto 8081): Gestiona el catálogo de productos.
  - `order-service` (Puerto 8082): Gestiona las órdenes de compra.
- **Base de Datos**: PostgreSQL.
- **Infraestructura**: Docker y Docker Compose (RabbitMQ y Redis preparados para futuras implementaciones de caché y mensajería).

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
- [Node.js](https://nodejs.org/) (v18 o superior) y npm/pnpm.
- [Java 21](https://adoptium.net/) y [Maven](https://maven.apache.org/) (si deseas ejecutar los servicios fuera de Docker).

## Instrucciones de Ejecución (Con Docker)

La forma más rápida de ejecutar todo el proyecto es utilizando Docker Compose. Esto levantará la base de datos y los microservicios backend.

1. Abre una terminal en la raíz del proyecto.
2. Ejecuta el siguiente comando para levantar la infraestructura:
   `ash
   cd docker
   docker-compose up -d --build
   ``n   > Esto construirá las imágenes de los servicios de Spring Boot (`order-service` y `product-service`) y levantará PostgreSQL, RabbitMQ y Redis.

3. Verifica que los contenedores estén corriendo:
   `ash
   docker ps
   ``n
4. Para levantar el frontend (Next.js):
   `ash
   cd apps/web
   npm install   # o pnpm install
   npm run dev   # o pnpm dev
   ``n
5. Accede a la aplicación en tu navegador: [http://localhost:3000](http://localhost:3000)

## Desarrollo Local (Sin Docker para los Microservicios)

Si prefieres ejecutar los microservicios localmente usando Maven para un desarrollo más rápido:

1. Levanta únicamente la base de datos y servicios auxiliares:
   Edita temporalmente el `docker-compose.yml` o corre solo el contenedor de Postgres.
   `ash
   cd docker
   docker-compose up -d postgres
   ``n
2. Ejecuta el `product-service`:
   `ash
   cd apps/product-service
   mvn spring-boot:run
   ``n
3. En otra terminal, ejecuta el `order-service`:
   `ash
   cd apps/order-service
   mvn spring-boot:run
   ``n
4. Ejecuta el frontend de Next.js como se explicó en el paso anterior.

## Flujo Completo

1. **Catálogo**: El usuario entra a la aplicación y ve los productos obtenidos desde `product-service`.
2. **Carrito**: El usuario puede agregar productos al carrito (estado manejado por Zustand localmente).
3. **Checkout**: El usuario llena sus datos y confirma la compra.
4. **Order Service**: El frontend hace una petición POST a `order-service` para guardar la orden en la base de datos PostgreSQL.
5. **Confirmación**: El usuario es redirigido a una página de éxito donde puede visualizar el ID de su pedido, la fecha, y se vacía el carrito.
