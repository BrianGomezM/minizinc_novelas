"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { parseDznFile } from "@/lib/parser"
import { calcularCostoInicial, simularRespuestaParte2, procesarArchivoParte2 } from "@/lib/api-client"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { ResultadoPlanificacion2 } from "@/components/resultado-planificacion"
import { MatrizRestricciones } from "@/components/matriz-restricciones"
import { ProgressSteps } from "@/components/progress-steps"

// Definición de interfaces
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

interface ParsedData {
  actores: Actor[];
  escenas: Escena[];
  datosOriginales: DatosOriginales;
}

interface RestriccionActor {
  id: number;
  nombre: string;
  tiempoMaximo: number;
  evitarCoincidenciaCon: number[]; // Aunque no se use directamente para pasar al back, es parte del estado local
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

interface CostoInicial {
  costoEstimado: number;
  duracionTotal: number;
}

export interface SolucionParte2 {
  ordenEscenas: number[];
  costoTotal: number;
  costosActores: { actorId: number; tiempoTotal: number; costoTotal: number }[];
  tiempo_compartido_actores_evitar: number;
  // Añadir otros campos si el endpoint de la parte 2 devuelve más datos relevantes para la UI
}

export function ProcesadorArchivoParte2() {
  const [data, setData] = useState<ParsedData | null>(null)
  const [solucion, setSolucion] = useState<SolucionParte2 | null>(null)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [fileName, setFileName] = useState<string>("")
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>("datos")
  const [costoInicial, setCostoInicial] = useState<CostoInicial | null>(null)
  const [archivoOriginal, setArchivoOriginal] = useState<File | null>(null)
  const [restriccionesActores, setRestriccionesActores] = useState<RestriccionActor[]>([])
  const [restriccionesCoincidencia, setRestriccionesCoincidencia] = useState<number[][]>([])
  const [restriccionesArchivo, setRestriccionesArchivo] = useState<RestriccionesArchivo>({
    disponibilidad: [],
    evitar: [],
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limpiar datos y resultados anteriores
    setData(null);
    setSolucion(null);
    setRestriccionesActores([]);
    setRestriccionesCoincidencia([]);
    setRestriccionesArchivo({
      disponibilidad: [],
      evitar: [],
    });
    setCostoInicial(null);

    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".dzn")) {
      setError("Por favor, sube un archivo con formato .dzn")
      return
    }

    setFileName(file.name)
    setArchivoOriginal(file)
    setCurrentStep(1) // Cargando datos
    setLoading(true)
    setError("")

    try {
      const text = await file.text()
      const parsedData = parseDznFile(text) as ParsedData; // Cast to ParsedData

      // Validar secciones obligatorias para Parte 2
      if (
        !parsedData.actores || parsedData.actores.length === 0 ||
        !parsedData.escenas || parsedData.escenas.length === 0 ||
        !parsedData.datosOriginales.duraciones || parsedData.datosOriginales.duraciones.length === 0 ||
        !parsedData.datosOriginales.disponibilidad || parsedData.datosOriginales.disponibilidad.length === 0 ||
        !parsedData.datosOriginales.evitar_pares // Evitar_pares puede ser una lista vacía, pero debe existir
      ) {
        setError("El archivo debe contener las secciones ACTORES, Escenas, Duracion, Disponibilidad y Evitar para el Modelo Avanzado.");
        setCurrentStep(0);
        setLoading(false);
        return; // Detener el procesamiento
      }

      // Calcular costo inicial
      const estimacion = calcularCostoInicial(parsedData) as CostoInicial; // Cast
      setCostoInicial(estimacion)

      setData(parsedData)

      // Extraer restricciones del archivo
      const restriccionesDisponibilidad: RestriccionArchivoDisponibilidad[] = [];
      const restriccionesEvitar: RestriccionArchivoEvitar[] = [];

      // Procesar disponibilidad - incluir TODOS los actores, incluso con disponibilidad 0
      parsedData.actores.forEach((actor, index) => {
        const disponibilidad = parsedData.datosOriginales.disponibilidad[index] || 0
        restriccionesDisponibilidad.push({
          actorId: actor.id,
          nombre: actor.nombre,
          tiempoMaximo: disponibilidad,
        })
      })

      // Procesar pares a evitar
      if (parsedData.datosOriginales.evitar_pares && parsedData.datosOriginales.evitar_pares.length > 0) {
        parsedData.datosOriginales.evitar_pares.forEach((par) => {
          const actor1 = parsedData.actores.find((a) => a.id === par[0])
          const actor2 = parsedData.actores.find((a) => a.id === par[1])
          if (actor1 && actor2) {
            restriccionesEvitar.push({
              actor1Id: actor1.id,
              actor1Nombre: actor1.nombre,
              actor2Id: actor2.id,
              actor2Nombre: actor2.nombre,
            })
          }
        })
      }

      setRestriccionesArchivo({
        disponibilidad: restriccionesDisponibilidad,
        evitar: restriccionesEvitar,
      })

      // Inicializar restricciones de actores con los valores de disponibilidad del archivo (solo lectura)
      const restriccionesIniciales: RestriccionActor[] = parsedData.actores.map((actor) => {
        const disponibilidad = parsedData.datosOriginales.disponibilidad[actor.id - 1] || 0
        return {
          id: actor.id,
          nombre: actor.nombre,
          tiempoMaximo: disponibilidad, // Siempre usar el valor del archivo
          evitarCoincidenciaCon: [],
        }
      })

      setRestriccionesActores(restriccionesIniciales)

      // Inicializar restricciones de coincidencia desde el archivo
      const coincidenciasIniciales: number[][] = [];
      if (parsedData.datosOriginales.evitar_pares && parsedData.datosOriginales.evitar_pares.length > 0) {
        parsedData.datosOriginales.evitar_pares.forEach((par) => {
          coincidenciasIniciales.push([par[0], par[1]])
        })
      }
      setRestriccionesCoincidencia(coincidenciasIniciales)

      setCurrentStep(2) // Datos cargados
      setSolucion(null)
      setActiveTab("datos")
    } catch (err: any) {
      setError(`Error al procesar el archivo: ${err.message}`)
      setCurrentStep(0)
    } finally {
      setLoading(false)
    }
  }

  const toggleEvitarCoincidencia = (actorId1: number, actorId2: number) => {
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

  const ejecutarModeloAvanzado = async () => {
    if (!data || !archivoOriginal) {
      setError("Primero debes cargar un archivo de datos")
      return
    }

    setLoading(true)
    setCurrentStep(3) // Procesando restricciones

    try {
      setCurrentStep(4) // Optimizando con restricciones

      // Llamada al endpoint real
      const resultado = await procesarArchivoParte2(archivoOriginal) as SolucionParte2; // Cast
      console.log(resultado)

      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simular procesamiento adicional

      setSolucion(resultado)
      setCurrentStep(5) // Resultados listos
      setActiveTab("resultados")
    } catch (err: any) {
      setError(`Error al ejecutar el modelo avanzado: ${err.message}`)
      setCurrentStep(2)
    } finally {
      setLoading(false)
    }
  }

  const generarArchivoSalida = (solucion: SolucionParte2) => {
    const contenido = `[ ${solucion.ordenEscenas.join(', ')} ] $${solucion.costoTotal} ${solucion.tiempo_compartido_actores_evitar}`;
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solucion_parte2.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="grid gap-4 md:gap-6">
      <Card className="border-gray-300 shadow-lg">
        <CardHeader className="bg-red-700 text-white rounded-t-lg">
          <CardTitle>Procesador Parte 2 - Modelo Avanzado con Restricciones</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file-upload-parte2">Archivo de datos (.dzn)</Label>
              <Input
                id="file-upload-parte2"
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

            {currentStep > 0 && <ProgressSteps currentStep={currentStep} />}

            {data && (
              <div className="grid gap-2">
                <div className="p-3 md:p-4 bg-gray-100 rounded-md border border-gray-300">
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
                      <p className="text-sm text-gray-600">Modelo</p>
                      <p className="font-semibold text-purple-700">Avanzado</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-purple-50 rounded-md border border-purple-300">
                  <h4 className="font-semibold text-purple-800 mb-2">Modelo Avanzado con Restricciones</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Envío directo del archivo .dzn al backend</li>
                    <li>• Algoritmo de optimización con restricciones</li>
                    <li>• Procesamiento automático de disponibilidad y coincidencias</li>
                    <li>• Respuesta optimizada con menor costo total</li>
                  </ul>

                  {costoInicial && (
                    <div className="mt-3 p-2 bg-purple-100 rounded-md">
                      <p className="text-sm font-medium text-purple-800">Estimación inicial:</p>
                      <p className="text-sm text-purple-700">
                        Costo estimado: <span className="font-semibold">${costoInicial.costoEstimado}</span> | Duración
                        total: <span className="font-semibold">{costoInicial.duracionTotal} min</span>
                      </p>
                    </div>
                  )}

                  {/* Mostrar restricciones detectadas en el archivo */}
                  {(restriccionesArchivo.disponibilidad.length > 0 || restriccionesArchivo.evitar.length > 0) && (
                    <div className="mt-3 p-2 bg-purple-100 rounded-md">
                      <p className="text-sm font-medium text-purple-800">Restricciones detectadas en el archivo:</p>

                      {restriccionesArchivo.disponibilidad.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-purple-700">Disponibilidad:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {restriccionesArchivo.disponibilidad
                              .filter((r) => r.tiempoMaximo > 0)
                              .map((r, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-purple-200 text-purple-800 border-purple-300"
                                >
                                  {r.nombre}: {r.tiempoMaximo} min
                                </Badge>
                              ))
                          }
                          </div>
                        </div>
                      )}

                      {restriccionesArchivo.evitar.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-purple-700">Evitar coincidencias:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {restriccionesArchivo.evitar.map((r, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-purple-200 text-purple-800 border-purple-300"
                              >
                                {r.actor1Nombre} ↔ {r.actor2Nombre}
                              </Badge>
                            ))
                          }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!solucion && currentStep < 3 && (
                  <Button
                    onClick={ejecutarModeloAvanzado}
                    disabled={loading}
                    className="bg-red-700 hover:bg-red-800 text-white mt-2"
                  >
                    {loading ? "Ejecutando Modelo..." : "Ejecutar Modelo Avanzado"}
                  </Button>
                )}

                {currentStep === 5 && solucion && (
                  <div className="p-3 bg-green-50 rounded-md border border-green-300">
                    <p className="text-green-800 font-medium">
                      Modelo avanzado ejecutado. Costo total optimizado: ${solucion.costoTotal.toFixed(2)}
                      {costoInicial && (
                        <span className="ml-2 text-sm">(Estimación inicial: ${costoInicial.costoEstimado})</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card className="border-gray-300 shadow-lg">
          <CardHeader className="bg-red-700 text-white rounded-t-lg">
            <CardTitle>Resultados del Modelo Avanzado</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6">
                <TabsTrigger value="datos" className="text-sm md:text-lg py-2 md:py-3">
                  Datos del Archivo
                </TabsTrigger>
                <TabsTrigger value="restricciones" className="text-sm md:text-lg py-2 md:py-3">
                  Restricciones
                </TabsTrigger>
                <TabsTrigger value="resultados" className="text-sm md:text-lg py-2 md:py-3" disabled={!solucion}>
                  Resultados y Gráficas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="mt-0">
                <VisualizacionDatosArchivo data={data} estadisticas={undefined} />
              </TabsContent>

              <TabsContent value="restricciones" className="mt-0">
                <MatrizRestricciones
                  data={data}
                  restriccionesActores={restriccionesActores}
                  restriccionesCoincidencia={restriccionesCoincidencia}
                  restriccionesArchivo={restriccionesArchivo}
                  toggleEvitarCoincidencia={toggleEvitarCoincidencia}
                />
              </TabsContent>

              <TabsContent value="resultados" className="mt-0">
                {solucion ? (
                  <ResultadoPlanificacion2 solucion={solucion} data={data} />
                ) : (
                  <div className="p-6 md:p-8 text-center bg-gray-50 border border-gray-300 rounded-md">
                    <p className="text-gray-600">
                      Ejecuta el modelo avanzado para ver los resultados y gráficas de la planificación optimizada.
                    </p>
                  </div>
                )}

                {solucion && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Solución Encontrada</h3>
                      <p className="text-green-700">
                        Orden de escenas: [{solucion.ordenEscenas.join(', ')}]
                      </p>
                      <p className="text-green-700">
                        Costo total: ${solucion.costoTotal}
                      </p>
                      <p className="text-green-700">
                        Tiempo compartido (EVITAR): {solucion.tiempo_compartido_actores_evitar} min
                      </p>
                      <Button
                        onClick={() => generarArchivoSalida(solucion)}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Descargar Solución
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
