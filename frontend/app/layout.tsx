import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Planificador de Ensayos - Desenfreno de Pasiones",
  description: "Aplicación para optimizar la planificación de ensayos de telenovelas",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es"
      className="light"
      style={{ colorScheme: "light" }}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
