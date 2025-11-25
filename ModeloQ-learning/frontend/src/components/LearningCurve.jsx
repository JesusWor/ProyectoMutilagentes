import React, { useEffect, useState } from 'react'
import { getStats } from '../api/backend'
export default function LearningCurve(){ const [stats, setStats] = useState([]); useEffect(()=>{ let mounted=true; async function loop(){ const s = await getStats(); if(!mounted) return; setStats(s.episodes || []); setTimeout(loop, 1500); } loop(); return ()=> mounted=false },[]); return (<div style={{padding:12, background:'#0e1724', borderRadius:8}}><h3>Training stats (last episodes)</h3><pre style={{fontSize:11, color:'#fff'}}>{JSON.stringify(stats.slice(-8), null, 2)}</pre></div>) }
