"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TablaCostos({ solucion, data }) {
  if (!solucion || !data) return null

  return (
    <div className="border rounded-md overflow-hidden border-gray-300">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead className="font-bold">Actor</TableHead>
              <TableHead className="font-bold">Tiempo en Set (min)</TableHead>
              <TableHead className="font-bold">Costo por Min</TableHead>
              <TableHead className="font-bold">Costo Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solucion.costosActores.map((costo, index) => {
              const actor = data.actores.find((a) => a.id === costo.actorId)
              return (
                <TableRow key={actor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="font-medium max-w-[150px] truncate" title={actor.nombre}>
                    {actor.nombre}
                  </TableCell>
                  <TableCell>{costo.tiempoTotal}</TableCell>
                  <TableCell>${actor.costoPorMinuto.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-red-700">${costo.costoTotal.toFixed(2)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
