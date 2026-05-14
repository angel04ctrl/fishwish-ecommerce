'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../payment/CheckoutForm'; // El que creamos anteriormente

// Cargamos la instancia de Stripe con tu llave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // 1. Aquí llamamos a tu backend en Java (Railway)
    // Debes enviar el monto total y el ID de la orden que el usuario está pagando
    fetch("https://order-service-production.up.railway.app/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        amount: 5000, // Ejemplo: $50.00 MXN (en centavos)
        orderId: "ORD-123" // Aquí deberías pasar el ID real de tu carrito
      }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  // Opciones visuales para el formulario
  const appearance = { theme: 'flat' as const };
  const options = { clientSecret, appearance };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow-xl rounded-xl bg-white">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>
      
      {/* IMPORTANTE: Solo mostramos el formulario cuando 
          ya tenemos el clientSecret del backend 
      */}
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      ) : (
        <div className="flex justify-center">
          <p>Cargando pasarela segura...</p>
        </div>
      )}
    </div>
  );
}