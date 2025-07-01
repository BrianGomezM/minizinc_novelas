"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface Actor {
  id: number;
  nombre: string;
  costoPorMinuto?: number;
}

interface Escena {
  id: number;
  duracion: number;
  actoresParticipantes: number[];
}

interface DatosOriginales {
  participacion: number[][];
  costos: number[];
  duraciones: number[];
  disponibilidad: number[];
  evitar_pares: number[][];
}

interface Data {
  actores: Actor[];
  escenas: Escena[];
  datosOriginales: DatosOriginales;
}

interface RestriccionActor {
  id: number;
  nombre: string;
  tiempoMaximo: number;
  evitarCoincidenciaCon: number[];
}

interface RestriccionArchivoDisponibilidad {
  actorId: number;
  nombre: string;
  tiempoMaximo: number;
}

interface RestriccionArchivoEvitar {
  actor1Id: number;
  actor1Nombre: string;
  actor2Id: number;
  actor2Nombre: string;
}

interface RestriccionesArchivo {
  disponibilidad: RestriccionArchivoDisponibilidad[];
  evitar: RestriccionArchivoEvitar[];
}

interface MatrizRestriccionesProps {
  data: Data;
  restriccionesActores: RestriccionActor[];
  restriccionesCoincidencia: number[][];
  restriccionesArchivo: RestriccionesArchivo;
  toggleEvitarCoincidencia: (actorId1: number, actorId2: number) => void;
}

export function MatrizRestricciones({
  data,
  restriccionesActores,
  restriccionesCoincidencia,
  restriccionesArchivo,
  toggleEvitarCoincidencia,
}: MatrizRestriccionesProps) {
  if (!data) return null

  const tieneRestriccion = (id1: number, id2: number): boolean => {
    return restriccionesCoincidencia.some((r) => (r[0] === id1 && r[1] === id2) || (r[0] === id2 && r[1] === id1))
  }

  // Verificar si una restricción viene del archivo
  const esRestriccionArchivo = (id1: number, id2: number): boolean => {
    return restriccionesArchivo.evitar.some(
      (r) => (r.actor1Id === id1 && r.actor2Id === id2) || (r.actor1Id === id2 && r.actor2Id === id1),
    )
  }

  return (
    <div>
      <Tabs defaultValue="disponibilidad" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="disponibilidad">Disponibilidad de Actores</TabsTrigger>
          <TabsTrigger value="coincidencias">Evitar Coincidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibilidad">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Disponibilidad de Actores</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tiempo máximo que cada actor puede estar en el set (valores del archivo, solo lectura).
            </p>

            <div className="overflow-x-auto pb-2">
              <Table>
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="font-bold text-center">Actor</TableHead>
                    <TableHead className="font-bold text-center">Tiempo Máximo (min)</TableHead>
                    <TableHead className="font-bold text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restriccionesActores.map((actor, index) => {
                    const restriccionArchivo = restriccionesArchivo.disponibilidad.find((r) => r.actorId === actor.id)

                    return (
                      <TableRow key={actor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell className="font-medium text-center">{actor.nombre}</TableCell>
                        <TableCell className="font-medium text-center">{actor.tiempoMaximo || 0}</TableCell>
                        <TableCell className="text-center">
                          {actor.tiempoMaximo > 0 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Disponible ({actor.tiempoMaximo} min)
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">Sin restricción</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="coincidencias">
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Matriz de Restricciones de Coincidencia</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona las parejas de actores que no deben coincidir en el set. Las restricciones marcadas con
              "Archivo" provienen del archivo .dzn.
            </p>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[600px]">
                <Table className="border-collapse border border-gray-300">
                  <TableHeader className="bg-gray-200">
                    <TableRow>
                      <TableHead className="border border-gray-300 font-bold">Actor</TableHead>
                      {data.actores.map((actor) => (
                        <TableHead key={actor.id} className="border border-gray-300 text-center font-bold">
                          {actor.nombre}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.actores.map((actor1, index1) => (
                      <TableRow key={actor1.id} className={index1 % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell className="border border-gray-300 font-medium">{actor1.nombre}</TableCell>
                        {data.actores.map((actor2, index2) => (
                          <TableCell
                            key={actor2.id}
                            className={`border border-gray-300 text-center ${index1 !== index2 && tieneRestriccion(actor1.id, actor2.id) ? "bg-red-100" : ""}`}
                          >
                            {index1 !== index2 ? (
                              tieneRestriccion(actor1.id, actor2.id) ? "X" : ""
                            ) : (
                              null
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
