# backend/app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .sim_manager import SimManager
import asyncio
import json
import numpy as np

def convert_numpy_types(obj):
    if isinstance(obj, np.integer): return int(obj)
    elif isinstance(obj, np.floating): return float(obj)
    elif isinstance(obj, np.ndarray): return obj.tolist()
    elif isinstance(obj, dict): return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list): return [convert_numpy_types(i) for i in obj]
    return obj

app = FastAPI(title="Farm Multi-Agent API", version="3.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

sim = SimManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Unity Conectado")

    try:
        if not sim.agents:
            sim.env.reset()

        step_count = 0

        while True:

            try:
                with sim.lock:
                    obs_list = sim.env._get_obs()
                    actions = {}

                    for i, agent in enumerate(sim.agents):
                        # 'best_action' decide la mejor jugada según lo que el agente ha aprendido
                        action_idx = sim.best_action(agent, obs_list[i])
                        
                        # Traducir el ID de acción (0-4) a movimiento real (dx, dy)
                        # Ver exactamente qué hace estas líneas de código
                        move_map = {0: (0,0), 1: (1,0), 2: (-1,0), 3: (0,1), 4: (0,-1)}
                        actions[i] = move_map.get(action_idx, (0,0))

                    proposals = sim.env.step(sim.agents, actions_by_q=actions)
                    
                    counts = {}
                    for p in proposals: counts[p] = counts.get(p, 0) + 1
                    
                    finals = []
                    for i, p in enumerate(proposals):
                        if counts[p] > 1: 
                            finals.append(sim.agents[i].pos)
                        else: 
                            finals.append(p)
                    sim.env.apply_final_positions_and_harvest(sim.agents, finals)

            except Exception as e_inner:
                print(f"Error en frame {step_count}: {e_inner}")
                
            raw_state = sim.get_state()

            clean_state = convert_numpy_types(raw_state)

            step_count += 1
            if step_count % 50 == 0:  # Imprime solo cada 50 frames
                print(f"\n--- JSON ENVIADO (Frame {step_count}) ---")
                # 'indent=2' hace que el JSON se vea bonito y legible en la terminal
                print(json.dumps(clean_state, indent=2)) 
                print("-" * 30)
            
            await websocket.send_json(clean_state)
            
            #Control de Velocidad (0.1 = 10 pasos por segundo)
            await asyncio.sleep(0.1) 

    except WebSocketDisconnect:
        print("❌ Unity se desconectó")
    except Exception as e:
        print(f"⚠️ Error crítico: {e}")