import './globals.css'

export const metadata = {
  title: 'A Cuánto Sale',
  description: 'Comparador de precios de grandes cadenas venezolanas · Bs y $ al tipo de cambio BCV',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
