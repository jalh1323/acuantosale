import './globals.css'

export const metadata = {
  title: 'FarmaPrecios',
  description: 'Compara precios en Farmatodo y Locatel · Bs y $ al tipo de cambio BCV',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
