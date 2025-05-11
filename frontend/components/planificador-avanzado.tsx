"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { parseDznFile } from "@/lib/parser"
import { optimizarPlanificacionAvanzada } from "@/lib/solver"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { ResultadoPlanificacion } from "@/components/resultado-planificacion"
import { TablaRestriccionesActores } from "@/components/tabla-restricciones-actores"

export function PlanificadorAvanzado() {
  const [data, setData] = useState(null)
  const [solucion, setSolucion] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [eliminarSimetrias, setEliminarSimetrias] = useState(true)
  const [restriccionesActores, setRestriccionesActores] = useState([])
  const [restriccionesCoincidencia, setRestriccionesCoincidencia] = useState([])
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

      // Inicializar restricciones de actores
      const restriccionesIniciales = parsedData.actores.map((actor) => ({
        id: actor.id,
        nombre: actor.nombre,
        tiempoMaximo: null,
        evitarCoincidenciaCon: [],
      }))

      setRestriccionesActores(restriccionesIniciales)
      setSolucion(null)
    } catch (err) {
      setError(`Error al procesar el archivo: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const actualizarTiempoMaximo = (actorId, tiempo) => {
    setRestriccionesActores((prev) =>
      prev.map((actor) =>
        actor.id === actorId ? { ...actor, tiempoMaximo: tiempo ? Number.parseInt(tiempo) : null } : actor,
      ),
    )
  }

  const toggleEvitarCoincidencia = (actorId1, actorId2) => {
    setRestriccionesCoincidencia((prev) => {
      const existeRestriccion = prev.some(
        (r) => (r[0] === actorId1 && r[1] === actorId2) || (r[0] === actorId2 && r[1] === actorId1),
      )

      if (existeRestriccion) {
        return prev.filter(
          (r) => !((r[0] === actorId1 && r[1] === actorId2) || (r[0] === actorId2 && r[1] === actorId1)),
        )
      } else {
        return [...prev, [actorId1, actorId2]]
      }
    })
  }

  const calcularSolucion = () => {
    if (!data) {
      setError("Primero debes cargar un archivo de datos")
      return
    }

    setLoading(true)
    try {
      const resultado = optimizarPlanificacionAvanzada(
        data,
        eliminarSimetrias,
        restriccionesActores,
        restriccionesCoincidencia,
      )
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
              <Label htmlFor="file-upload-avanzado">Archivo de datos (.dzn)</Label>
              <Input
                id="file-upload-avanzado"
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data && <VisualizacionDatosArchivo data={data} />}

      {data && (
        <Card className="border-gray-300 shadow-lg">
          <CardHeader className="bg-red-700 text-white rounded-t-lg">
            <CardTitle>Restricciones Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-md border border-gray-300">
                <Checkbox
                  id="eliminar-simetrias"
                  checked={eliminarSimetrias}
                  onCheckedChange={setEliminarSimetrias}
                  className="border-red-700 text-red-700"
                />
                <Label htmlFor="eliminar-simetrias">Eliminar simetrías para optimizar la solución</Label>
              </div>

              <div className="p-4 bg-gray-50 rounded-md border border-gray-300">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Disponibilidad de Actores</h3>
                <div className="grid gap-4">
                  {restriccionesActores.map((actor) => (
                    <div key={actor.id} className="grid grid-cols-2 gap-4 items-center">
                      <Label htmlFor={`tiempo-max-${actor.id}`} className="font-medium">
                        {actor.nombre}
                      </Label>
                      <Input
                        id={`tiempo-max-${actor.id}`}
                        type="number"
                        placeholder="Tiempo máximo (minutos)"
                        value={actor.tiempoMaximo || ""}
                        onChange={(e) => actualizarTiempoMaximo(actor.id, e.target.value)}
                        className="border-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md border border-gray-300">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Evitar Coincidencias entre Actores</h3>
                <TablaRestriccionesActores
                  actores={data.actores}
                  restricciones={restriccionesCoincidencia}
                  toggleRestriccion={toggleEvitarCoincidencia}
                />
              </div>

              <Button onClick={calcularSolucion} disabled={loading} className="bg-red-700 hover:bg-red-800 text-white">
                {loading ? "Calculando..." : "Calcular Planificación con Restricciones"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {solucion && <ResultadoPlanificacion solucion={solucion} data={data} />}
    </div>
  )
}
