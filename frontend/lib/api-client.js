/**
 * Cliente para comunicarse con los endpoints del backend
 */

/**
 * Envía un archivo al endpoint de la parte 1
 * @param {File} file - Archivo .dzn a procesar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function procesarArchivoParte1(file) {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 minutos

    // const response = await fetch("https://minizinc-novelas.onrender.com/parte_1/", {
    const response = await fetch("http://127.0.0.1:8000/parte_1/", {
      method: "POST",
      body: formData,
      signal: controller.signal
    })

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || `Error del servidor: ${response.status}`;
      if (response.status === 408 || response.status === 504) { // Request Timeout or Gateway Timeout
        throw new Error("La solicitud excedió el tiempo de espera del servidor.");
      }
      throw new Error(errorMessage);
    }

    const resultado = await response.json()

    // Adaptar el formato de respuesta para que funcione con nuestras visualizaciones
    return adaptarRespuestaBackend(resultado)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("La solicitud tardó demasiado en responder (más de 15 minutos).");
    } else if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en https://minizinc-novelas.onrender.com/parte_1/"
      );
    }
    throw error;
  }
}

/**
 * Envía un archivo al endpoint de la parte 2
 * @param {File} file - Archivo .dzn a procesar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function procesarArchivoParte2(file) {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 minutos

    // const response = await fetch("https://minizinc-novelas.onrender.com/parte_2/", {
    const response = await fetch("http://127.0.0.1:8000/parte_2/", {
      method: "POST",
      body: formData,
      signal: controller.signal
    })

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || `Error del servidor: ${response.status}`;
      if (response.status === 408 || response.status === 504) { // Request Timeout or Gateway Timeout
        throw new Error("La solicitud excedió el tiempo de espera del servidor.");
      }
      throw new Error(errorMessage);
    }

    console.log("respuesta del modelo", response);

    const resultado = await response.json()

    // Adaptar el formato de respuesta para que funcione con nuestras visualizaciones
    return adaptarRespuestaBackend(resultado)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("La solicitud tardó demasiado en responder (más de 15 minutos).");
    } else if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en https://minizinc-novelas.onrender.com/parte_2/"
      );
    }
    throw error;
  }
}

/**
 * Adapta la respuesta del backend al formato esperado por las visualizaciones
 * @param {Object} respuestaBackend - Respuesta original del backend
 * @returns {Object} Respuesta adaptada
 */
function adaptarRespuestaBackend(respuestaBackend, data) {
  // Crear un mapa para buscar rápidamente los actores participantes por escena
  const actorParticipatingScenes = new Map(); // Map de actorId a un array de objetos de escena

  if (data && data.escenas) {
    data.escenas.forEach(scene => {
      scene.actoresParticipantes.forEach(actorId => {
        if (!actorParticipatingScenes.has(actorId)) {
          actorParticipatingScenes.set(actorId, []);
        }
        actorParticipatingScenes.get(actorId).push(scene);
      });
    });
  }

  // Crear un mapa para buscar rápidamente el ID del actor por nombre
  const actorNameToIdMap = new Map();
  if (data && data.actores) {
    data.actores.forEach(actor => {
      actorNameToIdMap.set(actor.nombre, actor.id);
    });
  }

  const adaptedResponse = {
    ordenEscenas: respuestaBackend.orden_escenas,
    costoTotal: respuestaBackend.costo_total,
    costosActores: respuestaBackend.detalles_por_actor.map((actor) => {
      // Extraer el ID numérico del nombre del actor (ej. "Actor1" -> 1, "1" -> 1)
      const match = actor.nombre.match(/\d+/);
      const currentActorId = match ? parseInt(match[0], 10) : -1;

      // Usar directamente el tiempo_en_estudio que viene del backend
      const tiempoTotal = actor.tiempo_en_estudio;

      const adaptedCostosActor = {
        actorId: currentActorId !== undefined ? currentActorId : -1, // Fallback si no se encuentra el ID
        tiempoTotal: tiempoTotal,
        costoTotal: actor.costo,
      };

      return adaptedCostosActor;
    }),
    tiempo_compartido_actores_evitar: respuestaBackend.tiempo_compartido_actores_evitar,
  };

  return adaptedResponse;
}

/**
 * Calcula el costo inicial estimado antes de enviar al backend
 * @param {Object} data - Datos parseados del archivo
 * @returns {Object} Estimación de costos
 */
export function calcularCostoInicial(data) {
  if (!data || !data.actores || !data.escenas) {
    return { costoEstimado: 0, duracionTotal: 0 }
  }

  // Calcular duración total
  const duracionTotal = data.escenas.reduce((total, escena) => total + escena.duracion, 0)

  // Estimación simple: cada actor participa en promedio en la mitad de las escenas
  let costoEstimado = 0
  data.actores.forEach((actor) => {
    const escenasParticipadas = data.escenas.filter((escena) => escena.actoresParticipantes.includes(actor.id)).length

    // Estimar tiempo en set (desde primera hasta última escena)
    const tiempoEstimado = escenasParticipadas > 0 ? duracionTotal * 0.6 : 0
    costoEstimado += tiempoEstimado * actor.costoPorMinuto
  })

  return {
    costoEstimado: Math.round(costoEstimado),
    duracionTotal,
  }
}

/**
 * Simula una respuesta del endpoint parte_2 para desarrollo
 * @param {Object} respuestaParte1 - Respuesta de la parte 1
 * @returns {Object} Respuesta simulada para parte 2
 */
export function simularRespuestaParte2(respuestaParte1) {
  // Simular que la parte 2 encuentra una solución ligeramente diferente y más optimizada
  const ordenModificado = [...respuestaParte1.orden_escenas]

  // Intercambiar algunas escenas para simular optimización
  if (ordenModificado.length > 2) {
    ;[ordenModificado[0], ordenModificado[1]] = [ordenModificado[1], ordenModificado[0]]
  }

  // Reducir el costo total en un 5-15% para simular mejor optimización
  const factorOptimizacion = 0.85 + Math.random() * 0.1 // Entre 0.85 y 0.95
  const costoOptimizado = Math.round(respuestaParte1.costo_total * factorOptimizacion)

  return {
    orden_escenas: ordenModificado,
    costo_total: costoOptimizado,
    detalles_por_actor: respuestaParte1.detalles_por_actor.map((actor) => ({
      ...actor,
      costo: Math.round(actor.costo * factorOptimizacion),
    })),
    // Campos adicionales para el modelo avanzado
    tiempo_compartido_actores_evitar: 0,
    restricciones_aplicadas: {
      disponibilidad: true,
      evitar_coincidencias: true,
      eliminar_simetrias: true,
    },
  }
}
