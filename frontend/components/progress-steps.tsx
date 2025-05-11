"use client"

import { CheckIcon, Loader2Icon } from "lucide-react"

const steps = [
  { id: 1, name: "Cargando datos" },
  { id: 2, name: "Datos cargados" },
  { id: 3, name: "Procesando restricciones" },
  { id: 4, name: "Optimizando planificación" },
  { id: 5, name: "Visualizando resultados" },
]

export function ProgressSteps({ currentStep }) {
  return (
    <div className="py-4">
      <ol className="relative border-l border-gray-300 ml-3">
        {steps.map((step) => {
          // Determinar el estado del paso
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isPending = step.id > currentStep

          return (
            <li key={step.id} className="mb-6 ml-6">
              <span
                className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white ${
                  isActive
                    ? "bg-red-700 text-white"
                    : isCompleted
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm">{step.id}</span>
                )}
              </span>
              <h3
                className={`font-medium ${
                  isActive ? "text-red-700" : isCompleted ? "text-green-600" : "text-gray-500"
                }`}
              >
                {step.name}
                {isCompleted && " ✓"}
                {isActive && " ●"}
              </h3>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
