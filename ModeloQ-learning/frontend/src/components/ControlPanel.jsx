import React, { useState } from 'react'
import {
  startTrain, stopTrain, updateParams, saveQ, loadQ, runTrainedModel
} from '../api/backend'

export default function ControlPanel({ onSimData }) {
  const [alpha, setAlpha] = useState(0.3)
  const [gamma, setGamma] = useState(0.9)
  const [eps, setEps] = useState(0.25)
  const [episodes, setEpisodes] = useState(20)
  const [steps, setSteps] = useState(400)
  const [loadingSim, setLoadingSim] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    } catch (e) {
      console.error(e)
      setIsTraining(false)
    }
  }

  const onStop = async () => {
    await stopTrain()
    setIsTraining(false)
  }

  const onUpdate = async () => {
    await updateParams({ alpha, gamma, eps })
  }

  const onSave = async () => {
    await saveQ()
  }

  const onLoad = async () => {
    await loadQ()
  }

  const onRunTrained = async () => {
    try {
      setLoadingSim(true)
      const data = await runTrainedModel({
        steps: 350,
        width: 40,
        height: 24,
        n_agents: 3
      })
      if (data && data.frames) {
        if (onSimData) onSimData(data.frames)
      } else {
        console.warn('runTrainedModel returned unexpected payload', data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSim(false)
    }
  }

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #334155',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    iconBox: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      margin: 0
    },
    trainingBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      padding: '4px 12px',
      borderRadius: '9999px',
      border: '1px solid rgba(34, 197, 94, 0.5)'
    },
    trainingDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#22c55e',
      borderRadius: '50%',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    trainingText: {
      color: '#4ade80',
      fontSize: '14px',
      fontWeight: '600'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#cbd5e1',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px'
    },
    inputGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#94a3b8'
    },
    input: {
      width: '100%',
      backgroundColor: '#1e293b',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '8px 16px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s'
    },
    advancedButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      color: '#cbd5e1',
      cursor: 'pointer',
      padding: '8px 0',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '12px',
      transition: 'color 0.2s'
    },
    advancedContent: {
      paddingLeft: '28px',
      display: showAdvanced ? 'block' : 'none'
    },
    sliderGroup: {
      marginBottom: '16px'
    },
    sliderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    sliderValue: {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontWeight: '600'
    },
    slider: {
      width: '100%',
      height: '8px',
      borderRadius: '8px',
      backgroundColor: '#334155',
      outline: 'none',
      cursor: 'pointer'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '12px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    },
    buttonStart: {
      background: isTraining ? '#334155' : 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
      color: '#ffffff',
      cursor: isTraining ? 'not-allowed' : 'pointer',
      opacity: isTraining ? 0.6 : 1
    },
    buttonStop: {
      background: !isTraining ? '#334155' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff',
      cursor: !isTraining ? 'not-allowed' : 'pointer',
      opacity: !isTraining ? 0.6 : 1
    },
    buttonSave: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      color: '#ffffff'
    },
    buttonLoad: {
      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
      color: '#ffffff'
    },
    buttonUpdate: {
      width: '100%',
      background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
      color: '#ffffff',
      marginTop: '16px'
    },
    buttonRun: {
      width: '100%',
      background: loadingSim ? '#334155' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
      color: '#ffffff',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: loadingSim ? 'not-allowed' : 'pointer',
      opacity: loadingSim ? 0.6 : 1,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
    },
    footer: {
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #334155',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#94a3b8',
      fontSize: '14px'
    },
    spinner: {
      animation: 'spin 1s linear infinite',
      width: '20px',
      height: '20px'
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconBox}>
            <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 style={styles.title}>Control Panel</h3>
        </div>
        {isTraining && (
          <div style={styles.trainingBadge}>
            <div style={styles.trainingDot}></div>
            <span style={styles.trainingText}>Training</span>
          </div>
        )}
      </div>

      {/* Training Configuration */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={styles.sectionTitle}>
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Training Configuration
        </h4>

        <div style={styles.inputGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Episodes</label>
            <input
              type="number"
              value={episodes}
              onChange={e => setEpisodes(+e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Steps/Episode</label>
            <input
              type="number"
              value={steps}
              onChange={e => setSteps(+e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Advanced Parameters */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedButton}
          onMouseEnter={e => e.target.style.color = '#ffffff'}
          onMouseLeave={e => e.target.style.color = '#cbd5e1'}
        >
          <svg
            style={{
              width: '20px',
              height: '20px',
              transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced Parameters
        </button>

        <div style={styles.advancedContent}>
          <div style={styles.sliderGroup}>
            <div style={styles.sliderHeader}>
              <label style={styles.label}>Alpha (Learning Rate)</label>
              <span style={{ ...styles.sliderValue, color: '#3b82f6' }}>{alpha}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={alpha}
              onChange={e => setAlpha(+e.target.value)}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderGroup}>
            <div style={styles.sliderHeader}>
              <label style={styles.label}>Gamma (Discount Factor)</label>
              <span style={{ ...styles.sliderValue, color: '#a855f7' }}>{gamma}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={gamma}
              onChange={e => setGamma(+e.target.value)}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderGroup}>
            <div style={styles.sliderHeader}>
              <label style={styles.label}>Epsilon (Exploration)</label>
              <span style={{ ...styles.sliderValue, color: '#22c55e' }}>{eps}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={eps}
              onChange={e => setEps(+e.target.value)}
              style={styles.slider}
            />
          </div>

          <button
            onClick={onUpdate}
            style={{ ...styles.button, ...styles.buttonUpdate }}
            onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
          >
            Update Parameters
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div>
        <div style={styles.buttonGrid}>
          <button
            onClick={onStart}
            disabled={isTraining}
            style={{ ...styles.button, ...styles.buttonStart }}
            onMouseEnter={e => !isTraining && (e.target.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Start Training
          </button>

          <button
            onClick={onStop}
            disabled={!isTraining}
            style={{ ...styles.button, ...styles.buttonStop }}
            onMouseEnter={e => isTraining && (e.target.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop
          </button>
        </div>

        <div style={styles.buttonGrid}>
          <button
            onClick={onSave}
            style={{ ...styles.button, ...styles.buttonSave }}
            onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Q-Table
          </button>

          <button
            onClick={onLoad}
            style={{ ...styles.button, ...styles.buttonLoad }}
            onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load Q-Table
          </button>
        </div>

        <button
          onClick={onRunTrained}
          disabled={loadingSim}
          style={{ ...styles.button, ...styles.buttonRun, marginTop: '12px' }}
          onMouseEnter={e => !loadingSim && (e.target.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
        >
          {loadingSim ? (
            <>
              <svg style={styles.spinner} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Simulation...
            </>
          ) : (
            <>
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run Trained Model
            </>
          )}
        </button>
      </div>

      {/* Info Footer */}
      <div style={styles.footer}>
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Configure parameters before training</span>
      </div>
    </div>
  )
}