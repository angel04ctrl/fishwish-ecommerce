'use client';

import { useEffect, useState, Suspense } from 'react'; // Agregamos Suspense
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../payment/CheckoutForm'; 

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 1. Envolvemos el contenido en una función interna
function PaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!orderId) return;

    // Usar NEXT_PUBLIC_ORDER_URL que apunta al backend (order-service)
    const backendUrl = process.env.NEXT_PUBLIC_ORDER_URL || 'http://localhost:8084';

    fetch(`${backendUrl}/api/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        orderId: orderId,
        amount: 15000 
      }),
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => setClientSecret(data.clientSecret))
    .catch(err => console.error("Error obteniendo el secret:", err));
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto p-8 border rounded-xl shadow-lg bg-white mt-10">
      <h2 className="text-xl font-bold mb-4">Resumen de Compra</h2>
      <p className="text-gray-600 mb-6">Orden ID: #{orderId}</p>
      
      {clientSecret ? (
        <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
          {/* ✅ CORRECCIÓN 1: Pasamos el orderId para que TypeScript no falle */}
          <CheckoutForm orderId={orderId ?? ""} />
        </Elements>
      ) : (
        <div className="text-center py-10">Generando sesión segura...</div>
      )}
    </div>
  );
}

// 2. Exportamos la página envuelta en Suspense para que Vercel no dé error
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando componentes de pago...</div>}>
      <PaymentContent />
    </Suspense>
  );
}