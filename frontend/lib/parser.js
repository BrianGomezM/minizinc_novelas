/**
 * Parsea un archivo en formato .dzn para extraer los datos del problema
 * @param {string} content - Contenido del archivo .dzn
 * @returns {Object} Datos estructurados del problema
 */
export function parseDznFile(content) {
  // Objeto para almacenar los datos extraídos
  const data = {
    actores: [],
    escenas: [],
    disponibilidad: [],
    evitar: [],
    datosOriginales: {
      participacion: [],
      costos: [],
      duraciones: [],
    },
  }

  try {
    // Extraer nombres de actores
    const actoresMatch = content.match(/ACTORES\s*=\s*\{([^}]+)\}/i)
    let nombresActores = []
    if (actoresMatch && actoresMatch[1]) {
      nombresActores = actoresMatch[1].split(",").map((nombre) => nombre.trim())
      data.actores = nombresActores.map((nombre, index) => ({
        id: index + 1,
        nombre,
        costoPorMinuto: 1, // Valor por defecto si no hay costo
      }))
    }

    // Extraer matriz de escenas (participación) y costos
    const escenasMatch = content.match(/Escenas\s*=\s*\[\|([\s\S]*?)\|\];/i)
    let matrizEscenas = []
    let costos = []
    if (escenasMatch && escenasMatch[1]) {
      const filas = escenasMatch[1].trim().split("\n").filter(f => f.trim() !== "")
      for (const fila of filas) {
        let cleanFila = fila.trim()
        if (cleanFila.startsWith("|")) cleanFila = cleanFila.slice(1)
        if (cleanFila.endsWith("|")) cleanFila = cleanFila.slice(0, -1)
        const valores = cleanFila.split(",").map((v) => v.trim())
        // La última columna es el costo
        costos.push(parseInt(valores[valores.length - 1]))
        // El resto son la participación
        matrizEscenas.push(valores.slice(0, -1).map((v) => parseInt(v)))
      }
      data.datosOriginales.participacion = matrizEscenas
      data.datosOriginales.costos = costos
    }

    // Extraer duraciones
    const duracionMatch = content.match(/Duracion\s*=\s*\[([^\]]+)\]/i)
    let duraciones = []
    if (duracionMatch && duracionMatch[1]) {
      duraciones = duracionMatch[1].split(",").map((d) => parseInt(d.trim()))
      data.datosOriginales.duraciones = duraciones
    }

    // Asignar costos a los actores si existen
    if (costos.length > 0 && data.actores.length === costos.length) {
      data.actores = data.actores.map((actor, idx) => ({
        ...actor,
        costoPorMinuto: costos[idx]
      }))
    }

    // Crear objetos de escenas
    const numEscenas = matrizEscenas[0]?.length || 0
    data.escenas = Array.from({ length: numEscenas }, (_, i) => {
      // Determinar qué actores participan en esta escena
      const actoresParticipantes = data.actores
        .filter((_, actorIndex) => matrizEscenas[actorIndex] && matrizEscenas[actorIndex][i] === 1)
        .map((actor) => actor.id)
      return {
        id: i + 1,
        nombre: `Escena ${i + 1}`,
        duracion: duraciones[i] || 1,
        actoresParticipantes,
      }
    })

    // Extraer disponibilidad
    const dispMatch = content.match(/Disponibilidad\s*=\s*\[\|([\s\S]*?)\|\];/i)
    if (dispMatch && dispMatch[1]) {
      const filas = dispMatch[1].trim().split("\n")
      for (const fila of filas) {
        if (fila.trim() === "") continue
        let cleanFila = fila.trim()
        if (cleanFila.startsWith("|")) cleanFila = cleanFila.slice(1)
        if (cleanFila.endsWith("|")) cleanFila = cleanFila.slice(0, -1)
        const [nombre, valor] = cleanFila.split(",").map((v) => v.trim())
        data.disponibilidad.push({ nombre, valor: parseInt(valor) })
      }
    }

    // Extraer restricciones de evitar coincidencias
    const evitarMatch = content.match(/Evitar\s*=\s*\[\|([\s\S]*?)\|\];/i)
    if (evitarMatch && evitarMatch[1]) {
      const filas = evitarMatch[1].trim().split("\n")
      for (const fila of filas) {
        if (fila.trim() === "") continue
        let cleanFila = fila.trim()
        if (cleanFila.startsWith("|")) cleanFila = cleanFila.slice(1)
        if (cleanFila.endsWith("|")) cleanFila = cleanFila.slice(0, -1)
        const [a1, a2] = cleanFila.split(",").map((v) => v.trim())
        data.evitar.push([a1, a2])
      }
    }

    // Verificar que se hayan extraído datos válidos
    if (data.actores.length === 0 || data.escenas.length === 0) {
      throw new Error("No se pudieron extraer datos válidos del archivo")
    }

    return data
  } catch (error) {
    throw new Error(`Error al parsear el archivo: ${error.message}`)
  }
}
