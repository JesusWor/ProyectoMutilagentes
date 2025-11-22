from fastapi import FastAPI, WebSocket
import asyncio
import json
import math

app =  FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("Intentando conectar con Unity...")
    await websocket.accept()
    print("¡Unity Conectado!")

    try:
        t = 0
        while True:
            t+= 0.05
            x = math.sin(t) * 5
            z = math.cos(t) * 5

            data = {
                "x": x,
                "y": 0,
                "z": z
            }

            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(0.016)


    except Exception as e:
        print("Conexión cerrada:", e)