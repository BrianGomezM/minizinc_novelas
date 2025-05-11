"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function VisualizacionDatosArchivo({ data }) {
  if (!data) return null

  const { actores, escenas, datosOriginales } = data
  const { participacion, costos, duraciones } = datosOriginales

  return (
    <div>
      <Tabs defaultValue="matriz" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="matriz">Matriz de Participación</TabsTrigger>
          <TabsTrigger value="actores">Actores</TabsTrigger>
          <TabsTrigger value="escenas">Escenas</TabsTrigger>
        </TabsList>

        <TabsContent value="matriz">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              {" "}
              {/* Ancho mínimo para evitar que la tabla se comprima demasiado */}
              <Table className="border-collapse border border-gray-300">
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="border border-gray-300 font-bold">Actor / Escena</TableHead>
                    {escenas.map((escena) => (
                      <TableHead key={escena.id} className="border border-gray-300 text-center font-bold">
                        {escena.id}
                        <div className="text-xs font-normal">{escena.duracion} min</div>
                      </TableHead>
                    ))}
                    <TableHead className="border border-gray-300 text-center font-bold">Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actores.map((actor, index) => (
                    <TableRow key={actor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="border border-gray-300 font-medium">{actor.nombre}</TableCell>
                      {participacion[index]?.map((participa, escenaIndex) => (
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
                    {duraciones.map((duracion, index) => (
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
                  <TableHead className="font-bold">ID</TableHead>
                  <TableHead className="font-bold">Nombre</TableHead>
                  <TableHead className="font-bold">Costo por Minuto</TableHead>
                  <TableHead className="font-bold">Escenas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actores.map((actor, index) => {
                  // Encontrar las escenas en las que participa este actor
                  const escenasActor = escenas
                    .filter((escena) => escena.actoresParticipantes.includes(actor.id))
                    .map((escena) => escena.id)
                    .join(", ")

                  return (
                    <TableRow key={actor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell>{actor.id}</TableCell>
                      <TableCell className="font-medium">{actor.nombre}</TableCell>
                      <TableCell>${actor.costoPorMinuto}</TableCell>
                      <TableCell>{escenasActor}</TableCell>
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
                  <TableHead className="font-bold">ID</TableHead>
                  <TableHead className="font-bold">Nombre</TableHead>
                  <TableHead className="font-bold">Duración</TableHead>
                  <TableHead className="font-bold">Actores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escenas.map((escena, index) => {
                  // Encontrar los nombres de los actores que participan en esta escena
                  const nombresActores = escena.actoresParticipantes
                    .map((actorId) => actores.find((a) => a.id === actorId)?.nombre)
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <TableRow key={escena.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell>{escena.id}</TableCell>
                      <TableCell className="font-medium">{escena.nombre}</TableCell>
                      <TableCell>{escena.duracion} min</TableCell>
                      <TableCell>{nombresActores}</TableCell>
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
