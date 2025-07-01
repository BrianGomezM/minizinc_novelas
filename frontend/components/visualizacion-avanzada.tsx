"use client"

import { useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function VisualizacionAvanzada({ resultados, data }) {
  if (!resultados) return null

  return (
    <div>
      <div className="p-6 border border-red-200 rounded-md bg-red-50 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Costo Total</h3>
            <p className="text-3xl font-bold text-red-800">${resultados.costo_total.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
              <p className="text-sm text-gray-600">Escenas</p>
              <p className="text-xl font-semibold text-gray-800">{resultados.orden_escenas.length}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
              <p className="text-sm text-gray-600">Actores</p>
              <p className="text-xl font-semibold text-gray-800">{resultados.tiempos_por_actor.length}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
              <p className="text-sm text-gray-600">Tiempo Compartido Evitar</p>
              <p className="text-xl font-semibold text-gray-800">{resultados.tiempo_compartido_actores_evitar}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="gantt" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="gantt">Diagrama de Gantt</TabsTrigger>
          <TabsTrigger value="costos">Tabla de Costos</TabsTrigger>
          <TabsTrigger value="secuencia">Secuencia de Escenas</TabsTrigger>
          <TabsTrigger value="acumulado">Costos Acumulados</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Diagrama de Gantt de la Planificación</h3>
            <DiagramaGantt resultados={resultados} data={data} />
          </div>
        </TabsContent>

        <TabsContent value="costos">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Tabla Resumen de Costos</h3>
            <TablaCostosAvanzada resultados={resultados} data={data} />
          </div>
        </TabsContent>

        <TabsContent value="secuencia">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Secuencia de Escenas</h3>
            <SecuenciaEscenas resultados={resultados} data={data} />
          </div>
        </TabsContent>

        <TabsContent value="acumulado">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Gráfico de Costos Acumulados</h3>
            <GraficoCostosAcumulados resultados={resultados} data={data} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Diagrama de Gantt corregido: Actor x Escena
function DiagramaGantt({ resultados, data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !resultados || !data) return

    const dibujarGrafico = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      const dpr = window.devicePixelRatio || 1

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const margin = {
        top: 40,
        right: 20,
        bottom: 50,
        left: rect.width < 500 ? 60 : 80,
      }
      const width = rect.width - margin.left - margin.right
      const height = rect.height - margin.top - margin.bottom

      const actores = resultados.tiempos_por_actor
      const ordenEscenas = resultados.orden_escenas
      const numEscenas = ordenEscenas.length

      // Calcular escalas
      const anchoEscena = width / numEscenas
      const alturaActor = height / actores.length

      // Dibujar ejes
      ctx.beginPath()
      ctx.moveTo(margin.left, margin.top)
      ctx.lineTo(margin.left, height + margin.top)
      ctx.lineTo(width + margin.left, height + margin.top)
      ctx.strokeStyle = "#6b7280"
      ctx.stroke()

      // Etiquetas de los ejes
      ctx.fillStyle = "#374151"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Escenas (en orden de ejecución)", margin.left + width / 2, height + margin.top + 35)

      ctx.save()
      ctx.translate(15, margin.top + height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText("Actores", 0, 0)
      ctx.restore()

      // Dibujar nombres de escenas en el eje X
      const fontSizeEscenas = rect.width < 500 ? "10px" : "12px"
      ctx.font = fontSizeEscenas + " Arial"
      ctx.textAlign = "center"

      ordenEscenas.forEach((escenaId, index) => {
        const x = margin.left + index * anchoEscena + anchoEscena / 2

        // Línea de separación
        ctx.beginPath()
        ctx.moveTo(margin.left + index * anchoEscena, margin.top)
        ctx.lineTo(margin.left + index * anchoEscena, height + margin.top)
        ctx.strokeStyle = "#e5e7eb"
        ctx.stroke()

        // Etiqueta de escena
        ctx.fillStyle = "#374151"
        ctx.fillText(`E${escenaId}`, x, height + margin.top + 20)

        // Línea de marca
        ctx.beginPath()
        ctx.moveTo(x, height + margin.top)
        ctx.lineTo(x, height + margin.top + 5)
        ctx.strokeStyle = "#6b7280"
        ctx.stroke()
      })

      // Dibujar nombres de actores en el eje Y
      const fontSizeActores = rect.width < 500 ? "10px" : "12px"
      ctx.font = fontSizeActores + " Arial"
      ctx.textAlign = "right"

      actores.forEach((actor, index) => {
        const y = margin.top + index * alturaActor + alturaActor / 2

        // Línea de separación horizontal
        if (index > 0) {
          ctx.beginPath()
          ctx.moveTo(margin.left, margin.top + index * alturaActor)
          ctx.lineTo(width + margin.left, margin.top + index * alturaActor)
          ctx.strokeStyle = "#e5e7eb"
          ctx.stroke()
        }

        // Nombre del actor
        ctx.fillStyle = "#374151"
        const nombreMostrado = rect.width < 500 ? actor.nombre.replace("Actor", "A") : actor.nombre
        ctx.fillText(nombreMostrado, margin.left - 10, y + 4)
      })

      // Colores para cada actor
      const colores = ["#dc2626", "#ef4444", "#b91c1c", "#991b1b", "#7f1d1d"]

      // Dibujar las barras de participación para cada actor
      actores.forEach((actor, indexActor) => {
        const y = margin.top + indexActor * alturaActor

        // Encontrar las posiciones de inicio y fin en la secuencia
        const posicionInicio = ordenEscenas.indexOf(actor.rango_escenas_inicio)
        const posicionFin = ordenEscenas.indexOf(actor.rango_escenas_fin)

        if (posicionInicio !== -1 && posicionFin !== -1) {
          // Calcular coordenadas de la barra principal (rango completo)
          const x1 = margin.left + posicionInicio * anchoEscena
          const x2 = margin.left + (posicionFin + 1) * anchoEscena
          const alturaBarra = alturaActor * 0.6

          // Dibujar barra de rango completo (más transparente)
          ctx.fillStyle = colores[indexActor % colores.length] + "40" // Con transparencia
          ctx.fillRect(x1, y + (alturaActor - alturaBarra) / 2, x2 - x1, alturaBarra)

          // Dibujar borde de la barra de rango
          ctx.strokeStyle = colores[indexActor % colores.length]
          ctx.lineWidth = 2
          ctx.strokeRect(x1, y + (alturaActor - alturaBarra) / 2, x2 - x1, alturaBarra)

          // Marcar las escenas específicas donde el actor realmente participa
          const actorData = data.actores.find((a) => a.nombre === actor.nombre)
          if (actorData) {
            ordenEscenas.forEach((escenaId, escenaIndex) => {
              const escena = data.escenas.find((e) => e.id === escenaId)

              if (escena && escena.actoresParticipantes.includes(actorData.id)) {
                // Esta escena tiene participación real del actor
                const xEscena = margin.left + escenaIndex * anchoEscena

                // Dibujar rectángulo sólido para participación real
                ctx.fillStyle = colores[indexActor % colores.length]
                ctx.fillRect(xEscena + 2, y + (alturaActor - alturaBarra) / 2 + 2, anchoEscena - 4, alturaBarra - 4)

                // Añadir marca de participación
                ctx.fillStyle = "#ffffff"
                ctx.font = "bold 8px Arial"
                ctx.textAlign = "center"
                ctx.fillText("✓", xEscena + anchoEscena / 2, y + alturaActor / 2 + 3)
              }
            })
          }

          // Añadir texto con información del actor
          if (x2 - x1 > 60) {
            ctx.fillStyle = "#111827"
            ctx.font = "10px Arial"
            ctx.textAlign = "center"
            ctx.fillText(`${actor.unidades}u - $${actor.costo}`, (x1 + x2) / 2, y + alturaActor / 2 - 8)
          }
        }
      })

      // Título del gráfico
      ctx.fillStyle = "#111827"
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Diagrama de Gantt - Actor x Escena", margin.left + width / 2, 20)

      // Leyenda
      ctx.font = "10px Arial"
      ctx.textAlign = "left"
      ctx.fillStyle = "#6b7280"
      ctx.fillText("█ Rango de presencia", margin.left, height + margin.top + 45)
      ctx.fillText("✓ Participación real", margin.left + 120, height + margin.top + 45)
    }

    dibujarGrafico()

    const handleResize = () => dibujarGrafico()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [resultados, data])

  return (
    <div className="w-full h-[400px] md:h-[450px] bg-white p-2 border border-gray-300 rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

// Tabla de costos corregida para usar los datos exactos del backend
function TablaCostosAvanzada({ resultados, data }) {
  if (!resultados) return null

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-200">
          <TableRow>
            <TableHead className="font-bold">Actor</TableHead>
            <TableHead className="font-bold">Rango Inicio</TableHead>
            <TableHead className="font-bold">Rango Fin</TableHead>
            <TableHead className="font-bold">Unidades de Tiempo</TableHead>
            <TableHead className="font-bold">Costo por Unidad</TableHead>
            <TableHead className="font-bold">Costo Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultados.tiempos_por_actor.map((actor, index) => {
            // Encontrar el costo por unidad del actor en los datos originales
            const actorData = data?.actores?.find((a) => a.nombre === actor.nombre)
            const costoPorUnidad = actorData ? actorData.costoPorMinuto : actor.costo / actor.unidades

            return (
              <TableRow key={actor.nombre} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="font-medium">{actor.nombre}</TableCell>
                <TableCell>Escena {actor.rango_escenas_inicio}</TableCell>
                <TableCell>Escena {actor.rango_escenas_fin}</TableCell>
                <TableCell className="text-center">{actor.unidades}</TableCell>
                <TableCell>${costoPorUnidad.toFixed(2)}</TableCell>
                <TableCell className="font-semibold text-red-700">${actor.costo.toFixed(2)}</TableCell>
              </TableRow>
            )
          })}
          <TableRow className="bg-red-50">
            <TableCell colSpan={5} className="font-bold text-right">
              Total
            </TableCell>
            <TableCell className="font-bold text-red-700">${resultados.costo_total.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

// Secuencia de escenas corregida
function SecuenciaEscenas({ resultados, data }) {
  if (!resultados) return null

  const escenasConDetalles = resultados.orden_escenas.map((escenaId, index) => {
    const escena = data?.escenas?.find((e) => e.id === escenaId) || {
      id: escenaId,
      duracion: 1,
      actoresParticipantes: [],
    }

    // Obtener actores que participan en esta escena
    const actoresEnEscena = escena.actoresParticipantes
      .map((actorId) => {
        const actor = data?.actores?.find((a) => a.id === actorId)
        return actor ? actor.nombre : `Actor${actorId}`
      })
      .filter(Boolean)

    // Calcular costo de esta escena específica
    const costoEscena = actoresEnEscena.reduce((total, nombreActor) => {
      const actorData = data?.actores?.find((a) => a.nombre === nombreActor)
      return total + (actorData ? actorData.costoPorMinuto * escena.duracion : 0)
    }, 0)

    return {
      orden: index + 1,
      id: escenaId,
      duracion: escena.duracion,
      actores: actoresEnEscena.join(", "),
      costoEscena: costoEscena,
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {resultados.orden_escenas.map((escenaId, index) => {
          const escena = escenasConDetalles.find((e) => e.id === escenaId)
          return (
            <Badge key={index} className="bg-red-700 hover:bg-red-800 text-base py-1 px-3">
              {escenaId} <span className="text-xs ml-1">({escena?.duracion || "?"} u)</span>
            </Badge>
          )
        })}
      </div>

      <div className="space-y-3">
        {escenasConDetalles.map((escena) => (
          <div key={escena.id} className="p-3 border border-gray-300 rounded-md bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {escena.orden}
                </div>
                <h4 className="font-semibold">
                  Escena {escena.id}
                  <span className="text-gray-500 font-normal"> (Duración: {escena.duracion} unidades)</span>
                </h4>
              </div>
              <div className="text-sm font-semibold text-red-700">Costo: ${escena.costoEscena.toFixed(2)}</div>
            </div>
            <div className="mt-2 pl-8">
              <p className="text-gray-700">
                <span className="font-medium">Actores:</span> {escena.actores || "Ninguno"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de la secuencia */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-300">
        <h4 className="font-semibold text-gray-800 mb-2">Resumen de la Secuencia</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Escenas:</span>
            <div className="font-semibold">{resultados.orden_escenas.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Duración Total:</span>
            <div className="font-semibold">{escenasConDetalles.reduce((sum, e) => sum + e.duracion, 0)} unidades</div>
          </div>
          <div>
            <span className="text-gray-600">Costo Total:</span>
            <div className="font-semibold text-red-700">${resultados.costo_total}</div>
          </div>
          <div>
            <span className="text-gray-600">Actores Involucrados:</span>
            <div className="font-semibold">{resultados.tiempos_por_actor.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gráfico de costos acumulados corregido
function GraficoCostosAcumulados({ resultados, data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !resultados || !data) return

    const dibujarGrafico = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      const dpr = window.devicePixelRatio || 1

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const margin = {
        top: 40,
        right: 30,
        bottom: 50,
        left: rect.width < 500 ? 50 : 60,
      }
      const width = rect.width - margin.left - margin.right
      const height = rect.height - margin.top - margin.bottom

      // Calcular costos acumulados reales por escena
      const costosAcumulados = []
      let costoAcumulado = 0

      resultados.orden_escenas.forEach((escenaId, index) => {
        const escena = data.escenas.find((e) => e.id === escenaId)

        if (escena) {
          // Calcular el costo de esta escena específica
          const actoresEnEscena = escena.actoresParticipantes
            .map((actorId) => data.actores.find((a) => a.id === actorId))
            .filter(Boolean)

          const costoEscena = actoresEnEscena.reduce((total, actor) => {
            return total + actor.costoPorMinuto * escena.duracion
          }, 0)

          costoAcumulado += costoEscena
        }

        costosAcumulados.push({
          escena: escenaId,
          costo: costoAcumulado,
          posicion: index,
        })
      })

      // Ajustar el último punto al costo total real
      if (costosAcumulados.length > 0) {
        const factor = resultados.costo_total / costoAcumulado
        costosAcumulados.forEach((punto) => {
          punto.costo *= factor
        })
      }

      const escalaX = width / (resultados.orden_escenas.length - 1)
      const escalaY = height / resultados.costo_total

      // Dibujar ejes
      ctx.beginPath()
      ctx.moveTo(margin.left, margin.top)
      ctx.lineTo(margin.left, height + margin.top)
      ctx.lineTo(width + margin.left, height + margin.top)
      ctx.strokeStyle = "#6b7280"
      ctx.stroke()

      // Etiquetas
      ctx.fillStyle = "#374151"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Secuencia de Escenas", margin.left + width / 2, height + margin.top + 35)

      ctx.save()
      ctx.translate(15, margin.top + height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText("Costo Acumulado ($)", 0, 0)
      ctx.restore()

      // Marcas en X (escenas)
      const mostrarTodas = rect.width >= 500 || resultados.orden_escenas.length <= 5
      const paso = mostrarTodas ? 1 : Math.ceil(resultados.orden_escenas.length / 5)

      resultados.orden_escenas.forEach((escenaId, index) => {
        if (mostrarTodas || index % paso === 0) {
          const x = margin.left + index * escalaX
          ctx.beginPath()
          ctx.moveTo(x, height + margin.top)
          ctx.lineTo(x, height + margin.top + 5)
          ctx.stroke()
          ctx.fillText(escenaId.toString(), x, height + margin.top + 20)
        }
      })

      // Marcas en Y (costos)
      const numMarcasY = rect.width < 500 ? 3 : 5
      const incrementoY = resultados.costo_total / numMarcasY

      for (let i = 0; i <= numMarcasY; i++) {
        const costo = i * incrementoY
        const y = margin.top + height - costo * escalaY

        ctx.beginPath()
        ctx.moveTo(margin.left - 5, y)
        ctx.lineTo(margin.left, y)
        ctx.stroke()
        ctx.textAlign = "right"
        ctx.fillText(`$${costo.toFixed(0)}`, margin.left - 10, y + 4)
      }

      // Dibujar línea de costos acumulados
      ctx.beginPath()
      ctx.moveTo(margin.left, height + margin.top)

      costosAcumulados.forEach((punto, index) => {
        const x = margin.left + index * escalaX
        const y = margin.top + height - punto.costo * escalaY
        ctx.lineTo(x, y)
      })

      ctx.strokeStyle = "#dc2626"
      ctx.lineWidth = 3
      ctx.stroke()

      // Dibujar puntos
      costosAcumulados.forEach((punto, index) => {
        const x = margin.left + index * escalaX
        const y = margin.top + height - punto.costo * escalaY

        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#dc2626"
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()

        // Etiquetas de costo
        if (mostrarTodas || index % paso === 0 || index === costosAcumulados.length - 1) {
          ctx.fillStyle = "#111827"
          ctx.textAlign = "center"
          ctx.fillText(`$${punto.costo.toFixed(0)}`, x, y - 10)
        }
      })

      // Área bajo la curva
      ctx.beginPath()
      ctx.moveTo(margin.left, height + margin.top)

      costosAcumulados.forEach((punto, index) => {
        const x = margin.left + index * escalaX
        const y = margin.top + height - punto.costo * escalaY
        ctx.lineTo(x, y)
      })

      ctx.lineTo(margin.left + (resultados.orden_escenas.length - 1) * escalaX, height + margin.top)
      ctx.closePath()
      ctx.fillStyle = "rgba(220, 38, 38, 0.1)"
      ctx.fill()

      // Título
      ctx.fillStyle = "#111827"
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Costos Acumulados por Escena", margin.left + width / 2, 20)
    }

    dibujarGrafico()

    const handleResize = () => dibujarGrafico()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [resultados, data])

  return (
    <div className="w-full h-[400px] md:h-[450px] bg-white p-2 border border-gray-300 rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
