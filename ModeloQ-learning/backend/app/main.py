from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .sim_manager import SimManager
import os
import numpy as np

def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    return obj

app = FastAPI(
    title="Farm Multi-Agent API",
    description="Sistema de entrenamiento multi-agente para simulación agrícola con combustible",
    version="3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

sim = SimManager()

class TrainRequest(BaseModel):
    episodes: int = 50
    steps_per_episode: int = 500
    alpha: float = 0.5
    gamma: float = 0.95
    eps: float = 0.8
    eps_decay: float = 0.995

class ParamsUpdate(BaseModel):
    alpha: Optional[float] = None
    gamma: Optional[float] = None
    eps: Optional[float] = None
    eps_decay: Optional[float] = None

class ControlResponse(BaseModel):
    status: str
    detail: Optional[str] = None

@app.get('/health')
def health():
    return {
        'status': 'ok', 
        'service': 'farm-multiagent-api',
        'version': '3.0',
        'features': ['parcels', 'fuel_system', 'roi_analytics']
    }

@app.get('/state')
def state():
    state_data = sim.get_state()
    return convert_numpy_types(state_data)

@app.post('/train')
def train(req: TrainRequest):
    sim.params['alpha'] = req.alpha
    sim.params['gamma'] = req.gamma
    sim.params['eps'] = req.eps
    sim.params['eps_decay'] = req.eps_decay

    started = sim.start_training(
        episodes=req.episodes,
        steps_per_episode=req.steps_per_episode
    )

    return {
        'status': 'started' if started else 'already_running',
        'episodes': req.episodes,
        'steps_per_episode': req.steps_per_episode,
        'fuel_system': 'enabled',
        'parcels': len(sim.env.parcels)
    }

@app.post('/stop')
def stop():
    sim.stop_training()
    return {'status': 'stopped'}

@app.post('/params')
def update_params(p: ParamsUpdate):
    if p.alpha is not None:
        sim.params['alpha'] = p.alpha
    if p.gamma is not None:
        sim.params['gamma'] = p.gamma
    if p.eps is not None:
        sim.params['eps'] = p.eps
    if p.eps_decay is not None:
        sim.params['eps_decay'] = p.eps_decay

    return {'status': 'ok', 'params': sim.params}

@app.post('/save')
def save():
    sim.save_qs()
    sim.save_stats()
    return {
        'status': 'saved', 
        'message': 'Q-tables y estadísticas guardadas',
        'path': sim.QTABLE_PATH
    }

@app.post('/load')
def load():
    ok = sim.load_qs()
    return {
        'status': 'loaded' if ok else 'no_file',
        'message': 'Modelo cargado exitosamente' if ok else 'Archivo no encontrado'
    }

@app.get('/stats')
def stats():
    stats_data = sim.train_stats.copy()
    
    if 'best_reward' in stats_data:
        if stats_data['best_reward'] == float('-inf'):
            stats_data['best_reward'] = 0.0
        else:
            stats_data['best_reward'] = float(stats_data['best_reward'])
    
    if 'best_episode' in stats_data:
        stats_data['best_episode'] = int(stats_data['best_episode'])
    
    if 'episodes' in stats_data:
        stats_data['episodes'] = [convert_numpy_types(ep) for ep in stats_data['episodes']]
    
    return stats_data

@app.post('/run-trained')
def run_trained():
    if not os.path.exists(sim.QTABLE_PATH):
        sim.load_qs()

    started = sim.start_run_trained()
    return {
        'status': 'started' if started else 'already_running',
        'message': 'Modelo ejecutándose con combustible habilitado'
    }

@app.post('/stop-trained')
def stop_trained():
    stopped = sim.stop_run_trained()
    return {'status': 'stopped' if stopped else 'not_running'}

@app.get('/metrics')
def metrics():
    env_metrics = sim.env.get_metrics()
    agent_fuel_stats = {
        'avg_fuel_pct': float(sum(a.get_fuel_percentage() for a in sim.agents) / len(sim.agents)),
        'low_fuel_count': int(sum(1 for a in sim.agents if a.is_fuel_low())),
        'critical_fuel_count': int(sum(1 for a in sim.agents if a.is_fuel_critical())),
        'total_fuel_consumed': float(sum(a.fuel_consumed for a in sim.agents)),
        'avg_fuel_efficiency': float(sum(a.calculate_efficiency_score() for a in sim.agents) / len(sim.agents))
    }
    
    return convert_numpy_types({
        **env_metrics,
        'fuel_stats': agent_fuel_stats
    })

@app.get('/agents')
def agents_info():
    agents_data = {
        'agents': [convert_numpy_types(a.get_stats()) for a in sim.agents],
        'total_agents': int(len(sim.agents)),
        'roles': {
            'planter': int(sum(1 for a in sim.agents if a.role == 'planter')),
            'harvester': int(sum(1 for a in sim.agents if a.role == 'harvester')),
            'irrigator': int(sum(1 for a in sim.agents if a.role == 'irrigator'))
        },
        'fuel_system': {
            'enabled': True,
            'avg_fuel_pct': float(sum(a.get_fuel_percentage() for a in sim.agents) / len(sim.agents)),
            'refills_total': int(sum(a.fuel_refills for a in sim.agents))
        }
    }
    return convert_numpy_types(agents_data)

@app.get('/parcels')
def parcels_info():
    parcels_data = []
    for i, parcel in enumerate(sim.env.parcels):
        crops_in_parcel = 0
        for y in range(parcel['y_start'], parcel['y_end']):
            for x in range(parcel['x_start'], parcel['x_end']):
                if 0 <= y < sim.env.h and 0 <= x < sim.env.w:
                    if sim.env.grid[y, x] == 2:  # CROP
                        crops_in_parcel += 1
        
        parcels_data.append({
            'id': int(i),
            'name': str(parcel.get('name', f'Parcela {i+1}')),
            'bounds': {
                'x_start': int(parcel['x_start']),
                'x_end': int(parcel['x_end']),
                'y_start': int(parcel['y_start']),
                'y_end': int(parcel['y_end'])
            },
            'area': int((parcel['x_end'] - parcel['x_start']) * (parcel['y_end'] - parcel['y_start'])),
            'crops_current': int(crops_in_parcel)
        })
    
    return {
        'total_parcels': int(len(sim.env.parcels)),
        'parcels': parcels_data
    }

@app.get('/training-progress')
def training_progress():
    episodes = sim.train_stats.get('episodes', [])
    
    if len(episodes) == 0:
        return {
            'is_training': bool(sim.running),
            'current_episode': 0,
            'total_episodes': 0,
            'progress_pct': 0.0
        }
    
    last_episode = episodes[-1] if episodes else {}
    
    current_ep = int(last_episode.get('episode', 0))
    total_ep = int(len(episodes))
    
    return {
        'is_training': bool(sim.running),
        'current_episode': current_ep,
        'total_episodes': total_ep,
        'progress_pct': float((current_ep / max(1, total_ep)) * 100),
        'last_reward': float(last_episode.get('reward', 0)),
        'best_reward': float(sim.train_stats.get('best_reward', 0)),
        'avg_fuel_efficiency': float(last_episode.get('avg_fuel_efficiency', 0)),
        'time_saved': float(last_episode.get('time_saved_pct', 0)),
        'task_complete': bool(last_episode.get('task_complete', False))
    }

@app.get('/business-metrics')
def business_metrics():
    episodes = sim.train_stats.get('episodes', [])
    
    if len(episodes) == 0:
        return {'status': 'no_data'}
    
    avg_fuel_eff = float(sum(ep.get('avg_fuel_efficiency', 0) for ep in episodes) / len(episodes))
    avg_time_saved = float(sum(ep.get('time_saved_pct', 0) for ep in episodes) / len(episodes))
    total_harvested = int(sum(ep.get('harvested', 0) for ep in episodes))
    
    fuel_cost_per_unit = 3.5
    hourly_labor_cost = 25
    
    baseline_efficiency = 50
    fuel_savings_pct = max(0, avg_fuel_eff - baseline_efficiency)
    fuel_cost_savings = (fuel_savings_pct / 100) * fuel_cost_per_unit * 1000
    
    time_savings_value = (avg_time_saved / 100) * hourly_labor_cost * 40
    
    monthly_savings = fuel_cost_savings + time_savings_value
    annual_savings = monthly_savings * 12
    
    implementation_cost = 5000
    roi = ((annual_savings - implementation_cost) / implementation_cost) * 100
    
    co2_reduction = (fuel_savings_pct / 100) * 2.3 * 1000
    
    return {
        'fuel_efficiency': float(avg_fuel_eff),
        'time_saved_pct': float(avg_time_saved),
        'fuel_cost_savings': float(fuel_cost_savings),
        'time_savings_value': float(time_savings_value),
        'monthly_savings': float(monthly_savings),
        'annual_savings': float(annual_savings),
        'roi_pct': float(roi),
        'co2_reduction_kg': float(co2_reduction),
        'implementation_cost': float(implementation_cost),
        'payback_months': float(implementation_cost / max(1, monthly_savings))
    }

if __name__ == '__main__':
    import uvicorn
    print("\n" + "="*70)
    print("🚜 Iniciando Farm Multi-Agent API v3.0")
    print("="*70)
    print("✓ Sistema de combustible: HABILITADO")
    print("✓ Parcelas definidas: 2 hectáreas")
    print("✓ Análisis de ROI: ACTIVO")
    print("📚 Documentación: http://localhost:8000/docs")
    print("="*70 + "\n")
    uvicorn.run(app, host='0.0.0.0', port=8000)