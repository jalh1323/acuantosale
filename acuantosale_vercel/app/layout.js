import './globals.css'

export const metadata = {
  title: 'A Cuánto Sale',
  description: 'Compara precios en Farmatodo, Locatel y Gama · Bs y $ al tipo de cambio BCV',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
