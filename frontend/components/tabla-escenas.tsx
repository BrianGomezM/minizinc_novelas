"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TablaEscenas({ escenas, data }) {
  if (!escenas || !data) return null

  return (
    <div className="border rounded-md overflow-hidden border-gray-300">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead className="w-[80px] font-bold">Orden</TableHead>
              <TableHead className="font-bold">Escena</TableHead>
              <TableHead className="font-bold">Duración (min)</TableHead>
              <TableHead className="font-bold">Actores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escenas.map((escenaId, index) => {
              const escena = data.escenas.find((e) => e.id === escenaId)
              const actoresEnEscena = data.actores.filter((actor) => escena.actoresParticipantes.includes(actor.id))

              return (
                <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{escena.nombre || `Escena ${escenaId}`}</TableCell>
                  <TableCell>{escena.duracion}</TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={actoresEnEscena.map((actor) => actor.nombre).join(", ")}
                  >
                    {actoresEnEscena.map((actor) => actor.nombre).join(", ")}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
