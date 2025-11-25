import React, { useRef, useEffect, useState } from 'react'
import { getState } from '../api/backend'

/**
 * FieldGrid
 * - Si recibe "simFrames" anima esos frames (frame loop via requestAnimationFrame)
 * - Si no recibe "simFrames", usa polling con getState()
 * - Soporta agentes en dos formatos:
 *   - [{id:0,pos:[x,y],role:'...'}, ...] (objeto)
 *   - [[x,y], [x,y], ...] (lista de posiciones)
 * - Usa devicePixelRatio para canvas nítido
 */
export default function FieldGrid({ simFrames = null }) {
  const canvasRef = useRef(null)
  const [gridData, setGridData] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const [showMessages, setShowMessages] = useState(true)

  // REALTIME MODE (poll every 300 ms)
  useEffect(() => {
    if (simFrames || isPaused) return
    let mounted = true
    async function loop() {
      try {
        const data = await getState()
        if (!mounted) return
        setGridData(data)
      } catch (e) {
        // console.warn(e)
      }
      if (!mounted) return
      setTimeout(loop, 300)
    }
    loop()
    return () => {
      mounted = false
    }
  }, [simFrames, isPaused])

  // ANIMATION MODE (frames provistos por backend)
  useEffect(() => {
    if (!simFrames || isPaused) return
    let mounted = true
    let idx = 0
    function tick() {
      if (!mounted) return
      setGridData(simFrames[idx])
      idx = (idx + 1) % simFrames.length
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => {
      mounted = false
    }
  }, [simFrames, isPaused])

  // DRAW ON CANVAS
  useEffect(() => {
    if (!gridData) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const grid = gridData.grid
    const h = grid.length
    const w = grid[0].length

    // tile size in CSS pixels (adjust if you want larger/smaller)
    const tile = 25

    // handle high DPI screens
    const DPR = window.devicePixelRatio || 1
    canvas.style.width = (w * tile) + 'px'
    canvas.style.height = (h * tile) + 'px'
    canvas.width = Math.floor(w * tile * DPR)
    canvas.height = Math.floor(h * tile * DPR)
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0) // draw in CSS pixels

    // clear
    ctx.clearRect(0, 0, w * tile, h * tile)

    // pintar celdas
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = grid[y][x]
        let color = '#bdbdbd' // empty
        if (v === 1) color = '#000000' // obst
        else if (v === 2) color = '#2ecc71' // crop
        else if (v === 3) color = '#f4d03f' // path
        else if (v === 4) color = '#3498db' // manager
        else if (v === 5) color = '#55aaff' // water / other
        ctx.fillStyle = color
        ctx.fillRect(x * tile, y * tile, tile, tile)
      }
    }

    // draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x++) {
      ctx.beginPath()
      ctx.moveTo(x * tile, 0)
      ctx.lineTo(x * tile, h * tile)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * tile)
      ctx.lineTo(w * tile, y * tile)
      ctx.stroke()
    }

    // agentes: admite dos formatos
    const agentsRaw = gridData.agents || []
    const agents = agentsRaw.map((ag, idx) => {
      if (Array.isArray(ag)) return { id: idx, pos: ag }
      if (ag && ag.pos) return {
        id: ag.id ?? idx,
        pos: Array.isArray(ag.pos) ? ag.pos : [ag.pos[0], ag.pos[1]]
      }
      return { id: idx, pos: [0, 0] }
    })

    agents.forEach((ag, idx) => {
      const colorArr = ['#d62828','#2a9d8f','#f4a261','#4cc9f0','#8e44ad','#ffb703']
      const color = colorArr[idx % colorArr.length]
      const [ax, ay] = ag.pos

      // circle with small shadow
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 6
      const radius = tile * 0.42
      ctx.arc(ax * tile + tile / 2, ay * tile + tile / 2, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
      ctx.shadowBlur = 0

      // label
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.max(10, tile * 0.32)}px sans-serif`
      ctx.textBaseline = 'middle'
      ctx.fillText('A' + ag.id, ax * tile + 4, ay * tile + tile / 2)
    })

    // LEYENDA (bottom-right)
    if (showLegend) {
      const legendW = 160
      const legendH = 140
      const legendX = Math.max(8, w * tile - legendW - 8)
      const legendY = Math.max(8, h * tile - legendH - 8)
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      roundRect(ctx, legendX, legendY, legendW, legendH, 8, true, false)

      const items = [
        ['Empty', '#bdbdbd'],
        ['Obstacle', '#000000'],
        ['Crop', '#2ecc71'],
        ['Path', '#f4d03f'],
        ['Manager', '#3498db'],
        ['Water', '#55aaff']
      ]
      ctx.font = 'bold 11px sans-serif'
      items.forEach((it, i) => {
        const y0 = legendY + 12 + i * 20
        // Sombra sutil en los cuadros de color
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 3
        ctx.fillStyle = it[1]
        ctx.fillRect(legendX + 8, y0, 14, 14)
        ctx.shadowBlur = 0
        
        ctx.fillStyle = '#fff'
        ctx.fillText(it[0], legendX + 30, y0 + 11)
      })
    }

    // MENSAJES DEL BLACKBOARD (top-left overlay)
    if (showMessages) {
      const anns = (gridData.blackboard?.announcements || []).slice(-4)
      if (anns.length > 0) {
        const msgW = 400
        const msgH = 20 + anns.length * 20
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        roundRect(ctx, 8, 8, msgW, msgH, 8, true, false)
        
        ctx.fillStyle = '#00ff88'
        ctx.font = 'bold 13px monospace'
        anns.forEach((a, i) => {
          const txt = (typeof a === 'string') ? a : (a[1] || String(a))
          ctx.fillText(txt.slice(0, 55), 16, 28 + i * 20)
        })
      }
    }

    // helper: rounded rect
    function roundRect(ctx, x, y, w, h, r) {
      if (typeof r === 'undefined') r = 5
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
      ctx.fill()
    }
  }, [gridData, showLegend, showMessages])

  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block'
    },
    canvas: {
      display: 'block',
      borderRadius: '8px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '2px solid #374151'
    },
    controlPanel: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    },
    pauseButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: '#ffffff'
    },
    legendButtonActive: {
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#ffffff'
    },
    legendButtonInactive: {
      background: '#374151',
      color: '#d1d5db'
    },
    messagesButtonActive: {
      background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      color: '#ffffff'
    },
    messagesButtonInactive: {
      background: '#374151',
      color: '#d1d5db'
    },
    infoBadge: {
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      border: '1px solid #374151'
    },
    infoBadgeTitle: {
      fontSize: '10px',
      fontWeight: '600',
      color: '#9ca3af',
      marginBottom: '4px'
    },
    infoBadgeContent: {
      fontSize: '14px',
      fontFamily: 'monospace'
    }
  }

  return (
    <div style={styles.container}>
      <canvas 
        ref={canvasRef} 
        style={styles.canvas}
      />
      
      {/* Control Panel */}
      <div style={styles.controlPanel}>
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{ ...styles.button, ...styles.pauseButton }}
          onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
        >
          {isPaused ? (
            <>
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Play
            </>
          ) : (
            <>
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
              </svg>
              Pause
            </>
          )}
        </button>
        
        <button
          onClick={() => setShowLegend(!showLegend)}
          style={{
            ...styles.button,
            ...(showLegend ? styles.legendButtonActive : styles.legendButtonInactive)
          }}
          onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
        >
          {showLegend ? 'Hide' : 'Show'} Legend
        </button>
        
        <button
          onClick={() => setShowMessages(!showMessages)}
          style={{
            ...styles.button,
            ...(showMessages ? styles.messagesButtonActive : styles.messagesButtonInactive)
          }}
          onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
        >
          {showMessages ? 'Hide' : 'Show'} Messages
        </button>
      </div>
      
      {/* Info Badge */}
      {gridData && (
        <div style={styles.infoBadge}>
          <div style={styles.infoBadgeTitle}>GRID STATUS</div>
          <div style={styles.infoBadgeContent}>
            {gridData.grid?.length || 0}×{gridData.grid?.[0]?.length || 0} | 
            Agents: {gridData.agents?.length || 0}
          </div>
        </div>
      )}
    </div>
  )
}