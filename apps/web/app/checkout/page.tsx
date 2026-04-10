'use client';

import { useCartStore } from '../lib/cartStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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
            const response = await fetch('http://localhost:8082/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                const savedOrder = await response.json();
                clearCart(); // Vaciar carrito después de guardar
                router.push(`/order-confirmation?id=${savedOrder.id}`);
            } else {
                alert('Error al procesar el pedido');
            }
        } catch (error) {
            console.error(error);
            alert('No se pudo conectar con el servidor de órdenes');
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
                        className="w-full bg-[#00A3E0] hover:bg-[#0088c2] text-white py-5 rounded-2xl font-bold text-xl transition-all disabled:opacity-50"
                    >
                        {loading ? 'Procesando pedido...' : `Pagar $${isMounted ? totalPrice() : 0} MXN`}
                    </button>
                </form>
            </div>
        </div>
    );
}