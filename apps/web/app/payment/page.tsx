'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../payment/CheckoutForm'; // Ajusta la ruta si es necesario

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!orderId) return;

    // Llamamos a tu Java en Railway para obtener el permiso de cobro
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        orderId: orderId,
        amount: 15000 // Esto debería venir de tu base de datos realmente
      }),
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret))
    .catch(err => console.error("Error obteniendo el secret:", err));
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto p-8 border rounded-xl shadow-lg bg-white mt-10">
      <h2 className="text-xl font-bold mb-4">Resumen de Compra</h2>
      <p className="text-gray-600 mb-6">Orden ID: #{orderId}</p>
      
      {clientSecret ? (
        <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      ) : (
        <div className="text-center py-10">Generando sesión segura...</div>
      )}
    </div>
  );
}