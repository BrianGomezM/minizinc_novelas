"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function TablaRestriccionesActores({ actores, restricciones, toggleRestriccion, restriccionesArchivo = [] }) {
  if (!actores || actores.length <= 1)
    return <p>No hay suficientes actores para definir restricciones de coincidencia</p>

  const tieneRestriccion = (id1, id2) => {
    return restricciones.some((r) => (r[0] === id1 && r[1] === id2) || (r[0] === id2 && r[1] === id1))
  }

  // Verificar si una restricción viene del archivo
  const esRestriccionArchivo = (id1, id2) => {
    return restriccionesArchivo.some(
      (r) => (r.actor1Id === id1 && r.actor2Id === id2) || (r.actor1Id === id2 && r.actor2Id === id1),
    )
  }

  return (
    <div className="border rounded-md overflow-auto border-gray-300">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[600px]">
          {" "}
          {/* Ancho mínimo para evitar que la tabla se comprima demasiado */}
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="w-[150px] font-bold">Actor</TableHead>
                {actores.map((actor) => (
                  <TableHead key={actor.id} className="text-center w-[80px] font-bold">
                    {actor.nombre.split(" ")[0]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actores.map((actor1, index1) => (
                <TableRow key={actor1.id} className={index1 % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="font-medium">{actor1.nombre}</TableCell>
                  {actores.map((actor2, index2) => (
                    <TableCell key={actor2.id} className="text-center">
                      {index1 !== index2 ? (
                        <div className="flex flex-col items-center">
                          <Checkbox
                            checked={tieneRestriccion(actor1.id, actor2.id)}
                            onCheckedChange={() => toggleRestriccion(actor1.id, actor2.id)}
                            className="border-red-700 text-red-700"
                          />
                          {esRestriccionArchivo(actor1.id, actor2.id) && (
                            <Badge className="mt-1 text-[10px] py-0 px-1 bg-purple-100 text-purple-800 border-purple-300">
                              Archivo
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
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
  )
}
