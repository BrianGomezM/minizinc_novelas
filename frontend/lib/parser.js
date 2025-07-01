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
      disponibilidad: [],
      evitar_pares: [],
    },
  }

  try {
    // Extraer nombres de actores
    const actoresMatch = content.match(/ACTORES\s*=\s*\{([^}]+)\}/i)
    if (!actoresMatch || !actoresMatch[1]) {
      throw new Error("No se encontró la definición de ACTORES")
    }

    const nombresActores = actoresMatch[1]
      .split(",")
      .map((nombre) => nombre.trim())
      .filter((nombre) => nombre !== "")

    // Extraer matriz de escenas
    const escenasMatch = content.match(/Escenas\s*=\s*\[\|\s*([\s\S]*?)\s*\|\]/i)
    if (!escenasMatch || !escenasMatch[1]) {
      throw new Error("No se encontró la definición de Escenas")
    }

    const matrizEscenas = []
    const costos = []

    // Procesar cada fila de la matriz
    const filas = escenasMatch[1].split("|").filter((fila) => fila.trim() !== "")

    filas.forEach((fila, actorIndex) => {
      // Limpiar la fila y extraer números
      const numeros = fila
        .replace(/%.*$/gm, "") // Remover comentarios
        .split(/[,\s]+/)
        .map((n) => n.trim())
        .filter((n) => n !== "" && !isNaN(n))
        .map((n) => Number.parseInt(n))

      if (numeros.length >= 2) {
        // Los números excepto el último son la participación, el último es el costo
        const participacion = numeros.slice(0, -1)
        const costo = numeros[numeros.length - 1]

        matrizEscenas.push(participacion)
        costos.push(costo)
      }
    })

    // Determinar número de escenas basado en la primera fila
    const numEscenas = matrizEscenas.length > 0 ? matrizEscenas[0].length : 0

    // Extraer duración de escenas
    const duracionMatch = content.match(/Duracion\s*=\s*\[([\d\s,.]+)\]/i)
    let duraciones = []
    if (duracionMatch && duracionMatch[1]) {
      duraciones = duracionMatch[1]
        .split(/[,\s]+/)
        .map((duracion) => duracion.trim())
        .filter((d) => d !== "" && !isNaN(d))
        .map((d) => Number.parseInt(d))
    }

    // Extraer disponibilidad de actores (formato nuevo)
    const disponibilidadMatch = content.match(/Disponibilidad\s*=\s*\[\|\s*([\s\S]*?)\s*\|\]/i)
    let disponibilidad = []

    if (disponibilidadMatch && disponibilidadMatch[1]) {
      // Formato: |Actor1, 0 |Actor2, 0 |...
      const filasDisponibilidad = disponibilidadMatch[1].split("|").filter((fila) => fila.trim() !== "")

      filasDisponibilidad.forEach((fila) => {
        const partes = fila.split(",").map((p) => p.trim())
        if (partes.length >= 2) {
          const nombreActor = partes[0]
          const valor = Number.parseInt(partes[1])

          // Encontrar el índice del actor
          const indiceActor = nombresActores.findIndex((nombre) => nombre === nombreActor)
          if (indiceActor !== -1) {
            disponibilidad[indiceActor] = valor
          }
        }
      })
    } else {
      // Formato antiguo: disponibilidad = [0,0,23,...]
      const disponibilidadAntiguaMatch = content.match(/disponibilidad\s*=\s*\[([\d\s,.]+)\]/i)
      if (disponibilidadAntiguaMatch && disponibilidadAntiguaMatch[1]) {
        disponibilidad = disponibilidadAntiguaMatch[1]
          .split(/[,\s]+/)
          .map((disp) => disp.trim())
          .filter((d) => d !== "" && !isNaN(d))
          .map((d) => Number.parseInt(d))
      }
    }

    // Extraer pares a evitar (formato nuevo)
    const evitarMatch = content.match(/Evitar\s*=\s*\[\|\s*([\s\S]*?)\s*\|\]/i)
    const evitarPares = []

    if (evitarMatch && evitarMatch[1]) {
      // Formato: |Actor1, Actor3 |Actor1, Actor4 |...
      const filasEvitar = evitarMatch[1].split("|").filter((fila) => fila.trim() !== "")

      filasEvitar.forEach((fila) => {
        const partes = fila.split(",").map((p) => p.trim())
        if (partes.length >= 2) {
          const actor1 = partes[0]
          const actor2 = partes[1]

          // Encontrar los índices de los actores
          const indice1 = nombresActores.findIndex((nombre) => nombre === actor1)
          const indice2 = nombresActores.findIndex((nombre) => nombre === actor2)

          if (indice1 !== -1 && indice2 !== -1) {
            evitarPares.push([indice1 + 1, indice2 + 1]) // +1 porque los IDs empiezan en 1
          }
        }
      })
    }

    // Crear objetos de actores
    data.actores = nombresActores.map((nombre, index) => ({
      id: index + 1,
      nombre,
      costoPorMinuto: costos[index] || 0,
      disponibilidad: disponibilidad[index] || 0,
    }))

    // Crear objetos de escenas
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

    // Guardar datos originales
    data.datosOriginales.participacion = matrizEscenas
    data.datosOriginales.costos = costos
    data.datosOriginales.duraciones = duraciones
    data.datosOriginales.disponibilidad = disponibilidad
    data.datosOriginales.evitar_pares = evitarPares

    // Verificar que se hayan extraído datos válidos
    if (data.actores.length === 0 || data.escenas.length === 0) {
      throw new Error("No se pudieron extraer datos válidos del archivo")
    }

    return data
  } catch (error) {
    throw new Error(`Error al parsear el archivo: ${error.message}`)
  }
}
