"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseDznFile } from "@/lib/parser"
import { optimizarPlanificacion } from "@/lib/solver"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { ResultadoPlanificacion } from "@/components/resultado-planificacion"

export function PlanificadorBasico() {
  const [data, setData] = useState(null)
  const [solucion, setSolucion] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith(".dzn")) {
      setError("Por favor, sube un archivo con formato .dzn")
      return
    }

    setFileName(file.name)
    setLoading(true)
    setError("")

    try {
      const text = await file.text()
      const parsedData = parseDznFile(text)
      setData(parsedData)
      setSolucion(null)
    } catch (err) {
      setError(`Error al procesar el archivo: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calcularSolucion = () => {
    if (!data) {
      setError("Primero debes cargar un archivo de datos")
      return
    }

    setLoading(true)
    try {
      const resultado = optimizarPlanificacion(data)
      setSolucion(resultado)
      setError("")
    } catch (err) {
      setError(`Error al calcular la solución: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="border-gray-300 shadow-lg">
        <CardHeader className="bg-red-700 text-white rounded-t-lg">
          <CardTitle>Cargar Datos</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file-upload">Archivo de datos (.dzn)</Label>
              <Input
                id="file-upload"
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

            {data && (
              <div className="grid gap-2">
                <div className="p-4 bg-gray-100 rounded-md border border-gray-300">
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
                <Button
                  onClick={calcularSolucion}
                  disabled={loading}
                  className="bg-red-700 hover:bg-red-800 text-white mt-2"
                >
                  {loading ? "Calculando..." : "Calcular Planificación Óptima"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data && <VisualizacionDatosArchivo data={data} />}

      {solucion && <ResultadoPlanificacion solucion={solucion} data={data} />}
    </div>
  )
}
