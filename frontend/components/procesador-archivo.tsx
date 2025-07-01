"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parseDznFile } from "@/lib/parser"
import { calcularEstadisticasDetalladas, simularCalculoDetallado } from "@/lib/calculator"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { VisualizacionAvanzada } from "@/components/visualizacion-avanzada"
import { ProgressSteps } from "@/components/progress-steps"

export function ProcesadorArchivo() {
  const [data, setData] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [calculoDetallado, setCalculoDetallado] = useState(null)
  const [resultados, setResultados] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [activeTab, setActiveTab] = useState("datos")

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith(".dzn")) {
      setError("Por favor, sube un archivo con formato .dzn")
      return
    }

    setFileName(file.name)
    setCurrentStep(1) // Cargando datos
    setLoading(true)
    setError("")

    try {
      const text = await file.text()
      const parsedData = parseDznFile(text)

      // Calcular estadísticas y estimaciones
      const stats = calcularEstadisticasDetalladas(parsedData)
      const calculo = simularCalculoDetallado(parsedData)

      setData(parsedData)
      setEstadisticas(stats)
      setCalculoDetallado(calculo)
      setCurrentStep(2) // Datos cargados
      setResultados(null)
      setActiveTab("datos") // Cambiar a la pestaña de datos
    } catch (err) {
      setError(`Error al procesar el archivo: ${err.message}`)
      setCurrentStep(0)
    } finally {
      setLoading(false)
    }
  }

  const procesarArchivo = async () => {
    if (!data) {
      setError("Primero debes cargar un archivo de datos")
      return
    }

    setLoading(true)
    setCurrentStep(3) // Procesando restricciones

    try {
      // Simulamos un procesamiento con tiempos para mostrar el progreso
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentStep(4) // Optimizando planificación

      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Aquí es donde se haría la llamada real al backend
      // Por ahora, usamos datos de ejemplo basados en el formato esperado
      const resultadosEjemplo = {
        orden_escenas: [1, 5, 2, 3, 4],
        costo_total: 138,
        tiempo_compartido_actores_evitar: 0,
        tiempos_por_actor: [
          {
            nombre: "Actor1",
            rango_escenas_inicio: 1,
            rango_escenas_fin: 4,
            unidades: 7,
            costo: 70,
          },
          {
            nombre: "Actor2",
            rango_escenas_inicio: 1,
            rango_escenas_fin: 3,
            unidades: 4,
            costo: 20,
          },
          {
            nombre: "Actor3",
            rango_escenas_inicio: 3,
            rango_escenas_fin: 5,
            unidades: 6,
            costo: 48,
          },
        ],
      }

      setResultados(resultadosEjemplo)
      setCurrentStep(5) // Visualizando resultados
      setActiveTab("resultados") // Cambiar a la pestaña de resultados
    } catch (err) {
      setError(`Error al procesar el archivo: ${err.message}`)
      setCurrentStep(2) // Volvemos al paso de datos cargados
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 md:gap-6">
      <Card className="border-gray-300 shadow-lg">
        <CardHeader className="bg-red-700 text-white rounded-t-lg">
          <CardTitle>Procesador de Archivo</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file-upload-processor">Archivo de datos (.dzn)</Label>
              <Input
                id="file-upload-processor"
                type="file"
                accept=".dzn"
                onChange={handleFileUpload}
                className="border-gray-300"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-600 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep > 0 && <ProgressSteps currentStep={currentStep} />}

            {data && estadisticas && (
              <div className="grid gap-2">
                <div className="p-3 md:p-4 bg-gray-100 rounded-md border border-gray-300">
                  <p className="font-medium">
                    Archivo cargado: <span className="text-red-700">{fileName}</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <div className="bg-white p-2 rounded border border-gray-200 text-center">
                      <p className="text-sm text-gray-600">Actores</p>
                      <p className="font-semibold">{data.actores.length}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 text-center">
                      <p className="text-sm text-gray-600">Escenas</p>
                      <p className="font-semibold">{data.escenas.length}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 text-center">
                      <p className="text-sm text-gray-600">Duración Total</p>
                      <p className="font-semibold">{estadisticas.duracion_total} min</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 text-center">
                      <p className="text-sm text-gray-600">Costo Estimado</p>
                      <p className="font-semibold">${estadisticas.costo_total_estimado}</p>
                    </div>
                  </div>
                </div>

                {/* Mostrar cálculo detallado */}
                {calculoDetallado && (
                  <div className="p-3 md:p-4 bg-blue-50 rounded-md border border-blue-300">
                    <h4 className="font-semibold text-blue-800 mb-2">Cálculo Estimado Detallado</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Secuencia estimada: [{calculoDetallado.secuencia.join(", ")}]
                    </p>
                    <div className="space-y-2">
                      {calculoDetallado.actores.map((actor, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{actor.nombre}:</span>
                          {actor.escenas_participadas.length > 0 ? (
                            <span className="ml-2">
                              Escenas {actor.escenas_participadas.join(", ")} → Tiempo: {actor.tiempo_total} min →
                              Costo: ${actor.costo}
                            </span>
                          ) : (
                            <span className="ml-2 text-gray-600">No participa</span>
                          )}
                        </div>
                      ))}
                      <div className="font-semibold text-blue-800 pt-2 border-t border-blue-200">
                        Costo Total Estimado: ${calculoDetallado.costo_total}
                      </div>
                    </div>
                  </div>
                )}

                {!resultados && (
                  <Button
                    onClick={procesarArchivo}
                    disabled={loading || currentStep > 2}
                    className="bg-red-700 hover:bg-red-800 text-white mt-2"
                  >
                    {loading ? "Procesando..." : "Procesar Archivo"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card className="border-gray-300 shadow-lg">
          <CardHeader className="bg-red-700 text-white rounded-t-lg">
            <CardTitle>Información del Archivo</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
                <TabsTrigger value="datos" className="text-sm md:text-lg py-2 md:py-3">
                  Datos del Archivo
                </TabsTrigger>
                <TabsTrigger value="resultados" className="text-sm md:text-lg py-2 md:py-3" disabled={!resultados}>
                  Resultados de la Planificación
                </TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="mt-0">
                <VisualizacionDatosArchivo data={data} estadisticas={estadisticas} />
              </TabsContent>

              <TabsContent value="resultados" className="mt-0">
                {resultados ? (
                  <VisualizacionAvanzada resultados={resultados} data={data} />
                ) : (
                  <div className="p-6 md:p-8 text-center bg-gray-50 border border-gray-300 rounded-md">
                    <p className="text-gray-600">Procesa el archivo para ver los resultados de la planificación.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
