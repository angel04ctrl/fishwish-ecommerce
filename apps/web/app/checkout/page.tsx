'use client';

import { useState, useEffect, Suspense } from 'react'; // Agregamos Suspense
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams } from 'next/navigation';
import CheckoutForm from '../payment/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 1. Movemos toda tu lógica a un componente interno
function CheckoutContent() {
  const [clientSecret, setClientSecret] = useState("");
  
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || "ORD-GENERICA"; 

  useEffect(() => {
    // ✅ USAR VARIABLE DE ENTORNO EN VEZ DE URL HARDCODEADA
    const backendUrl = process.env.NEXT_PUBLIC_ORDER_URL || 'http://localhost:8084';

    fetch(`${backendUrl}/api/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        amount: 5000, 
        orderId: orderId 
      }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => console.error("Error al obtener el intent:", err));
  }, [orderId]);

  const appearance = { theme: 'flat' as const };
  const options = { clientSecret, appearance };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow-xl rounded-xl bg-white">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>
      
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm orderId={orderId} />
        </Elements>
      ) : (
        <div className="flex justify-center">
          <p>Cargando pasarela segura...</p>
        </div>
      )}
    </div>
  );
}

// 2. El export principal solo envuelve al contenido en el "límite" de Suspense
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto mt-10 p-6 text-center">
        <p>Cargando información de pago...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}