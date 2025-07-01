"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SolucionParte1, ParsedData, Actor, Escena, DatosOriginales } from "@/components/procesador-archivo-parte1";

export function VisualizacionDatosArchivo({ data, estadisticas, solucion }: { data: ParsedData, estadisticas?: any, solucion?: SolucionParte1 }) {
  if (!data) return null

  const { actores, escenas, datosOriginales } = data
  const { participacion, costos, duraciones } = datosOriginales

  // Determinar el orden de las escenas a usar
  const ordenEscenas = solucion?.ordenEscenas || escenas.map(e => e.id);

  // Si hay solución, mostramos solo la matriz ordenada
  if (solucion) {
    return (
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[600px]">
          <Table className="border-collapse border border-gray-300">
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="border border-gray-300 font-bold text-center">Actor / Escena</TableHead>
                {ordenEscenas.map((escenaId: number) => {
                  const escena = data.escenas.find((e: Escena) => e.id === escenaId);
                  return escena ? (
                    <TableHead key={escena.id} className="border border-gray-300 text-center font-bold">
                      {escena.id}
                      <div className="text-xs font-normal">{escena.duracion} min</div>
                    </TableHead>
                  ) : null;
                })}
                <TableHead className="border border-gray-300 text-center font-bold">Costo/min</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {data.actores.map((actor: Actor, actorIndex: number) => (
                <TableRow key={actor.id} className={actorIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="border border-gray-300 font-medium">{actor.nombre}</TableCell>
                  {ordenEscenas.map((escenaId: number) => {
                    const originalEscenaIndex = data.escenas.findIndex((e: Escena) => e.id === escenaId);
                    const participa = data.datosOriginales.participacion[actorIndex]?.[originalEscenaIndex];
                    return (
                      <TableCell
                        key={escenaId}
                        className={`border border-gray-300 text-center ${participa === 1 ? "bg-red-100" : ""}`}
                      >
                        {participa === 1 ? "✓" : ""}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border border-gray-300 text-center font-semibold">
                    ${actor.costoPorMinuto}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-100">
                <TableCell className="border border-gray-300 font-bold">Duración</TableCell>
                {ordenEscenas.map((escenaId: number) => {
                  const originalEscena = data.escenas.find((e: Escena) => e.id === escenaId);
                  const duracion = originalEscena?.duracion;
                  return duracion !== undefined ? (
                    <TableCell key={escenaId} className="border border-gray-300 text-center font-semibold">
                      {duracion}
                    </TableCell>
                  ) : null;
                })}
                <TableCell className="border border-gray-300"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Si no hay solución, mostramos las pestañas originales
  return (
    <div>
      {/* Mostrar estadísticas si están disponibles */}
      {estadisticas && (
        <Card className="mb-6 border-blue-300">
          <CardHeader className="bg-blue-100">
            <CardTitle className="text-blue-800">Estadísticas del Archivo</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">Información General</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Duración Total:</div>
                  <div className="font-semibold">{estadisticas.duracion_total} min</div>
                  <div>Costo Estimado:</div>
                  <div className="font-semibold text-blue-700">${estadisticas.costo_total_estimado}</div>
                </div>
              </div>

              {estadisticas.estadisticas && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">Estadísticas Detalladas</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Costo Máx. Actor:</div>
                    <div className="font-semibold">${estadisticas.estadisticas.actores.costo_maximo}</div>
                    <div>Costo Min. Actor:</div>
                    <div className="font-semibold">${estadisticas.estadisticas.actores.costo_minimo}</div>
                    <div>Duración Máx. Escena:</div>
                    <div className="font-semibold">{estadisticas.estadisticas.escenas.duracion_maxima} min</div>
                    <div>Participación Promedio:</div>
                    <div className="font-semibold">
                      {estadisticas.estadisticas.actores.participacion_promedio} escenas
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="matriz" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="matriz">Matriz de Participación</TabsTrigger>
          <TabsTrigger value="actores">Actores</TabsTrigger>
          <TabsTrigger value="escenas">Escenas</TabsTrigger>
        </TabsList>

        <TabsContent value="matriz">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              <Table className="border-collapse border border-gray-300">
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="border border-gray-300 font-bold text-center">Actor / Escena</TableHead>
                    {escenas.map((escena: Escena) => (
                      <TableHead key={escena.id} className="border border-gray-300 text-center font-bold">
                        {escena.id}
                        <div className="text-xs font-normal">{escena.duracion} min</div>
                      </TableHead>
                    ))}
                    <TableHead className="border border-gray-300 text-center font-bold">Costo/min</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-center">
                  {actores.map((actor: Actor, index: number) => (
                    <TableRow key={actor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="border border-gray-300 font-medium">{actor.nombre}</TableCell>
                      {participacion[index]?.map((participa: number, escenaIndex: number) => (
                        <TableCell
                          key={escenaIndex}
                          className={`border border-gray-300 text-center ${participa === 1 ? "bg-red-100" : ""}`}
                        >
                          {participa === 1 ? "✓" : ""}
                        </TableCell>
                      ))}
                      <TableCell className="border border-gray-300 text-center font-semibold">
                        ${actor.costoPorMinuto}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-100">
                    <TableCell className="border border-gray-300 font-bold">Duración</TableCell>
                    {duraciones.map((duracion: number, index: number) => (
                      <TableCell key={index} className="border border-gray-300 text-center font-semibold">
                        {duracion}
                      </TableCell>
                    ))}
                    <TableCell className="border border-gray-300"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actores">
          <div className="overflow-x-auto pb-2">
            <Table>
              <TableHeader className="bg-gray-200">
                <TableRow>
                  <TableHead className="font-bold text-center">ID</TableHead>
                  <TableHead className="font-bold text-center">Nombre</TableHead>
                  <TableHead className="font-bold text-center">Costo por Minuto</TableHead>
                  <TableHead className="font-bold text-center">Escenas</TableHead>
                  <TableHead className="font-bold text-center">Total Participaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                {actores.map((actor: Actor, index: number) => {
                  // Encontrar las escenas en las que participa este actor
                  const escenasActor = escenas
                    .filter((escena: Escena) => escena.actoresParticipantes.includes(actor.id))
                    .map((escena: Escena) => escena.id)

                  return (
                    <TableRow key={actor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell>{actor.id}</TableCell>
                      <TableCell className="font-medium">{actor.nombre}</TableCell>
                      <TableCell>${actor.costoPorMinuto}</TableCell>
                      <TableCell>{escenasActor.join(", ")}</TableCell>
                      <TableCell className="text-center font-semibold">{escenasActor.length}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="escenas">
          <div className="overflow-x-auto pb-2">
            <Table>
              <TableHeader className="bg-gray-200">
                <TableRow>
                  <TableHead className="font-bold text-center">ID</TableHead>
                  <TableHead className="font-bold text-center">Nombre</TableHead>
                  <TableHead className="font-bold text-center">Duración</TableHead>
                  <TableHead className="font-bold text-center">Actores</TableHead>
                  <TableHead className="font-bold text-center">Costo Total Escena</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                {escenas.map((escena: Escena, index: number) => {
                  // Encontrar los nombres de los actores que participan en esta escena
                  const actoresEnEscena = actores.filter((actor: Actor) => escena.actoresParticipantes.includes(actor.id));

                  const nombresActores = actoresEnEscena.map((actor: Actor) => actor.nombre).join(", ")

                  // Calcular costo total de la escena (suma de costos por minuto × duración)
                  const costoTotalEscena = actoresEnEscena.reduce(
                    (sum: number, actor: Actor) => sum + (actor.costoPorMinuto || 0) * escena.duracion,
                    0,
                  )

                  return (
                    <TableRow key={escena.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell>{escena.id}</TableCell>
                      <TableCell className="font-medium">Escena {escena.id} {/* Corregido: usar ID de escena */}</TableCell>
                      <TableCell>{escena.duracion} min</TableCell>
                      <TableCell>{nombresActores}</TableCell>
                      <TableCell className="font-semibold text-red-700">${costoTotalEscena}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
