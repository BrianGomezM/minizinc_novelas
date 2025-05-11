import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanificadorBasico } from "@/components/planificador-basico"
import { PlanificadorAvanzado } from "@/components/planificador-avanzado"
import { ProcesadorArchivo } from "@/components/procesador-archivo"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <header className="bg-red-700 text-white py-4 md:py-6 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Planificador de Ensayos - "Desenfreno de Pasiones"
          </h1>
          <p className="text-center mt-2 text-gray-100 text-sm md:text-base">
            Programación por Restricciones - Escuela de Ingeniería de Sistemas y Computación
          </p>
        </div>
      </header>

      <main className="container mx-auto py-6 md:py-8 px-4">
        <Tabs defaultValue="procesador" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8">
            <TabsTrigger value="procesador" className="text-sm md:text-lg py-2 md:py-3">
              Procesador de Archivo
            </TabsTrigger>
            <TabsTrigger value="basico" className="text-sm md:text-lg py-2 md:py-3">
              Planificación Básica
            </TabsTrigger>
            <TabsTrigger value="avanzado" className="text-sm md:text-lg py-2 md:py-3">
              Restricciones Adicionales
            </TabsTrigger>
          </TabsList>
          <TabsContent value="procesador">
            <ProcesadorArchivo />
          </TabsContent>
          <TabsContent value="basico">
            <PlanificadorBasico />
          </TabsContent>
          <TabsContent value="avanzado">
            <PlanificadorAvanzado />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-gray-800 text-white py-4 mt-8 md:mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>Proyecto de Curso - Programación por Restricciones</p>
          <p className="text-sm mt-1">Facultad de Ingeniería - Marzo del 2025</p>
        </div>
      </footer>
    </div>
  )
}
