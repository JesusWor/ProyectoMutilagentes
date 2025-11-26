import React, { useState, useEffect } from 'react'
import {
  startTrain, stopTrain, updateParams, saveQ, loadQ, 
  runTrainedModel, stopTrained, getTrainingProgress
} from '../api/backend'

export default function ControlPanel({ onSimData }) {
  const [alpha, setAlpha] = useState(0.5)
  const [gamma, setGamma] = useState(0.95)
  const [eps, setEps] = useState(0.4)
  const [episodes, setEpisodes] = useState(50)
  const [steps, setSteps] = useState(400)
  const [isTraining, setIsTraining] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Nuevos estados para progreso
  const [progress, setProgress] = useState({
    currentEpisode: 0,
    totalEpisodes: 0,
    currentReward: 0,
    bestReward: 0,
    totalHarvested: 0,
    avgEpsilon: 0,
    statesLearned: 0
  })
  
  const [notifications, setNotifications] = useState([])

  // Monitoreo de progreso en tiempo real
  useEffect(() => {
    if (!isTraining) return
    
    const interval = setInterval(async () => {
      try {
        const data = await getTrainingProgress()
        if (data) {
          const episodes = data.episodes || []
          const lastEp = episodes[episodes.length - 1]
          
          setProgress({
            currentEpisode: lastEp?.episode || 0,
            totalEpisodes: episodes,
            currentReward: lastEp?.reward || 0,
            bestReward: data.bestReward || 0,
            totalHarvested: data.totalHarvested || 0,
            avgEpsilon: lastEp?.avg_epsilon || 0,
            statesLearned: lastEp?.total_states_learned || 0
          })
        }
      } catch (e) {
        console.error('Error fetching progress:', e)
      }
    }, 1000) // Actualizar cada segundo
    
    return () => clearInterval(interval)
  }, [isTraining])

  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const onStart = async () => {
    try {
      setIsTraining(true)
      await startTrain({
        episodes,
        steps_per_episode: steps,
        alpha,
        gamma,
        eps
      })
      addNotification(`Entrenamiento iniciado: ${episodes} episodios`, 'success')
    } catch (e) {
      console.error(e)
      setIsTraining(false)
      addNotification('Error al iniciar entrenamiento', 'error')
    }
  }

  const onStop = async () => {
    try {
      await stopTrain()
      setIsTraining(false)
      addNotification('Entrenamiento detenido', 'info')
    } catch (e) {
      console.error(e)
      addNotification('Error al detener', 'error')
    }
  }

  const onUpdate = async () => {
    try {
      await updateParams({ alpha, gamma, eps })
      addNotification('Parámetros actualizados', 'success')
    } catch (e) {
      addNotification('Error al actualizar parámetros', 'error')
    }
  }

  const onSave = async () => {
    try {
      await saveQ()
      addNotification('Q-Tables guardadas exitosamente', 'success')
    } catch (e) {
      addNotification('Error al guardar', 'error')
    }
  }

  const onLoad = async () => {
    try {
      const result = await loadQ()
      if (result.status === 'loaded') {
        addNotification('Q-Tables cargadas exitosamente', 'success')
      } else {
        addNotification('No se encontró modelo guardado', 'warning')
      }
    } catch (e) {
      addNotification('Error al cargar', 'error')
    }
  }

  const onRunTrained = async () => {
    try {
      setIsRunning(true)
      await runTrainedModel()
      addNotification('Modelo en ejecución', 'success')
    } catch (e) {
      console.error(e)
      setIsRunning(false)
      addNotification('Error al ejecutar modelo', 'error')
    }
  }

  const onStopTrained = async () => {
    try {
      await stopTrained()
      setIsRunning(false)
      addNotification('Ejecución detenida', 'info')
    } catch (e) {
      addNotification('Error al detener ejecución', 'error')
    }
  }

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #334155',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
    },
    // ... (mantener todos los estilos anteriores)
    progressSection: {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      border: '1px solid #334155'
    },
    progressGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '12px'
    },
    statCard: {
      background: 'rgba(59, 130, 246, 0.1)',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid rgba(59, 130, 246, 0.3)'
    },
    statLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      marginBottom: '4px'
    },
    statValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#334155',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
      transition: 'width 0.3s ease'
    },
    notifications: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    notification: {
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease',
      fontWeight: '600',
      maxWidth: '300px'
    },
    notifSuccess: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff'
    },
    notifError: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff'
    },
    notifInfo: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: '#ffffff'
    },
    notifWarning: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#ffffff'
    }
  }

  const progressPercentage = episodes > 0 
    ? Math.min(100, (progress.currentEpisode / episodes) * 100) 
    : 0

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>

      {/* Notificaciones */}
      <div style={styles.notifications}>
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            style={{
              ...styles.notification,
              ...(notif.type === 'success' ? styles.notifSuccess : {}),
              ...(notif.type === 'error' ? styles.notifError : {}),
              ...(notif.type === 'info' ? styles.notifInfo : {}),
              ...(notif.type === 'warning' ? styles.notifWarning : {})
            }}
          >
            {notif.message}
          </div>
        ))}
      </div>

      <div style={styles.container}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '80px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>Robot</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
              Control Panel
            </h3>
          </div>
          {isTraining && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(34, 197, 94, 0.5)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600' }}>
                Training
              </span>
            </div>
          )}
        </div>

        {/* Progreso del Entrenamiento */}
        {isTraining && (
          <div style={styles.progressSection}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>
              Progreso del Entrenamiento
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Episodio {progress.currentEpisode} / {episodes}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            <div style={styles.progressGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Reward Actual</div>
                <div style={styles.statValue}>{progress.currentReward.toFixed(1)}</div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Mejor Reward</div>
                <div style={styles.statValue}>{progress.bestReward.toFixed(1)}</div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Cosechado</div>
                <div style={styles.statValue}>{progress.totalHarvested}</div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Estados Aprendidos</div>
                <div style={styles.statValue}>{progress.statesLearned}</div>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de Entrenamiento */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#cbd5e1', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '16px' 
          }}>
            Training Configuration
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Episodes
              </label>
              <input
                type="number"
                value={episodes}
                onChange={e => setEpisodes(+e.target.value)}
                style={{
                  width: '80%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Steps/Episode
              </label>
              <input
                type="number"
                value={steps}
                onChange={e => setSteps(+e.target.value)}
                style={{
                  width: '80%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Parámetros Avanzados */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '8px 0',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ 
              transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>▶</span>
            Advanced Parameters
          </button>

          {showAdvanced && (
            <div style={{ paddingLeft: '28px', marginTop: '12px' }}>
              {/* Alpha */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Alpha (Learning Rate)
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                    {alpha}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={alpha}
                  onChange={e => setAlpha(+e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Gamma */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Gamma (Discount Factor)
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#a855f7' }}>
                    {gamma}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={gamma}
                  onChange={e => setGamma(+e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Epsilon */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Epsilon (Exploration)
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                    {eps}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={eps}
                  onChange={e => setEps(+e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                onClick={onUpdate}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Update Parameters
              </button>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <button
            onClick={onStart}
            disabled={isTraining}
            style={{
              padding: '12px',
              background: isTraining ? '#334155' : 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: isTraining ? 'not-allowed' : 'pointer',
              opacity: isTraining ? 0.6 : 1
            }}
          >
            Start Training
          </button>

          <button
            onClick={onStop}
            disabled={!isTraining}
            style={{
              padding: '12px',
              background: !isTraining ? '#334155' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: !isTraining ? 'not-allowed' : 'pointer',
              opacity: !isTraining ? 0.6 : 1
            }}
          >
            Stop
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <button
            onClick={onSave}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Save Q-Table
          </button>

          <button
            onClick={onLoad}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Load Q-Table
          </button>
        </div>

        <button
          onClick={isRunning ? onStopTrained : onRunTrained}
          style={{
            width: '100%',
            padding: '16px',
            background: isRunning 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
            color: '#ffffff',
          border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {isRunning ? 'Stop Trained Model' : '⚡ Run Trained Model'}
        </button>
      </div>
    </>
  )
}