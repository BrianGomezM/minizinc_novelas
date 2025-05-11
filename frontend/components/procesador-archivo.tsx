"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parseDznFile } from "@/lib/parser"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { VisualizacionAvanzada } from "@/components/visualizacion-avanzada"
import { ProgressSteps } from "@/components/progress-steps"

export function ProcesadorArchivo() {
  const [data, setData] = useState(null)
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
      setData(parsedData)
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

      // Usamos los datos de ejemplo proporcionados
      const resultadosEjemplo = {
        orden_escenas: [1, 4, 3, 2, 5],
        costo_total: 150,
        tiempos_por_actor: [
          {
            nombre: "Actor1",
            tiempo: 8,
            costo: 80,
          },
          {
            nombre: "Actor2",
            tiempo: 6,
            costo: 30,
          },
          {
            nombre: "Actor3",
            tiempo: 5,
            costo: 40,
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

            {data && (
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
                      <p className="font-semibold">
                        {data.escenas.reduce((sum, escena) => sum + escena.duracion, 0)} min
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 text-center">
                      <p className="text-sm text-gray-600">Costo Máx. Actor</p>
                      <p className="font-semibold">${Math.max(...data.actores.map((a) => a.costoPorMinuto))}</p>
                    </div>
                  </div>
                </div>

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
                <VisualizacionDatosArchivo data={data} />
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
