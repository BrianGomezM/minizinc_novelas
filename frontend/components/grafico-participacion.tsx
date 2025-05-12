"use client"

import { useEffect, useRef } from "react"

export function GraficoParticipacion({ solucion, data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !solucion || !data) return

    // Función para dibujar el gráfico
    const dibujarGrafico = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      const dpr = window.devicePixelRatio || 1

      // Ajustar el canvas para pantallas de alta resolución
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Configuración del gráfico
      const margin = {
        top: 40,
        right: 20,
        bottom: 50,
        left: rect.width < 500 ? 40 : 60, // Ajustar margen izquierdo en pantallas pequeñas
      }
      const width = rect.width - margin.left - margin.right
      const height = rect.height - margin.top - margin.bottom

      // Calcular la escala para el eje X (tiempo)
      const tiempoTotal = solucion.ordenEscenas.reduce((total, escenaId) => {
        const escena = data.escenas.find((e) => e.id === escenaId)
        return total + escena.duracion
      }, 0)

      const escalaX = width / tiempoTotal

      // Dibujar ejes
      ctx.beginPath()
      ctx.moveTo(margin.left, margin.top)
      ctx.lineTo(margin.left, height + margin.top)
      ctx.lineTo(width + margin.left, height + margin.top)
      ctx.strokeStyle = "#6b7280" // Gris
      ctx.stroke()

      // Etiqueta del eje X
      ctx.fillStyle = "#374151" // Gris oscuro
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Tiempo (minutos)", margin.left + width / 2, height + margin.top + 35)

      // Etiqueta del eje Y
      ctx.save()
      ctx.translate(15, margin.top + height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText("Actores", 0, 0)
      ctx.restore()

      // Calcular la altura de cada fila de actor
      const alturaFila = height / data.actores.length

      // Calcular los tiempos de inicio y fin de cada escena
      let tiempoActual = 0
      const tiemposEscenas = solucion.ordenEscenas.map((escenaId) => {
        const escena = data.escenas.find((e) => e.id === escenaId)
        const inicio = tiempoActual
        tiempoActual += escena.duracion
        return {
          id: escenaId,
          inicio,
          fin: tiempoActual,
          actores: escena.actoresParticipantes,
        }
      })

      // Dibujar las marcas de tiempo en el eje X
      // Ajustar el intervalo según el ancho disponible
      const numMarcasDeseadas = rect.width < 500 ? 5 : 10
      const intervaloTiempo = Math.ceil(tiempoTotal / numMarcasDeseadas)

      for (let t = 0; t <= tiempoTotal; t += intervaloTiempo) {
        const x = margin.left + t * escalaX
        ctx.beginPath()
        ctx.moveTo(x, height + margin.top)
        ctx.lineTo(x, height + margin.top + 5)
        ctx.stroke()
        ctx.fillText(t.toString(), x, height + margin.top + 20)
      }

      // Dibujar los nombres de los actores en el eje Y
      // Siempre mostrar el nombre completo, centrado verticalmente
      const fontSizeActores = rect.width < 500 ? "10px" : "12px"
      ctx.font = fontSizeActores + " Arial"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      data.actores.forEach((actor, index) => {
        const y = margin.top + index * alturaFila + alturaFila / 2
        ctx.fillStyle = "#374151" // Gris oscuro
        ctx.fillText(actor.nombre, margin.left - 12, y)
        ctx.beginPath()
        ctx.moveTo(margin.left - 5, y)
        ctx.lineTo(margin.left, y)
        ctx.stroke()
      })

      // Paleta de colores accesibles y diferenciados
      const colores = [
        "#dc2626", // Rojo
        "#2563eb", // Azul
        "#16a34a", // Verde
        "#f59e42", // Naranja
        "#a21caf", // Morado
        "#eab308", // Amarillo
        "#0ea5e9", // Celeste
        "#f43f5e", // Rosa
        "#7c3aed", // Violeta
        "#f97316", // Naranja oscuro
      ]

      // Dibujar las barras de participación de los actores
      data.actores.forEach((actor, indexActor) => {
        const y = margin.top + indexActor * alturaFila
        // Encontrar los intervalos de tiempo en los que el actor está presente
        const intervalos = []
        let intervaloActual = null
        tiemposEscenas.forEach((escena) => {
          if (escena.actores.includes(actor.id)) {
            if (intervaloActual === null) {
              intervaloActual = { inicio: escena.inicio, fin: escena.fin }
            } else if (intervaloActual.fin === escena.inicio) {
              intervaloActual.fin = escena.fin
            } else {
              intervalos.push(intervaloActual)
              intervaloActual = { inicio: escena.inicio, fin: escena.fin }
            }
          }
        })
        if (intervaloActual !== null) {
          intervalos.push(intervaloActual)
        }
        // Dibujar los intervalos
        intervalos.forEach((intervalo) => {
          const x1 = margin.left + intervalo.inicio * escalaX
          const x2 = margin.left + intervalo.fin * escalaX
          ctx.fillStyle = colores[indexActor % colores.length]
          ctx.fillRect(x1, y + 5, x2 - x1, alturaFila - 10)
          // Añadir texto centrado y grande si hay suficiente espacio
          if (x2 - x1 > 30) {
            ctx.fillStyle = "#fff"
            ctx.font = "bold 14px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(`${intervalo.fin - intervalo.inicio} min`, (x1 + x2) / 2, y + alturaFila / 2)
          }
        })
      })

      // Título del gráfico
      ctx.fillStyle = "#111827" // Casi negro
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Participación de Actores en el Tiempo", margin.left + width / 2, 20)
    }

    // Dibujar el gráfico inicialmente
    dibujarGrafico()

    // Agregar event listener para redimensionar
    const handleResize = () => {
      dibujarGrafico()
    }

    window.addEventListener("resize", handleResize)

    // Limpiar event listener al desmontar
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [solucion, data])

  // Cambiar el div contenedor para asegurar que el canvas se ajuste correctamente
  return (
    <div className="w-full h-[400px] md:h-[450px] bg-white p-2 border border-gray-300 rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
