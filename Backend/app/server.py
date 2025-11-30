from fastapi import FastAPI, WebSocket
import asyncio, json
from model import OrbitModel

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()
    print("Unity conectado -> MULTIAGENTE listo")

    params = dict(N=2, radius=5, speed=0.05)
    model = OrbitModel(parameters=params)
    model.setup()

    steps = 0
    max_steps = 1000   # <<< Tiempo de simulacion para generar grafica

    try:
        while True:

            model.step()
            steps += 1

            # Enviar posiciones a Unity (tiempo real)
            data = [{"x": a.x, "y":0, "z":a.z} for a in model.agents]
            await websocket.send_text(json.dumps(data))

            # Si ya recorrimos N pasos -> crear gráfica y reiniciar
            if steps == max_steps:
                print("Generando gráfica 2D...")
                model.plot_paths()
                print("Gráfica guardada como trayectorias.png")
                steps = 0  # <- reinicia grafica en ciclo nuevo

            await asyncio.sleep(0.016)

    except Exception as e:
        print("Conexión cerrada:", e)
        model.plot_paths()
        print("Gráfica generada al finalizar.")
