'use client';

import { useCartStore } from '../lib/cartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeFromCart, increaseQuantity, decreaseQuantity, totalPrice } = useCartStore();
  const router = useRouter();

  const handleGoToCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="text-8xl mb-8">🛒</div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
        <p className="text-xl text-gray-600 mb-10 text-center">Aún no has agregado ningún producto</p>
        <Link 
          href="/"
          className="bg-[#003087] text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-[#002266]"
        >
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Tu Carrito de Compras</h1>
          <Link href="/" className="text-[#003087] hover:underline font-medium">
            ← Seguir comprando
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Lista de productos */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`p-8 flex flex-col md:flex-row gap-6 ${index !== items.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="w-full md:w-40 h-40 bg-gradient-to-br from-[#003087] to-[#00A3E0] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-7xl">🐟</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold">{item.name}</h3>
                        <p className="text-gray-500">{item.presentation}</p>
                      </div>
                      <p className="text-3xl font-bold text-[#003087]">
                        ${(item.price * item.quantity).toFixed(0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 mt-8">
                      <div className="flex items-center border border-gray-300 rounded-2xl">
                        <button 
                          onClick={() => decreaseQuantity(item.id)}
                          className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-l-2xl"
                        >
                          −
                        </button>
                        <span className="px-8 font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => increaseQuantity(item.id)}
                          className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-r-2xl"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen + Botón único */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm sticky top-8">
              <h3 className="text-2xl font-semibold mb-6">Resumen del pedido</h3>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${totalPrice()}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-green-600">Gratis</span>
                </div>
                <div className="border-t pt-5 flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span>${totalPrice()} MXN</span>
                </div>
              </div>

              {/* Único botón grande */}
              <button 
                onClick={() => router.push('/checkout')}
                className="w-full bg-[#00A3E0] hover:bg-[#0088c2] text-white py-5 rounded-2xl font-bold text-xl transition-all"
              >
                Finalizar Compra
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Serás redirigido para completar tus datos de envío y pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}