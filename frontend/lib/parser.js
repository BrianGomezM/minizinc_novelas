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
    datosOriginales: {
      participacion: [],
      costos: [],
      duraciones: [],
    },
  }

  try {
    // Extraer nombres de actores
    const actoresMatch = content.match(/ACTORES\s*=\s*\{([^}]+)\}/i)
    if (actoresMatch && actoresMatch[1]) {
      const nombresActores = actoresMatch[1].split(",").map((nombre) => nombre.trim())

      // Extraer costos de actores
      const costosMatch = content.match(/costo_actor\s*=\s*\[([\d\s,.]+)\]/i)
      let costos = []
      if (costosMatch && costosMatch[1]) {
        costos = costosMatch[1].split(",").map((costo) => Number.parseFloat(costo.trim()))
      }

      // Crear objetos de actores
      data.actores = nombresActores.map((nombre, index) => ({
        id: index + 1,
        nombre,
        costoPorMinuto: costos[index] || 0,
      }))

      // Guardar costos originales
      data.datosOriginales.costos = costos
    }

    // Extraer número de escenas
    const numEscenasMatch = content.match(/num_escenas\s*=\s*(\d+)/i)
    let numEscenas = 0
    if (numEscenasMatch && numEscenasMatch[1]) {
      numEscenas = Number.parseInt(numEscenasMatch[1])
    }

    // Extraer duración de escenas
    const duracionMatch = content.match(/duracion\s*=\s*\[([\d\s,.]+)\]/i)
    let duraciones = []
    if (duracionMatch && duracionMatch[1]) {
      duraciones = duracionMatch[1].split(",").map((duracion) => Number.parseInt(duracion.trim()))

      // Guardar duraciones originales
      data.datosOriginales.duraciones = duraciones
    }

    // Extraer matriz de participación
    const participacionMatch = content.match(/participacion\s*=\s*array2d$$[^,]+,[^,]+,\s*\[([\s\S]*?)\]$$/i)
    const matrizParticipacion = []
    if (participacionMatch && participacionMatch[1]) {
      // Limpiar y extraer solo los números
      const numerosStr = participacionMatch[1].replace(/[^0-9,]/g, "")
      const numeros = numerosStr
        .split(",")
        .filter((n) => n !== "")
        .map((n) => Number.parseInt(n))

      // Reorganizar en matriz por actor
      const numActores = data.actores.length
      for (let i = 0; i < numActores; i++) {
        const filaActor = numeros.slice(i * numEscenas, (i + 1) * numEscenas)
        matrizParticipacion.push(filaActor)
      }

      // Guardar matriz original
      data.datosOriginales.participacion = matrizParticipacion
    }

    // Crear objetos de escenas
    data.escenas = Array.from({ length: numEscenas }, (_, i) => {
      // Determinar qué actores participan en esta escena
      const actoresParticipantes = data.actores
        .filter((_, actorIndex) => matrizParticipacion[actorIndex] && matrizParticipacion[actorIndex][i] === 1)
        .map((actor) => actor.id)

      return {
        id: i + 1,
        nombre: `Escena ${i + 1}`,
        duracion: duraciones[i] || 1,
        actoresParticipantes,
      }
    })

    // Verificar que se hayan extraído datos válidos
    if (data.actores.length === 0 || data.escenas.length === 0) {
      throw new Error("No se pudieron extraer datos válidos del archivo")
    }

    return data
  } catch (error) {
    throw new Error(`Error al parsear el archivo: ${error.message}`)
  }
}
