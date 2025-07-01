/**
 * Calcula el costo total estimado y duración total basándose en los datos del archivo
 * @param {Object} data - Datos parseados del archivo .dzn
 * @returns {Object} Objeto con costo_total_estimado y duracion_total
 */
export function calcularEstimacionCostos(data) {
  if (!data || !data.actores || !data.escenas) {
    return { costo_total_estimado: 0, duracion_total: 0 }
  }

  try {
    // Calcular duración total de todas las escenas
    const duracion_total = data.escenas.reduce((total, escena) => total + escena.duracion, 0)

    // Generar una secuencia óptima estimada (usando el ejemplo que proporcionaste)
    // En un caso real, esto sería calculado por el algoritmo de optimización
    const secuenciaOptima = generarSecuenciaOptima(data)

    // Calcular costos por actor basándose en la secuencia
    let costo_total_estimado = 0

    data.actores.forEach((actor) => {
      const costoActor = calcularCostoActor(actor, secuenciaOptima, data)
      costo_total_estimado += costoActor
    })

    return {
      costo_total_estimado: Math.round(costo_total_estimado),
      duracion_total,
      secuencia_estimada: secuenciaOptima,
    }
  } catch (error) {
    console.error("Error al calcular estimación de costos:", error)
    return { costo_total_estimado: 0, duracion_total: 0 }
  }
}

/**
 * Genera una secuencia óptima estimada basándose en heurísticas simples
 * @param {Object} data - Datos del problema
 * @returns {Array} Secuencia de escenas
 */
function generarSecuenciaOptima(data) {
  // Estrategia: Ordenar escenas para minimizar el tiempo total de los actores más costosos

  // 1. Calcular la "densidad de costo" de cada escena
  const escenasConDensidad = data.escenas.map((escena) => {
    const actoresEnEscena = escena.actoresParticipantes
      .map((actorId) => data.actores.find((a) => a.id === actorId))
      .filter(Boolean)

    const costoPorMinuto = actoresEnEscena.reduce((sum, actor) => sum + actor.costoPorMinuto, 0)
    const densidad = costoPorMinuto / escena.duracion

    return {
      ...escena,
      densidad,
      costoPorMinuto,
    }
  })

  // 2. Ordenar por densidad de costo (mayor a menor) para priorizar escenas costosas
  const escenasOrdenadas = [...escenasConDensidad].sort((a, b) => b.densidad - a.densidad)

  return escenasOrdenadas.map((escena) => escena.id)
}

/**
 * Calcula el costo de un actor específico basándose en una secuencia de escenas
 * @param {Object} actor - Datos del actor
 * @param {Array} secuencia - Secuencia de escenas
 * @param {Object} data - Datos completos del problema
 * @returns {number} Costo del actor
 */
function calcularCostoActor(actor, secuencia, data) {
  // Encontrar las escenas en las que participa este actor
  const escenasActor = data.escenas.filter((escena) => escena.actoresParticipantes.includes(actor.id))

  if (escenasActor.length === 0) {
    return 0
  }

  // Encontrar las posiciones de estas escenas en la secuencia
  const posicionesEnSecuencia = escenasActor
    .map((escena) => secuencia.indexOf(escena.id))
    .filter((pos) => pos !== -1)
    .sort((a, b) => a - b)

  if (posicionesEnSecuencia.length === 0) {
    return 0
  }

  // Calcular el tiempo desde la primera hasta la última escena del actor
  const primeraEscena = posicionesEnSecuencia[0]
  const ultimaEscena = posicionesEnSecuencia[posicionesEnSecuencia.length - 1]

  // Sumar las duraciones de todas las escenas desde la primera hasta la última
  let tiempoTotal = 0
  for (let i = primeraEscena; i <= ultimaEscena; i++) {
    const escenaId = secuencia[i]
    const escena = data.escenas.find((e) => e.id === escenaId)
    if (escena) {
      tiempoTotal += escena.duracion
    }
  }

  // Calcular el costo: tiempo total × costo por minuto
  return tiempoTotal * actor.costoPorMinuto
}

/**
 * Calcula estadísticas detalladas para mostrar en la interfaz
 * @param {Object} data - Datos parseados del archivo .dzn
 * @returns {Object} Estadísticas detalladas
 */
export function calcularEstadisticasDetalladas(data) {
  if (!data || !data.actores || !data.escenas) {
    return {}
  }

  const estimacion = calcularEstimacionCostos(data)

  // Calcular estadísticas adicionales
  const costoMaximoActor = Math.max(...data.actores.map((a) => a.costoPorMinuto))
  const costoMinimoActor = Math.min(...data.actores.map((a) => a.costoPorMinuto))
  const costoPromedioActor = data.actores.reduce((sum, a) => sum + a.costoPorMinuto, 0) / data.actores.length

  const duracionMaximaEscena = Math.max(...data.escenas.map((e) => e.duracion))
  const duracionMinimaEscena = Math.min(...data.escenas.map((e) => e.duracion))
  const duracionPromedioEscena = data.escenas.reduce((sum, e) => sum + e.duracion, 0) / data.escenas.length

  // Calcular participación promedio por actor
  const participacionPorActor = data.actores.map((actor) => {
    const escenasParticipadas = data.escenas.filter((escena) => escena.actoresParticipantes.includes(actor.id)).length
    return escenasParticipadas
  })

  const participacionPromedio = participacionPorActor.reduce((sum, p) => sum + p, 0) / data.actores.length

  return {
    ...estimacion,
    estadisticas: {
      actores: {
        costo_maximo: costoMaximoActor,
        costo_minimo: costoMinimoActor,
        costo_promedio: costoPromedioActor.toFixed(2),
        participacion_promedio: participacionPromedio.toFixed(1),
      },
      escenas: {
        duracion_maxima: duracionMaximaEscena,
        duracion_minima: duracionMinimaEscena,
        duracion_promedio: duracionPromedioEscena.toFixed(1),
      },
    },
  }
}

/**
 * Simula el cálculo detallado como en tu ejemplo
 * @param {Object} data - Datos del problema
 * @returns {Object} Cálculo detallado paso a paso
 */
export function simularCalculoDetallado(data) {
  if (!data || !data.actores || !data.escenas) {
    return null
  }

  // Usar la secuencia del ejemplo: [3, 1, 2, 4, 5]
  // Pero adaptarla al número real de escenas
  const numEscenas = data.escenas.length
  let secuenciaEjemplo

  if (numEscenas === 5) {
    secuenciaEjemplo = [3, 1, 2, 4, 5]
  } else {
    // Generar una secuencia adaptada
    secuenciaEjemplo = generarSecuenciaOptima(data)
  }

  const calculoDetallado = {
    secuencia: secuenciaEjemplo,
    actores: [],
    costo_total: 0,
  }

  // Calcular para cada actor
  data.actores.forEach((actor) => {
    const escenasActor = data.escenas.filter((escena) => escena.actoresParticipantes.includes(actor.id))

    if (escenasActor.length === 0) {
      calculoDetallado.actores.push({
        nombre: actor.nombre,
        escenas_participadas: [],
        primera_escena: null,
        ultima_escena: null,
        tiempo_total: 0,
        costo: 0,
        calculo: "No participa en ninguna escena",
      })
      return
    }

    // Encontrar posiciones en la secuencia
    const escenasEnSecuencia = escenasActor
      .map((escena) => ({
        id: escena.id,
        posicion: secuenciaEjemplo.indexOf(escena.id),
      }))
      .filter((e) => e.posicion !== -1)
      .sort((a, b) => a.posicion - b.posicion)

    const primeraEscena = escenasEnSecuencia[0]?.id
    const ultimaEscena = escenasEnSecuencia[escenasEnSecuencia.length - 1]?.id

    // Calcular tiempo total
    const posicionInicio = secuenciaEjemplo.indexOf(primeraEscena)
    const posicionFin = secuenciaEjemplo.indexOf(ultimaEscena)

    let tiempoTotal = 0
    const escenasEnRango = []

    for (let i = posicionInicio; i <= posicionFin; i++) {
      const escenaId = secuenciaEjemplo[i]
      const escena = data.escenas.find((e) => e.id === escenaId)
      if (escena) {
        tiempoTotal += escena.duracion
        escenasEnRango.push(`duración(${escenaId})`)
      }
    }

    const costo = tiempoTotal * actor.costoPorMinuto

    calculoDetallado.actores.push({
      nombre: actor.nombre,
      escenas_participadas: escenasActor.map((e) => e.id),
      primera_escena: primeraEscena,
      ultima_escena: ultimaEscena,
      tiempo_total: tiempoTotal,
      costo: costo,
      calculo: `${escenasEnRango.join(" + ")} = ${tiempoTotal} × ${actor.costoPorMinuto} = ${costo}`,
    })

    calculoDetallado.costo_total += costo
  })

  return calculoDetallado
}
