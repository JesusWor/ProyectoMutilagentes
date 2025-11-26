import React, { useState } from 'react'
import ControlPanel from './components/ControlPanel'
import FieldGrid from './components/FieldGrid'
import LearningCurve from './components/LearningCurve'

export default function App() {
  const [simFrames, setSimFrames] = useState(null)

  const styles = {
    app: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
      paddingTop: '20px'
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '12px'
    },
    subtitle: {
      fontSize: '20px',
      color: '#94a3b8',
      fontWeight: '500'
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '350px 1fr',
      gap: '24px',
      maxWidth: '1800px',
      margin: '0 auto'
    },
    leftColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    rightColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    gridContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    },
    footer: {
      textAlign: 'center',
      marginTop: '40px',
      paddingBottom: '20px',
      color: '#64748b',
      fontSize: '14px'
    }
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          Farm Multi-Agent Q-Learning + A* simulation
        </h1>
      </div>

      {/* Main Layout */}
      <div style={styles.layout}>
        {/* Left Column: Control Panel */}
        <div style={styles.leftColumn}>
          <ControlPanel onSimData={setSimFrames} />
          <LearningCurve />
        </div>

        {/* Right Column: Field Grid */}
        <div style={styles.rightColumn}>
          <div style={styles.gridContainer}>
            <FieldGrid simFrames={simFrames} />
          </div>
        </div>
      </div>
    </div>
  )
}