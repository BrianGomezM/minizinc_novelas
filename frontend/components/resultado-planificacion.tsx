"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablaEscenas } from "@/components/tabla-escenas"
import { TablaCostos } from "@/components/tabla-costos"
import { GraficoParticipacion } from "@/components/grafico-participacion"
import { Badge } from "@/components/ui/badge"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { SolucionParte1, ParsedData, Actor } from "@/components/procesador-archivo-parte1"
import { SolucionParte2} from "@/components/procesador-archivo-parte2"

export function ResultadoPlanificacion({ solucion, data }: { solucion: SolucionParte1, data: ParsedData }) {
  if (!solucion || !data) return null

  // Calcular estadísticas
  const tiempoTotal = solucion.ordenEscenas.reduce((total: number, escenaId: number) => {
    const escena = data.escenas.find((e: any) => e.id === escenaId)
    return total + (escena?.duracion || 0)
  }, 0)

  const costoPromedioPorActor =
    (solucion.costosActores.reduce((sum: number, costo: any) => sum + costo.costoTotal, 0) / solucion.costosActores.length) || 0

  const actorMasCostoso = solucion.costosActores.reduce(
    (max: { actorId: number; tiempoTotal: number; costoTotal: number }, costo: { actorId: number; tiempoTotal: number; costoTotal: number }) => (costo.costoTotal > max.costoTotal ? costo : max),
    { actorId: -1, tiempoTotal: 0, costoTotal: 0 },
  )

  const nombreActorMasCostoso = data.actores.find((a: Actor) => a.id === actorMasCostoso.actorId)?.nombre || "Desconocido"

  return (
    <div className="grid gap-6">
      <Card className="border-gray-300 shadow-lg">
        <CardHeader className="bg-red-700 text-white rounded-t-lg">
          <CardTitle>Resultados de la Planificación</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="p-4 sm:p-6 border border-red-200 rounded-md bg-red-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left w-full md:w-auto">
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Costo Total</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-red-800">${solucion.costoTotal.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Tiempo Total</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-800">{tiempoTotal} min</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Costo Promedio</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-800">
                      ${costoPromedioPorActor.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Actor más costoso</p>
                    <p
                      className="text-lg sm:text-xl font-semibold text-gray-800 truncate"
                      title={nombreActorMasCostoso}
                    >
                      {nombreActorMasCostoso}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="orden" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="orden">Orden de Escenas</TabsTrigger>
                <TabsTrigger value="costos">Costos por Actor</TabsTrigger>
                <TabsTrigger value="grafico">Participación</TabsTrigger>
              </TabsList>

              <TabsContent value="orden">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Secuencia Óptima de Escenas</h3>

                  <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                    {solucion.ordenEscenas.map((escenaId: number, index: number) => {
                      const escena = data.escenas.find((e: any) => e.id === escenaId)
                      return (
                        <Badge key={index} className="bg-red-700 hover:bg-red-800 text-base py-1 px-3">
                          {escenaId} <span className="text-xs ml-1">({escena?.duracion || 0} min)</span>
                        </Badge>
                      )
                    })}
                  </div>

                  <div className="overflow-x-auto">
                    <TablaEscenas escenas={solucion.ordenEscenas} data={data} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="costos">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Desglose de Costos por Actor</h3>
                  <div className="overflow-x-auto">
                    <TablaCostos solucion={solucion} data={data} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grafico">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Matriz de Participación Ordenada
                  </h3>
                  <VisualizacionDatosArchivo data={data} solucion={solucion} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ResultadoPlanificacion2({ solucion, data }: { solucion: SolucionParte2, data: ParsedData }) {
  if (!solucion || !data) return null

  // Calcular estadísticas
  const tiempoTotal = solucion.ordenEscenas.reduce((total: number, escenaId: number) => {
    const escena = data.escenas.find((e: any) => e.id === escenaId)
    return total + (escena?.duracion || 0)
  }, 0)

  const costoPromedioPorActor =
    (solucion.costosActores.reduce((sum: number, costo: any) => sum + costo.costoTotal, 0) / solucion.costosActores.length) || 0

  const actorMasCostoso = solucion.costosActores.reduce(
    (max: { actorId: number; tiempoTotal: number; costoTotal: number }, costo: { actorId: number; tiempoTotal: number; costoTotal: number }) => (costo.costoTotal > max.costoTotal ? costo : max),
    { actorId: -1, tiempoTotal: 0, costoTotal: 0 },
  )

  const nombreActorMasCostoso = data.actores.find((a: Actor) => a.id === actorMasCostoso.actorId)?.nombre || "Desconocido"

  const tiempo_compartido_actores_evitar = solucion.tiempo_compartido_actores_evitar || 0;

  return (
    <div className="grid gap-6">
      <Card className="border-gray-300 shadow-lg">
        <CardHeader className="bg-red-700 text-white rounded-t-lg">
          <CardTitle>Resultados de la Planificación</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="p-4 sm:p-6 border border-red-200 rounded-md bg-red-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left w-full md:w-auto">
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Costo Total</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-red-800">${solucion.costoTotal.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Tiempo Total</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-800">{tiempoTotal} min</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Costo Promedio</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-800">
                      ${costoPromedioPorActor.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Actor más costoso</p>
                    <p
                      className="text-lg sm:text-xl font-semibold text-gray-800 truncate"
                      title={nombreActorMasCostoso}
                    >
                      {nombreActorMasCostoso}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-300 text-center">
                    <p className="text-sm text-gray-600">Tiempo compartido (EVITAR)</p>
                    <p
                      className="text-lg sm:text-xl font-semibold text-gray-800 truncate"
                      title={tiempo_compartido_actores_evitar.toString()}
                    >
                      {tiempo_compartido_actores_evitar} min
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="orden" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="orden">Orden de Escenas</TabsTrigger>
                <TabsTrigger value="costos">Costos por Actor</TabsTrigger>
                <TabsTrigger value="grafico">Participación</TabsTrigger>
              </TabsList>

              <TabsContent value="orden">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Secuencia Óptima de Escenas</h3>

                  <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                    {solucion.ordenEscenas.map((escenaId: number, index: number) => {
                      const escena = data.escenas.find((e: any) => e.id === escenaId)
                      return (
                        <Badge key={index} className="bg-red-700 hover:bg-red-800 text-base py-1 px-3">
                          {escenaId} <span className="text-xs ml-1">({escena?.duracion || 0} min)</span>
                        </Badge>
                      )
                    })}
                  </div>

                  <div className="overflow-x-auto">
                    <TablaEscenas escenas={solucion.ordenEscenas} data={data} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="costos">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Desglose de Costos por Actor</h3>
                  <div className="overflow-x-auto">
                    <TablaCostos solucion={solucion} data={data} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grafico">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Matriz de Participación Ordenada
                  </h3>
                  <VisualizacionDatosArchivo data={data} solucion={solucion} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
