'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../lib/cartStore';
import CartModal from '../../components/ui/CartModal';

export default function AboutPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems, totalPrice } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <header className="bg-[#003087] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              🐟
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter">FishWish</h1>
              <p className="text-xs opacity-90">Snacks naturales • Campeche</p>
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-[#00A3E0] transition-colors">Inicio</Link>
            <Link href="/productos" className="hover:text-[#00A3E0] transition-colors">Productos</Link>
            <Link href="/about" className="text-[#00A3E0] transition-colors">Nosotros</Link>
            <Link href="/impacto" className="hover:text-[#00A3E0] transition-colors">Impacto</Link>
            <Link href="/contacto" className="hover:text-[#00A3E0] transition-colors">Contacto</Link>
          </nav>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl transition-all"
          >
            <span className="text-2xl">🛒</span>
            <div className="text-left">
              <div className="text-sm font-medium">Carrito</div>
              <div className="text-xs opacity-75">
                {totalItems()} productos • ${totalPrice()}
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-[#003087] to-[#00A3E0] text-white py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Nuestra Historia</h1>
          <p className="text-2xl font-light opacity-90">
            Salud en cada mordida.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        
        {/* Intro */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold text-[#003087]">¿Qué es FishWish?</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            FishWish nace de la necesidad de ofrecer una alternativa saludable y natural para nuestras mascotas, al mismo tiempo que resolvemos un problema ambiental en las costas de Campeche. Transformamos los subproductos pesqueros en snacks deshidratados de alta calidad, ricos en proteínas y Omega 3.
          </p>
        </div>

        {/* Mision, Vision, Valores Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-[#003087] mb-4">Misión</h3>
            <p className="text-gray-600">
              Brindar nutrición excepcional a las mascotas mediante snacks 100% naturales, fomentando la economía circular y el aprovechamiento responsable de los recursos marinos.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">👁️</div>
            <h3 className="text-2xl font-bold text-[#003087] mb-4">Visión</h3>
            <p className="text-gray-600">
              Ser la marca líder en México de premios naturales para mascotas con enfoque sustentable, reconociendo el valor de las comunidades pesqueras locales.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-2xl font-bold text-[#003087] mb-4">Valores</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Sustentabilidad</li>
              <li>• Calidad sin compromisos</li>
              <li>• Responsabilidad social</li>
              <li>• Innovación ecológica</li>
            </ul>
          </div>
        </div>

        {/* UACAM Section */}
        <div className="bg-[#003087]/5 p-10 rounded-3xl flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/3 flex justify-center">
            <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-md text-6xl">
              🎓
            </div>
          </div>
          <div className="md:w-2/3">
            <h3 className="text-3xl font-bold text-[#003087] mb-4">Orgullo UACAM</h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Este proyecto es orgullosamente impulsado por estudiantes del <strong>Taller de Emprendedores</strong> de la <strong>Universidad Autónoma de Campeche (UACAM)</strong>. 
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Combinamos los conocimientos académicos con la acción real para crear un modelo de negocio que beneficia a las mascotas, a los pescadores y al medio ambiente de nuestro bello estado.
            </p>
          </div>
        </div>

      </section>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
