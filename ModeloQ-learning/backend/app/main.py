# backend/app/main.py
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sim_manager import SimManager
import os

app = FastAPI(title="Farm Multi-Agent API")
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

sim = SimManager()

class TrainRequest(BaseModel):
    episodes: int = 20
    steps_per_episode: int = 400
    alpha: float = 0.3
    gamma: float = 0.9
    eps: float = 0.25

class SimRequest(BaseModel):
    steps: int = 350
    width: int = 40
    height: int = 24
    n_agents: int = 3

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.get('/state')
def state():
    return sim.get_state()

@app.post('/train')
def train(req: TrainRequest, background_tasks: BackgroundTasks):
    sim.params['alpha'] = req.alpha
    sim.params['gamma'] = req.gamma
    sim.params['eps'] = req.eps
    started = sim.start_training(episodes=req.episodes, steps_per_episode=req.steps_per_episode)
    return {'status': 'started' if started else 'already_running'}

@app.post('/stop')
def stop():
    sim.stop_training()
    return {'status': 'stopped'}

@app.post('/params')
def params(p: dict):
    for k, v in p.items():
        if v is not None:
            sim.params[k] = v
    return {'status': 'ok'}

@app.post('/save')
def save():
    sim.save_qs()
    return {'status': 'saved'}

@app.post('/load')
def load():
    ok = sim.load_qs()
    return {'status': 'loaded' if ok else 'no_file'}

@app.get('/stats')
def stats():
    return sim.train_stats

# ----------------------------
# Run trained model in real time
# ----------------------------
@app.post('/run-trained')
def run_trained():
    # ensure Q-tables are loaded (try to load if path exists)
    if not os.path.exists(sim.QTABLE_PATH if hasattr(sim, 'QTABLE_PATH') else os.path.join(os.path.dirname(__file__), '..', 'saved', 'trained_qtables.pkl')):
        # try to load via sim.load_qs()
        sim.load_qs()
    started = sim.start_run_trained()
    return {'status': 'started' if started else 'already_running'}

@app.post('/stop-trained')
def stop_trained():
    stopped = sim.stop_run_trained()
    return {'status': 'stopped' if stopped else 'not_running'}

# ejcutar backend: uvicorn main:app --reload