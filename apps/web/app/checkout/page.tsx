'use client';

import { useCartStore } from '../lib/cartStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCartStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        address: '',
        city: 'Campeche',
        phone: '',
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Si el carrito está vacío, redirigir al carrito
    useEffect(() => {
        if (isMounted && items.length === 0) {
            router.push('/cart');
        }
    }, [items.length, router, isMounted]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const orderData = {
            customerName: formData.customerName,
            address: formData.address,
            city: formData.city,
            phone: formData.phone,
            items: items.map(item => ({
                productId: item.id,
                productName: item.name,
                presentation: item.presentation,
                price: item.price,
                quantity: item.quantity,
            })),
        };

        try {
            // Usamos variable de entorno si existe, de lo contrario usamos localhost para desarrollo local
            const orderUrl = process.env.NEXT_PUBLIC_ORDER_URL || 'http://localhost:8082';

            const response = await fetch(`${orderUrl}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                const savedOrder = await response.json();
                clearCart(); // Vaciar carrito después de guardar
                toast.success('¡Pedido creado exitosamente!', {
                    description: 'Te redirigiremos a tu confirmación.'
                });
                router.push(`/order-confirmation?id=${savedOrder.id}`);
            } else {
                const errorText = await response.text();
                toast.error('No se pudo procesar tu pedido', {
                    description: errorText || 'Por favor verifica la disponibilidad de los productos.'
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('No se pudo conectar con el servidor', {
                description: 'Verifica tu conexión a internet e intenta nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-3xl mx-auto px-6">
                <button
                    onClick={() => router.push('/cart')}
                    className="mb-8 flex items-center gap-2 text-[#003087] hover:text-[#002266]"
                >
                    ← Volver al carrito
                </button>

                <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6">Datos de envío</h2>

                        <div className="grid grid-cols-1 gap-6">
                            <input
                                type="text"
                                name="customerName"
                                placeholder="Nombre completo"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                required
                                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#003087]"
                            />

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Teléfono"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#003087]"
                            />

                            <input
                                type="text"
                                name="address"
                                placeholder="Dirección completa"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#003087]"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#003087]"
                                    aria-label="Seleccionar ciudad"
                                >
                                    <option value="Campeche">Campeche</option>
                                    <option value="Mérida">Mérida</option>
                                    <option value="Ciudad del Carmen">Ciudad del Carmen</option>
                                </select>

                            </div>

                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isMounted}
                        className="w-full bg-[#00A3E0] hover:bg-[#0088c2] text-white py-5 rounded-2xl font-bold text-xl transition-all flex justify-center items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando pedido...
                            </>
                        ) : (
                            `Pagar $${isMounted ? totalPrice() : 0} MXN`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}