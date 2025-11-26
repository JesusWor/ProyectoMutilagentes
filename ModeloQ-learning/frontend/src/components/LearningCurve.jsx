import React, { useEffect, useState } from 'react'
import { getStats } from '../api/backend'

export default function LearningCurve() {
  const [stats, setStats] = useState({ episodes: [] })
  const [selectedMetric, setSelectedMetric] = useState('reward')

  useEffect(() => {
    let mounted = true
    async function loop() {
      try {
        const s = await getStats()
        if (!mounted) return
        setStats(s || { episodes: [] })
      } catch (e) {
        console.error('Error fetching stats:', e)
      }
      if (!mounted) return
      setTimeout(loop, 2000)
    }
    loop()
    return () => { mounted = false }
  }, [])

  const episodes = stats.episodes || []
  const lastEpisodes = episodes.slice(-20)

  // Calcular estadísticas
  const totalEpisodes = episodes.length
  const avgReward = episodes.length > 0
    ? episodes.reduce((sum, ep) => sum + ep.reward, 0) / episodes.length
    : 0
  const bestReward = stats.best_reward || 0
  const bestEpisode = stats.best_episode || 0
  const totalHarvested = episodes.length > 0
    ? episodes[episodes.length - 1]?.harvested || 0
    : 0

  // Preparar datos para mini-gráfica
  const maxValue = selectedMetric === 'reward'
    ? Math.max(...lastEpisodes.map(e => e.reward || 0), 1)
    : Math.max(...lastEpisodes.map(e => e.harvested || 0), 1)

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #334155',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      background: 'rgba(59, 130, 246, 0.1)',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid rgba(59, 130, 246, 0.3)'
    },
    statLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      marginBottom: '8px',
      fontWeight: '600'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff'
    },
    statSubtext: {
      fontSize: '11px',
      color: '#64748b',
      marginTop: '4px'
    },
    chartContainer: {
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid #334155'
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    chartTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#cbd5e1'
    },
    metricSelector: {
      display: 'flex',
      gap: '8px'
    },
    metricButton: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    metricButtonActive: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: '#ffffff'
    },
    metricButtonInactive: {
      background: '#334155',
      color: '#94a3b8'
    },
    chart: {
      width: '100%',
      height: '150px',
      position: 'relative'
    },
    chartBar: {
      display: 'inline-block',
      width: '100%',
      background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
      borderRadius: '2px 2px 0 0',
      transition: 'height 0.3s ease'
    },
    tableContainer: {
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #334155',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '12px',
      fontFamily: 'monospace'
    },
    th: {
      textAlign: 'left',
      padding: '8px',
      color: '#94a3b8',
      fontWeight: '600',
      borderBottom: '2px solid #334155',
      position: 'sticky',
      top: 0,
      background: '#1e293b'
    },
    td: {
      padding: '8px',
      color: '#cbd5e1',
      borderBottom: '1px solid #334155'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#64748b',
      fontSize: '14px'
    }
  }

  if (totalEpisodes === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <span>📊</span>
            Training Statistics
          </h3>
        </div>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📉</div>
          <div>No training data available yet.</div>
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            Start training to see statistics here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          <span>📊</span>
          Training Statistics
        </h3>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Episodes</div>
          <div style={styles.statValue}>{totalEpisodes}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Best Reward</div>
          <div style={styles.statValue}>{bestReward.toFixed(1)}</div>
          <div style={styles.statSubtext}>Episode {bestEpisode}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg Reward</div>
          <div style={styles.statValue}>{avgReward.toFixed(1)}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Harvested</div>
          <div style={styles.statValue}>{totalHarvested}</div>
          <div style={styles.statSubtext}>Last episode</div>
        </div>
      </div>

      {/* Chart */}
      <div style={styles.chartContainer}>
        <div style={styles.chartHeader}>
          <div style={styles.chartTitle}>
            Last 20 Episodes
          </div>
          <div style={styles.metricSelector}>
            <button
              onClick={() => setSelectedMetric('reward')}
              style={{
                ...styles.metricButton,
                ...(selectedMetric === 'reward' 
                  ? styles.metricButtonActive 
                  : styles.metricButtonInactive)
              }}
            >
              Reward
            </button>
            <button
              onClick={() => setSelectedMetric('harvested')}
              style={{
                ...styles.metricButton,
                ...(selectedMetric === 'harvested' 
                  ? styles.metricButtonActive 
                  : styles.metricButtonInactive)
              }}
            >
              Harvested
            </button>
          </div>
        </div>

        <div style={styles.chart}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            height: '100%', 
            gap: '2px' 
          }}>
            {lastEpisodes.map((ep, idx) => {
              const value = selectedMetric === 'reward' ? ep.reward : ep.harvested
              const height = (value / maxValue) * 100
              
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${height}%`,
                    background: selectedMetric === 'reward'
                      ? 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)'
                      : 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: '2px'
                  }}
                  title={`Ep ${ep.episode}: ${value.toFixed(1)}`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Episodes Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ep</th>
              <th style={styles.th}>Reward</th>
              <th style={styles.th}>Harvested</th>
              <th style={styles.th}>Epsilon</th>
              <th style={styles.th}>States</th>
            </tr>
          </thead>
          <tbody>
            {lastEpisodes.slice().reverse().map((ep, idx) => (
              <tr key={idx}>
                <td style={styles.td}>{ep.episode}</td>
                <td style={styles.td}>{ep.reward?.toFixed(1) || 0}</td>
                <td style={styles.td}>{ep.harvested || 0}</td>
                <td style={styles.td}>{ep.avg_epsilon?.toFixed(3) || 0}</td>
                <td style={styles.td}>{ep.total_states_learned || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}