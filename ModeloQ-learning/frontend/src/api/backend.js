import axios from 'axios'

const API = axios.create({ 
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para manejo de errores
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

/**
 * Obtiene el estado actual de la simulación
 * Incluye: grid, agentes, blackboard, meta
 */
export async function getState() {
  try {
    const response = await API.get('/state')
    return response.data
  } catch (error) {
    console.error('Error getting state:', error)
    return null
  }
}

/**
 * Inicia el entrenamiento con parámetros específicos
 * @param {Object} payload - { episodes, steps_per_episode, alpha, gamma, eps }
 */
export async function startTrain(payload) {
  try {
    const response = await API.post('/train', payload)
    return response.data
  } catch (error) {
    console.error('Error starting training:', error)
    throw error
  }
}

/**
 * Detiene el entrenamiento actual
 */
export async function stopTrain() {
  try {
    const response = await API.post('/stop')
    return response.data
  } catch (error) {
    console.error('Error stopping training:', error)
    throw error
  }
}

/**
 * Actualiza los parámetros de Q-Learning
 * @param {Object} params - { alpha?, gamma?, eps?, eps_decay? }
 */
export async function updateParams(params) {
  try {
    const response = await API.post('/params', params)
    return response.data
  } catch (error) {
    console.error('Error updating params:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas de entrenamiento
 * Incluye: episodes[], best_reward, best_episode, etc.
 */
export async function getStats() {
  try {
    const response = await API.get('/stats')
    return response.data
  } catch (error) {
    console.error('Error getting stats:', error)
    return { episodes: [] }
  }
}

/**
 * Guarda las tablas Q en disco
 */
export async function saveQ() {
  try {
    const response = await API.post('/save')
    console.log('✅ Q-tables saved:', response.data)
    return response.data
  } catch (error) {
    console.error('Error saving Q-tables:', error)
    throw error
  }
}

/**
 * Carga las tablas Q desde disco
 */
export async function loadQ() {
  try {
    const response = await API.post('/load')
    console.log('✅ Q-tables loaded:', response.data)
    return response.data
  } catch (error) {
    console.error('Error loading Q-tables:', error)
    throw error
  }
}

/**
 * Inicia la ejecución del modelo entrenado en tiempo real
 * NOTA: Este endpoint NO devuelve frames, solo inicia la ejecución
 */
export async function runTrainedModel() {
  try {
    const response = await API.post('/run-trained')
    console.log('✅ Trained model started:', response.data)
    return response.data
  } catch (error) {
    console.error('Error running trained model:', error)
    throw error
  }
}

/**
 * Detiene la ejecución del modelo entrenado
 */
export async function stopTrained() {
  try {
    const response = await API.post('/stop-trained')
    console.log('✅ Trained model stopped:', response.data)
    return response.data
  } catch (error) {
    console.error('Error stopping trained model:', error)
    throw error
  }
}

/**
 * Obtiene progreso del entrenamiento en tiempo real
 * (polling cada segundo para actualizar UI)
 */
export async function getTrainingProgress() {
  try {
    const [state, stats] = await Promise.all([
      getState(),
      getStats()
    ])
    
    return {
      isTraining: state?.meta?.is_training || false,
      isRunning: state?.meta?.is_running_trained || false,
      currentStep: state?.meta?.step || 0,
      totalHarvested: state?.meta?.harvested_total || 0,
      episodes: stats?.episodes || [],
      bestReward: stats?.best_reward || 0,
      bestEpisode: stats?.best_episode || 0
    }
  } catch (error) {
    console.error('Error getting training progress:', error)
    return null
  }
}

export default API