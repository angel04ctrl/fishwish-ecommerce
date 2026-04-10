import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FishWish - Snacks Naturales para Mascotas',
  description: 'Snacks naturales hechos con subproductos pesqueros de Campeche',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}