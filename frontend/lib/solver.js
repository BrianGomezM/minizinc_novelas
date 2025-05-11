/**
 * Optimiza la planificación de escenas para minimizar el costo total
 * @param {Object} data - Datos del problema
 * @returns {Object} Solución optimizada
 */
export function optimizarPlanificacion(data) {
  try {
    // Implementación simplificada de un algoritmo de optimización
    // En un caso real, aquí se implementaría un solucionador de restricciones más complejo

    // Enfoque: Ordenar las escenas para minimizar el tiempo total de los actores en el set

    // 1. Calcular la "densidad" de cada escena (costo por minuto de los actores / duración)
    const escenasConDensidad = data.escenas.map((escena) => {
      const actoresEnEscena = escena.actoresParticipantes.map((actorId) => data.actores.find((a) => a.id === actorId))

      const costoPorMinuto = actoresEnEscena.reduce((sum, actor) => sum + actor.costoPorMinuto, 0)

      return {
        ...escena,
        densidad: costoPorMinuto / escena.duracion,
      }
    })

    // 2. Ordenar las escenas por densidad (de mayor a menor)
    const escenasOrdenadas = [...escenasConDensidad].sort((a, b) => b.densidad - a.densidad)

    // 3. Calcular los tiempos de presencia de cada actor
    const tiemposActores = {}
    let tiempoAcumulado = 0

    escenasOrdenadas.forEach((escena) => {
      // Actualizar el tiempo acumulado
      const tiempoInicio = tiempoAcumulado
      tiempoAcumulado += escena.duracion

      // Registrar los tiempos de los actores
      escena.actoresParticipantes.forEach((actorId) => {
        if (!tiemposActores[actorId]) {
          tiemposActores[actorId] = {
            primerEscena: tiempoInicio,
            ultimaEscena: tiempoAcumulado,
            tiempoTotal: escena.duracion,
          }
        } else {
          tiemposActores[actorId].ultimaEscena = tiempoAcumulado
          tiemposActores[actorId].tiempoTotal += escena.duracion
        }
      })
    })

    // 4. Calcular el costo total
    const costosActores = Object.entries(tiemposActores).map(([actorId, tiempos]) => {
      const actor = data.actores.find((a) => a.id === Number.parseInt(actorId))
      const tiempoEnSet = tiempos.ultimaEscena - tiempos.primerEscena
      const costoTotal = tiempoEnSet * actor.costoPorMinuto

      return {
        actorId: Number.parseInt(actorId),
        tiempoTotal: tiempoEnSet,
        costoTotal,
      }
    })

    const costoTotal = costosActores.reduce((sum, costo) => sum + costo.costoTotal, 0)

    // 5. Devolver la solución
    return {
      ordenEscenas: escenasOrdenadas.map((escena) => escena.id),
      costosActores,
      costoTotal,
    }
  } catch (error) {
    throw new Error(`Error al optimizar la planificación: ${error.message}`)
  }
}

/**
 * Optimiza la planificación con restricciones adicionales
 * @param {Object} data - Datos del problema
 * @param {boolean} eliminarSimetrias - Indica si se deben eliminar simetrías
 * @param {Array} restriccionesActores - Restricciones de disponibilidad de actores
 * @param {Array} restriccionesCoincidencia - Restricciones para evitar coincidencias
 * @returns {Object} Solución optimizada
 */
export function optimizarPlanificacionAvanzada(
  data,
  eliminarSimetrias = true,
  restriccionesActores = [],
  restriccionesCoincidencia = [],
) {
  try {
    // Implementación de un algoritmo más avanzado con restricciones adicionales

    // 1. Generar todas las permutaciones posibles de escenas
    let permutaciones = generarPermutaciones(data.escenas.map((e) => e.id))

    // 2. Si se eliminan simetrías, reducir el espacio de búsqueda
    if (eliminarSimetrias) {
      // Simplificación: eliminar permutaciones equivalentes
      // En un caso real, se implementaría una estrategia más sofisticada
      permutaciones = permutaciones.slice(0, permutaciones.length / 2)
    }

    // 3. Evaluar cada permutación y encontrar la mejor
    let mejorSolucion = null
    let mejorCosto = Number.POSITIVE_INFINITY

    for (const ordenEscenas of permutaciones) {
      // Verificar si la permutación cumple con las restricciones
      if (!cumpleRestriccionesCoincidencia(ordenEscenas, data, restriccionesCoincidencia)) {
        continue
      }

      // Calcular los tiempos de presencia de cada actor
      const tiemposActores = calcularTiemposActores(ordenEscenas, data)

      // Verificar restricciones de tiempo máximo
      if (!cumpleRestriccionesTiempo(tiemposActores, restriccionesActores)) {
        continue
      }

      // Calcular el costo total
      const costosActores = calcularCostosActores(tiemposActores, data.actores)
      const costoTotal = costosActores.reduce((sum, costo) => sum + costo.costoTotal, 0)

      // Actualizar la mejor solución si corresponde
      if (costoTotal < mejorCosto) {
        mejorCosto = costoTotal
        mejorSolucion = {
          ordenEscenas,
          costosActores,
          costoTotal,
        }
      }
    }

    // Si no se encontró una solución válida, usar la optimización básica
    if (!mejorSolucion) {
      // Caer en la solución básica si no hay una que cumpla todas las restricciones
      return optimizarPlanificacion(data)
    }

    return mejorSolucion
  } catch (error) {
    throw new Error(`Error al optimizar la planificación avanzada: ${error.message}`)
  }
}

// Funciones auxiliares

/**
 * Genera todas las permutaciones posibles de un array
 * Nota: Esta función es ineficiente para arrays grandes
 * @param {Array} arr - Array a permutar
 * @returns {Array} Todas las permutaciones
 */
function generarPermutaciones(arr) {
  // Para evitar explosión combinatoria, limitamos a un máximo de 8 elementos
  if (arr.length > 8) {
    // Simplificación: generar solo algunas permutaciones aleatorias
    return generarPermutacionesAleatorias(arr, 100)
  }

  if (arr.length <= 1) return [arr]

  const result = []

  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)]
    const permutacionesRestantes = generarPermutaciones(remaining)

    for (const permutacion of permutacionesRestantes) {
      result.push([current, ...permutacion])
    }
  }

  return result
}

/**
 * Genera un número limitado de permutaciones aleatorias
 * @param {Array} arr - Array a permutar
 * @param {number} cantidad - Cantidad de permutaciones a generar
 * @returns {Array} Permutaciones aleatorias
 */
function generarPermutacionesAleatorias(arr, cantidad) {
  const result = []

  // Añadir la permutación original
  result.push([...arr])

  // Generar permutaciones aleatorias
  for (let i = 0; i < cantidad - 1; i++) {
    const permutacion = [...arr]

    // Algoritmo Fisher-Yates para mezclar el array
    for (let j = permutacion.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[permutacion[j], permutacion[k]] = [permutacion[k], permutacion[j]]
    }

    result.push(permutacion)
  }

  return result
}

/**
 * Calcula los tiempos de presencia de cada actor para un orden de escenas dado
 * @param {Array} ordenEscenas - Orden de las escenas
 * @param {Object} data - Datos del problema
 * @returns {Object} Tiempos de presencia de cada actor
 */
function calcularTiemposActores(ordenEscenas, data) {
  const tiemposActores = {}
  let tiempoAcumulado = 0

  for (const escenaId of ordenEscenas) {
    const escena = data.escenas.find((e) => e.id === escenaId)
    const tiempoInicio = tiempoAcumulado
    tiempoAcumulado += escena.duracion

    for (const actorId of escena.actoresParticipantes) {
      if (!tiemposActores[actorId]) {
        tiemposActores[actorId] = {
          primerEscena: tiempoInicio,
          ultimaEscena: tiempoAcumulado,
          tiempoTotal: escena.duracion,
          escenasParticipadas: [escenaId],
        }
      } else {
        tiemposActores[actorId].ultimaEscena = tiempoAcumulado
        tiemposActores[actorId].tiempoTotal += escena.duracion
        tiemposActores[actorId].escenasParticipadas.push(escenaId)
      }
    }
  }

  return tiemposActores
}

/**
 * Calcula los costos de cada actor
 * @param {Object} tiemposActores - Tiempos de presencia de cada actor
 * @param {Array} actores - Información de los actores
 * @returns {Array} Costos de cada actor
 */
function calcularCostosActores(tiemposActores, actores) {
  return Object.entries(tiemposActores).map(([actorId, tiempos]) => {
    const actor = actores.find((a) => a.id === Number.parseInt(actorId))
    const tiempoEnSet = tiempos.ultimaEscena - tiempos.primerEscena
    const costoTotal = tiempoEnSet * actor.costoPorMinuto

    return {
      actorId: Number.parseInt(actorId),
      tiempoTotal: tiempoEnSet,
      costoTotal,
    }
  })
}

/**
 * Verifica si un orden de escenas cumple con las restricciones de coincidencia
 * @param {Array} ordenEscenas - Orden de las escenas
 * @param {Object} data - Datos del problema
 * @param {Array} restriccionesCoincidencia - Restricciones para evitar coincidencias
 * @returns {boolean} Indica si se cumplen las restricciones
 */
function cumpleRestriccionesCoincidencia(ordenEscenas, data, restriccionesCoincidencia) {
  if (restriccionesCoincidencia.length === 0) return true

  // Calcular los tiempos de presencia de cada actor
  const tiemposActores = calcularTiemposActores(ordenEscenas, data)

  // Verificar cada restricción de coincidencia
  for (const [actorId1, actorId2] of restriccionesCoincidencia) {
    const actor1 = tiemposActores[actorId1]
    const actor2 = tiemposActores[actorId2]

    // Si alguno de los actores no participa, no hay problema
    if (!actor1 || !actor2) continue

    // Verificar si hay solapamiento de tiempos
    const hayCoincidencia =
      (actor1.primerEscena < actor2.ultimaEscena && actor1.ultimaEscena > actor2.primerEscena) ||
      actor1.escenasParticipadas.some((escenaId) => actor2.escenasParticipadas.includes(escenaId))

    if (hayCoincidencia) return false
  }

  return true
}

/**
 * Verifica si los tiempos de los actores cumplen con las restricciones de tiempo máximo
 * @param {Object} tiemposActores - Tiempos de presencia de cada actor
 * @param {Array} restriccionesActores - Restricciones de disponibilidad de actores
 * @returns {boolean} Indica si se cumplen las restricciones
 */
function cumpleRestriccionesTiempo(tiemposActores, restriccionesActores) {
  for (const restriccion of restriccionesActores) {
    if (!restriccion.tiempoMaximo) continue

    const tiempoActor = tiemposActores[restriccion.id]
    if (!tiempoActor) continue

    const tiempoEnSet = tiempoActor.ultimaEscena - tiempoActor.primerEscena

    if (tiempoEnSet > restriccion.tiempoMaximo) {
      return false
    }
  }

  return true
}
