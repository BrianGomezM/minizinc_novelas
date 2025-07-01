"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parseDznFile } from "@/lib/parser"
import { calcularCostoInicial, procesarArchivoParte1 } from "@/lib/api-client"
import { VisualizacionDatosArchivo } from "@/components/visualizacion-datos-archivo"
import { ResultadoPlanificacion } from "@/components/resultado-planificacion"
import { ProgressSteps } from "@/components/progress-steps"

export interface Actor {
  id: number;
  nombre: string;
  costoPorMinuto?: number;
}

export interface Escena {
  id: number;
  duracion: number;
  actoresParticipantes: number[];
}

export interface DatosOriginales {
  participacion: number[][];
  costos: number[];
  duraciones: number[];
}

export interface ParsedData {
  actores: Actor[];
  escenas: Escena[];
  datosOriginales: DatosOriginales;
}

export interface SolucionParte1 {
  ordenEscenas: number[];
  costoTotal: number;
  costosActores: { actorId: number; tiempoTotal: number; costoTotal: number }[];
}

interface CostoInicial {
  costoEstimado: number | undefined;
  duracionTotal: number | undefined;
}

export function ProcesadorArchivoParte1() {
  const [data, setData] = useState<ParsedData | null>(null)
  const [solucion, setSolucion] = useState<SolucionParte1 | null>(null)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [fileName, setFileName] = useState<string>("")
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>("datos")
  const [costoInicial, setCostoInicial] = useState<CostoInicial | null>(null)
  const [archivoOriginal, setArchivoOriginal] = useState<File | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limpiar datos y resultados anteriores
    setData(null);
    setSolucion(null);
    setError("");
    setLoading(false);
    setFileName("");
    setCurrentStep(0);
    setActiveTab("datos");
    setCostoInicial(null);
    setArchivoOriginal(null);

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

      // Validar que solo contenga ACTORES, Escenas y Duracion para Parte 1
      if ((parsedData.datosOriginales as any).disponibilidad?.length > 0 || (parsedData.datosOriginales as any).evitar_pares?.length > 0) {
        setError("El archivo contiene secciones no permitidas para el Modelo Básico (Disponibilidad o Evitar coincidencias).");
        setCurrentStep(0);
        setLoading(false);
        return; // Detener el procesamiento
      }

      // Calcular costo inicial
      const estimacion = calcularCostoInicial(parsedData);
      setCostoInicial(estimacion as CostoInicial);

      setData(parsedData)
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

  const ejecutarModeloBasico = async () => {
    if (!data || !archivoOriginal) {
      setError("Primero debes cargar un archivo de datos")
      return
    }

    setLoading(true)
    setCurrentStep(3) // Procesando modelo básico

    try {
      // Llamada al endpoint real
      const resultado = await procesarArchivoParte1(archivoOriginal)

      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simular procesamiento adicional

      setSolucion(resultado as SolucionParte1)
      setCurrentStep(5) // Resultados listos
      setActiveTab("resultados")
    } catch (err: any) {
      setError(`Error al ejecutar el modelo básico: ${err.message}`)
      setCurrentStep(2)
    } finally {
      setLoading(false)
    }
  }

  const generarArchivoSalida = (solucion: SolucionParte1) => {
    const contenido = `[ ${solucion.ordenEscenas.join(', ')} ] $${solucion.costoTotal}`;
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solucion_parte1.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="grid gap-4 md:gap-6">
      <Card className="border-gray-300 shadow-lg">
        <CardHeader className="bg-red-700 text-white rounded-t-lg">
          <CardTitle>Procesador Parte 1 - Modelo Básico de Optimización</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file-upload-parte1">Archivo de datos (.dzn)</Label>
              <Input
                id="file-upload-parte1"
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
                      <p className="font-semibold text-blue-700">Básico</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-blue-50 rounded-md border border-blue-300">
                  <h4 className="font-semibold text-blue-800 mb-2">Modelo Básico de Optimización</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Envío directo del archivo .dzn al backend</li>
                    <li>• Algoritmo de optimización básico</li>
                    <li>• Respuesta con orden de escenas y costos por actor</li>
                    <li>• Visualización de resultados y gráficas</li>
                  </ul>

                  {costoInicial && (
                    <div className="mt-3 p-2 bg-blue-100 rounded-md">
                      <p className="text-sm font-medium text-blue-800">Estimación inicial:</p>
                      <p className="text-sm text-blue-700">
                        Costo estimado: <span className="font-semibold">${costoInicial.costoEstimado}</span> | Duración
                        total: <span className="font-semibold">{costoInicial.duracionTotal} min</span>
                      </p>
                    </div>
                  )}
                </div>

                {!solucion && currentStep < 3 && (
                  <Button
                    onClick={ejecutarModeloBasico}
                    disabled={loading}
                    className="bg-red-700 hover:bg-red-800 text-white mt-2"
                  >
                    {loading ? "Ejecutando Modelo..." : "Ejecutar Modelo Básico"}
                  </Button>
                )}

                {currentStep === 5 && solucion && (
                  <div className="p-3 bg-green-50 rounded-md border border-green-300">
                    <p className="text-green-800 font-medium">
                      Modelo básico ejecutado. Costo total optimizado: ${solucion.costoTotal.toFixed(2)}
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
            <CardTitle>Resultados del Modelo Básico</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
                <TabsTrigger value="datos" className="text-sm md:text-lg py-2 md:py-3">
                  Datos del Archivo
                </TabsTrigger>
                <TabsTrigger value="resultados" className="text-sm md:text-lg py-2 md:py-3" disabled={!solucion}>
                  Resultados y Gráficas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="mt-0">
                <VisualizacionDatosArchivo data={data} estadisticas={undefined} />
              </TabsContent>

              <TabsContent value="resultados" className="mt-0">
                {solucion ? (
                  <ResultadoPlanificacion solucion={solucion} data={data} />
                ) : (
                  <div className="p-6 md:p-8 text-center bg-gray-50 border border-gray-300 rounded-md">
                    <p className="text-gray-600">
                      Ejecuta el modelo básico para ver los resultados y gráficas de la planificación optimizada.
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
