import React, { useRef, useEffect, useState } from 'react'
import { getState } from '../api/backend'

/**
 * FieldGrid - Visualización mejorada de campo agrícola
 * - Diseño realista de campo de cultivo
 * - 6 agentes con roles diferenciados
 * - Animaciones suaves
 * - Información en tiempo real
 */
export default function FieldGrid({ simFrames = null }) {
  const canvasRef = useRef(null)
  const [gridData, setGridData] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const [showMessages, setShowMessages] = useState(true)
  const [showAgentInfo, setShowAgentInfo] = useState(true)

  // Colores por rol
  const ROLE_COLORS = {
    'planter': '#e74c3c',     // Rojo - Plantador
    'harvester': '#27ae60',   // Verde - Cosechador
    'irrigator': '#3498db',   // Azul - Irrigador
    'scout': '#f39c12',       // Naranja - Explorador
    'transport': '#9b59b6',   // Morado - Transportador
    'general': '#95a5a6'      // Gris - General
  }

  // REALTIME MODE (poll every 300 ms)
  useEffect(() => {
    if (simFrames || isPaused) return
    let mounted = true
    async function loop() {
      try {
        const data = await getState()
        if (!mounted) return
        setGridData(data)
      } catch (e) {}
      if (!mounted) return
      setTimeout(loop, 300)
    }
    loop()
    return () => { mounted = false }
  }, [simFrames, isPaused])

  // ANIMATION MODE
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
    return () => { mounted = false }
  }, [simFrames, isPaused])

  // DRAW ON CANVAS
  useEffect(() => {
    if (!gridData) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const grid = gridData.grid
    const h = grid.length
    const w = grid[0].length

    const tile = 20 // Tamaño de celda

    const DPR = window.devicePixelRatio || 1
    canvas.style.width = (w * tile) + 'px'
    canvas.style.height = (h * tile) + 'px'
    canvas.width = Math.floor(w * tile * DPR)
    canvas.height = Math.floor(h * tile * DPR)
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    // Fondo tipo tierra
    ctx.fillStyle = '#8b7355'
    ctx.fillRect(0, 0, w * tile, h * tile)

    // ----- DIBUJO DEL GRID -----
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = grid[y][x]
        
        if (v === 0) { // EMPTY
          ctx.fillStyle = '#a0826d'
          ctx.fillRect(x * tile, y * tile, tile, tile)
          ctx.fillStyle = 'rgba(139, 115, 85, 0.3)'
          if ((x + y) % 2 === 0) {
            ctx.fillRect(x * tile, y * tile, tile / 2, tile / 2)
          }
        } else if (v === 1) { // OBSTACLE
          const gray = 60 + (x * 13 + y * 7) % 30
          ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`
          ctx.fillRect(x * tile, y * tile, tile, tile)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.fillRect(x * tile, y * tile, tile / 2, tile / 2)
        } else if (v === 2) { // CROP
          ctx.fillStyle = '#4a7c3e'
          ctx.fillRect(x * tile, y * tile, tile, tile)
          ctx.fillStyle = '#5cb85c'
          ctx.beginPath()
          ctx.arc(x * tile + tile / 2, y * tile + tile / 2, tile * 0.35, 0, Math.PI * 2)
          ctx.fill()
        } else if (v === 3) { // PATH
          ctx.fillStyle = '#d4a76a'
          ctx.fillRect(x * tile, y * tile, tile, tile)
        } else if (v === 4) { // MANAGER
          ctx.fillStyle = '#f39c12'
          ctx.fillRect(x * tile, y * tile, tile, tile)
        } else if (v === 5) { // WATER
          ctx.fillStyle = '#3498db'
          ctx.fillRect(x * tile, y * tile, tile, tile)
        }
      }
    }

    // Grid líneas
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.lineWidth = 0.5
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

    // ----- AGENTES -----
    const agentsRaw = gridData.agents || []
    const agents = agentsRaw.map((ag, idx) => {
      if (Array.isArray(ag)) return { id: idx, pos: ag, role: 'general' }
      if (ag && ag.pos) return {
        id: ag.id ?? idx,
        pos: Array.isArray(ag.pos) ? ag.pos : [ag.pos[0], ag.pos[1]],
        role: ag.role || 'general',
        harvested: ag.harvested || 0,
        epsilon: ag.epsilon || 0
      }
      return { id: idx, pos: [0, 0], role: 'general' }
    })

    agents.forEach((ag) => {
      const color = ROLE_COLORS[ag.role] || '#95a5a6'
      const [ax, ay] = ag.pos

      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(ax * tile + tile / 2, ay * tile + tile / 2, tile * 0.45, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ax * tile + tile / 2, ay * tile + tile / 2, tile * 0.45, 0, Math.PI * 2)
      ctx.stroke()

      const icons = {
        'planter': '🌱',
        'harvester': '🌾',
        'irrigator': '💧',
        'scout': '🔍',
        'transport': '📦',
        'general': '🤖'
      }

      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${tile * 0.5}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        icons[ag.role] || '🤖',
        ax * tile + tile / 2,
        ay * tile + tile / 2
      )
    })

  }, [gridData, showLegend, showMessages, showAgentInfo])


  // ===== ESTILOS =====
  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    canvas: {
      display: 'block',
      borderRadius: '12px',
      border: '3px solid #475569',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
    }
  }

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? '▶ Continuar' : '⏸ Pausar'}
        </button>
        <button onClick={() => setShowLegend(!showLegend)}>
          Leyenda {showLegend ? '✔' : '✖'}
        </button>
        <button onClick={() => setShowAgentInfo(!showAgentInfo)}>
          Agentes {showAgentInfo ? '✔' : '✖'}
        </button>
        <button onClick={() => setShowMessages(!showMessages)}>
          Mensajes {showMessages ? '✔' : '✖'}
        </button>
      </div>
    </div>
  )
}
