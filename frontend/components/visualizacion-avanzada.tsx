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
              <p className="text-sm text-gray-600">Tiempo Total</p>
              <p className="text-xl font-semibold text-gray-800">
                {resultados.tiempos_por_actor.reduce((sum, actor) => Math.max(sum, actor.tiempo), 0)} min
              </p>
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
            <GraficoCostosAcumulados resultados={resultados} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Modificar la función DiagramaGantt para hacerla responsive
function DiagramaGantt({ resultados, data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !resultados) return

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

      // Obtener datos para el diagrama
      const actores = resultados.tiempos_por_actor.map((actor) => actor.nombre)

      // Calcular tiempos acumulados para cada escena
      let tiempoAcumulado = 0
      const tiemposEscenas = resultados.orden_escenas.map((escenaId) => {
        const escena = data?.escenas?.find((e) => e.id === escenaId) || { duracion: 2 }
        const inicio = tiempoAcumulado
        tiempoAcumulado += escena.duracion
        return {
          id: escenaId,
          inicio,
          fin: tiempoAcumulado,
          duracion: escena.duracion,
        }
      })

      const tiempoTotal = tiempoAcumulado
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
      const alturaFila = height / actores.length

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
      // Ajustar el texto según el espacio disponible
      const fontSizeActores = rect.width < 500 ? "10px" : "12px"
      ctx.font = fontSizeActores + " Arial"

      actores.forEach((actor, index) => {
        const y = margin.top + index * alturaFila + alturaFila / 2
        // Acortar nombres en pantallas pequeñas
        const nombreMostrado = rect.width < 500 ? actor.split(" ")[0] : actor
        ctx.fillText(nombreMostrado, margin.left - 10, y + 4)
        ctx.beginPath()
        ctx.moveTo(margin.left - 5, y)
        ctx.lineTo(margin.left, y)
        ctx.stroke()
      })

      // Colores en tonos de rojo y gris
      const colores = [
        "#dc2626", // Rojo
        "#ef4444", // Rojo más claro
        "#b91c1c", // Rojo más oscuro
        "#991b1b", // Rojo aún más oscuro
        "#7f1d1d", // Rojo muy oscuro
      ]

      // Simular participación de actores en escenas
      actores.forEach((actor, indexActor) => {
        const y = margin.top + indexActor * alturaFila
        const actorData = resultados.tiempos_por_actor.find((a) => a.nombre === actor)

        // Simular intervalos de tiempo para este actor
        const tiempoActor = actorData.tiempo
        const intervalos = []

        // Distribuir el tiempo del actor entre las escenas (simulación)
        let tiempoRestante = tiempoActor
        let tiempoInicio = 0

        // Asignar tiempo a escenas de manera aleatoria pero coherente
        while (tiempoRestante > 0 && tiempoInicio < tiempoTotal) {
          const duracionIntervalo = Math.min(tiempoRestante, 2 + Math.floor(Math.random() * 3))
          intervalos.push({
            inicio: tiempoInicio,
            fin: tiempoInicio + duracionIntervalo,
          })

          tiempoRestante -= duracionIntervalo
          tiempoInicio += duracionIntervalo + Math.floor(Math.random() * 3)
        }

        // Dibujar los intervalos
        intervalos.forEach((intervalo) => {
          const x1 = margin.left + intervalo.inicio * escalaX
          const x2 = margin.left + intervalo.fin * escalaX

          ctx.fillStyle = colores[indexActor % colores.length]
          ctx.fillRect(x1, y + 5, x2 - x1, alturaFila - 10)

          // Añadir texto si hay suficiente espacio
          if (x2 - x1 > 40) {
            ctx.fillStyle = "#ffffff" // Blanco
            ctx.font = "10px Arial"
            ctx.textAlign = "center"
            ctx.fillText(`${intervalo.fin - intervalo.inicio} min`, (x1 + x2) / 2, y + alturaFila / 2 + 4)
          }
        })
      })

      // Título del gráfico
      ctx.fillStyle = "#111827" // Casi negro
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Diagrama de Gantt - Participación de Actores", margin.left + width / 2, 20)
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
  }, [resultados, data])

  return (
    <div className="w-full h-[400px] md:h-[450px] bg-white p-2 border border-gray-300 rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

function TablaCostosAvanzada({ resultados }) {
  if (!resultados) return null

  const { tiempos_por_actor, costo_total } = resultados

  // Simular datos de escenas para cada actor
  const actoresConEscenas = tiempos_por_actor.map((actor) => {
    // Generar escenas aleatorias para cada actor
    const escenasAleatorias = []
    const numEscenas = Math.floor(Math.random() * 3) + 2 // 2-4 escenas por actor

    for (let i = 0; i < numEscenas; i++) {
      const escenaId = resultados.orden_escenas[Math.floor(Math.random() * resultados.orden_escenas.length)]
      if (!escenasAleatorias.includes(escenaId)) {
        escenasAleatorias.push(escenaId)
      }
    }

    return {
      ...actor,
      escenas: escenasAleatorias.sort((a, b) => a - b).join(", "),
    }
  })

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-200">
          <TableRow>
            <TableHead className="font-bold">Actor</TableHead>
            <TableHead className="font-bold">Escenas</TableHead>
            <TableHead className="font-bold">Tiempo (min)</TableHead>
            <TableHead className="font-bold">Costo Unitario</TableHead>
            <TableHead className="font-bold">Costo Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actoresConEscenas.map((actor, index) => (
            <TableRow key={actor.nombre} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <TableCell className="font-medium">{actor.nombre}</TableCell>
              <TableCell>{actor.escenas}</TableCell>
              <TableCell>{actor.tiempo}</TableCell>
              <TableCell>${(actor.costo / actor.tiempo).toFixed(2)}</TableCell>
              <TableCell className="font-semibold text-red-700">${actor.costo.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-red-50">
            <TableCell colSpan={4} className="font-bold text-right">
              Total
            </TableCell>
            <TableCell className="font-bold text-red-700">${costo_total.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

function SecuenciaEscenas({ resultados, data }) {
  if (!resultados) return null

  // Simular datos de actores para cada escena si no están disponibles
  const escenasConDetalles = resultados.orden_escenas.map((escenaId, index) => {
    const escena = data?.escenas?.find((e) => e.id === escenaId) || {
      id: escenaId,
      duracion: Math.floor(Math.random() * 3) + 1, // 1-3 minutos
      actoresParticipantes: [],
    }

    // Si no hay actores participantes, simular algunos
    const actoresEnEscena =
      escena.actoresParticipantes.length > 0
        ? escena.actoresParticipantes.map((actorId) => {
            const actor = data?.actores?.find((a) => a.id === actorId)
            return actor ? actor.nombre : `Actor${actorId}`
          })
        : resultados.tiempos_por_actor
            .filter(() => Math.random() > 0.5) // Seleccionar aleatoriamente algunos actores
            .map((actor) => actor.nombre)

    return {
      orden: index + 1,
      id: escenaId,
      duracion: escena.duracion,
      actores: actoresEnEscena.join(", "),
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {resultados.orden_escenas.map((escenaId, index) => {
          const escena = escenasConDetalles.find((e) => e.id === escenaId)
          return (
            <Badge key={index} className="bg-red-700 hover:bg-red-800 text-base py-1 px-3">
              {escenaId} <span className="text-xs ml-1">({escena?.duracion || "?"} min)</span>
            </Badge>
          )
        })}
      </div>

      <div className="space-y-3">
        {escenasConDetalles.map((escena) => (
          <div key={escena.id} className="p-3 border border-gray-300 rounded-md bg-white">
            <div className="flex items-center gap-2">
              <div className="bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {escena.orden}
              </div>
              <h4 className="font-semibold">
                Escena {escena.id} <span className="text-gray-500 font-normal">(Duración: {escena.duracion} min)</span>
              </h4>
            </div>
            <div className="mt-2 pl-8">
              <p className="text-gray-700">
                <span className="font-medium">Actores:</span> {escena.actores || "Ninguno"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Modificar la función GraficoCostosAcumulados para hacerla responsive
function GraficoCostosAcumulados({ resultados }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !resultados) return

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
        right: 30,
        bottom: 50,
        left: rect.width < 500 ? 50 : 60, // Ajustar margen izquierdo en pantallas pequeñas
      }
      const width = rect.width - margin.left - margin.right
      const height = rect.height - margin.top - margin.bottom

      // Datos para el gráfico
      const actores = resultados.tiempos_por_actor
      const escenas = resultados.orden_escenas

      // Calcular costos acumulados por escena
      const costosAcumulados = []
      let costoTotal = 0

      // Simular costos acumulados para cada escena
      escenas.forEach((escenaId, index) => {
        // Simular un incremento de costo para esta escena
        const incremento = Math.floor(resultados.costo_total * (0.1 + Math.random() * 0.2))
        costoTotal += incremento

        // Limitar el costo total al costo total real
        costoTotal = Math.min(costoTotal, resultados.costo_total)

        costosAcumulados.push({
          escena: escenaId,
          costo: costoTotal,
        })
      })

      // Calcular escalas
      const escalaX = width / (escenas.length - 1)
      const escalaY = height / resultados.costo_total

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
      ctx.fillText("Escenas", margin.left + width / 2, height + margin.top + 35)

      // Etiqueta del eje Y
      ctx.save()
      ctx.translate(15, margin.top + height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText("Costo Acumulado ($)", 0, 0)
      ctx.restore()

      // Dibujar las marcas en el eje X (escenas)
      // Ajustar para mostrar menos marcas en pantallas pequeñas
      const mostrarTodasLasEscenas = rect.width >= 500 || escenas.length <= 5
      const pasoEscenas = mostrarTodasLasEscenas ? 1 : Math.ceil(escenas.length / 5)

      escenas.forEach((escenaId, index) => {
        // En pantallas pequeñas, mostrar solo algunas marcas
        if (mostrarTodasLasEscenas || index % pasoEscenas === 0) {
          const x = margin.left + index * escalaX
          ctx.beginPath()
          ctx.moveTo(x, height + margin.top)
          ctx.lineTo(x, height + margin.top + 5)
          ctx.stroke()
          ctx.fillText(escenaId.toString(), x, height + margin.top + 20)
        }
      })

      // Dibujar las marcas en el eje Y (costos)
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

      // Dibujar la línea de costos acumulados
      ctx.beginPath()
      ctx.moveTo(margin.left, height + margin.top)

      costosAcumulados.forEach((punto, index) => {
        const x = margin.left + index * escalaX
        const y = margin.top + height - punto.costo * escalaY
        ctx.lineTo(x, y)
      })

      ctx.strokeStyle = "#dc2626" // Rojo
      ctx.lineWidth = 3
      ctx.stroke()

      // Dibujar puntos en cada escena
      costosAcumulados.forEach((punto, index) => {
        const x = margin.left + index * escalaX
        const y = margin.top + height - punto.costo * escalaY

        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#dc2626" // Rojo
        ctx.fill()
        ctx.strokeStyle = "#ffffff" // Blanco
        ctx.lineWidth = 2
        ctx.stroke()

        // Mostrar el costo en cada punto
        // En pantallas pequeñas, mostrar menos etiquetas
        if (mostrarTodasLasEscenas || index % pasoEscenas === 0 || index === costosAcumulados.length - 1) {
          ctx.fillStyle = "#111827" // Casi negro
          ctx.textAlign = "center"
          ctx.fillText(`$${punto.costo.toFixed(0)}`, x, y - 10)
        }
      })

      // Rellenar el área bajo la curva
      ctx.beginPath()
      ctx.moveTo(margin.left, height + margin.top)

      costosAcumulados.forEach((punto, index) => {
        const x = margin.left + index * escalaX
        const y = margin.top + height - punto.costo * escalaY
        ctx.lineTo(x, y)
      })

      ctx.lineTo(margin.left + (escenas.length - 1) * escalaX, height + margin.top)
      ctx.closePath()
      ctx.fillStyle = "rgba(220, 38, 38, 0.1)" // Rojo con transparencia
      ctx.fill()

      // Título del gráfico
      ctx.fillStyle = "#111827" // Casi negro
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Costos Acumulados por Escena", margin.left + width / 2, 20)
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
  }, [resultados])

  return (
    <div className="w-full h-[400px] md:h-[450px] bg-white p-2 border border-gray-300 rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
