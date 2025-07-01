"use client"

/**
 * Función para enviar el archivo .dzn al backend y obtener los resultados
 * @param {string} fileContent - Contenido del archivo .dzn
 * @returns {Promise<Object>} Resultados de la planificación
 */
export async function procesarArchivoEnBackend(fileContent) {
  try {
    // Aquí debes reemplazar la URL con la de tu backend real
    const response = await fetch("/api/procesar-planificacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivo: fileContent,
        // Puedes agregar más parámetros si tu backend los necesita
        opciones: {
          eliminar_simetrias: true,
          tiempo_limite: 300, // 5 minutos
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Error del servidor: ${response.status}`)
    }

    const resultados = await response.json()

    // Validar que la respuesta tenga el formato esperado
    if (!resultados.orden_escenas || !resultados.tiempos_por_actor || typeof resultados.costo_total !== "number") {
      throw new Error("Formato de respuesta inválido del servidor")
    }

    return resultados
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
    }
    throw error
  }
}

/**
 * Función para validar el formato del archivo .dzn antes de enviarlo
 * @param {string} content - Contenido del archivo
 * @returns {boolean} True si el formato es válido
 */
export function validarFormatoDzn(content) {
  // Verificar que tenga las secciones requeridas
  const tieneActores = /ACTORES\s*=\s*\{[^}]+\}/i.test(content)
  const tieneEscenas = /Escenas\s*=\s*\[\|[\s\S]*?\|\]/i.test(content)
  const tieneDuracion = /duracion\s*=\s*\[[^\]]+\]/i.test(content)
  const tieneNumEscenas = /num_escenas\s*=\s*\d+/i.test(content)

  return tieneActores && tieneEscenas && tieneDuracion && tieneNumEscenas
}

/**
 * Función para formatear los resultados del backend para mostrar en la UI
 * @param {Object} resultados - Resultados del backend
 * @returns {Object} Resultados formateados
 */
export function formatearResultados(resultados) {
  return {
    ...resultados,
    // Asegurar que todos los campos numéricos sean números
    costo_total: Number(resultados.costo_total),
    tiempo_compartido_actores_evitar: Number(resultados.tiempo_compartido_actores_evitar || 0),
    tiempos_por_actor: resultados.tiempos_por_actor.map((actor) => ({
      ...actor,
      rango_escenas_inicio: Number(actor.rango_escenas_inicio),
      rango_escenas_fin: Number(actor.rango_escenas_fin),
      unidades: Number(actor.unidades),
      costo: Number(actor.costo),
    })),
    orden_escenas: resultados.orden_escenas.map((escena) => Number(escena)),
  }
}
