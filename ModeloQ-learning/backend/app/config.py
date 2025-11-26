import os

BASE_DIR = os.path.dirname(__file__)

# PARÁMETROS DEL ENTORNO

GRID_W = int(os.getenv("GRID_W", 40))
GRID_H = int(os.getenv("GRID_H", 24))

# 6 AGENTES: 2 Plantadores, 2 Cosechadores, 2 Irrigadores
N_AGENTS = int(os.getenv("N_AGENTS", 6))

CROP_COUNT = int(os.getenv("CROP_COUNT", 150))      # Más cultivos
OBSTACLE_COUNT = int(os.getenv("OBST_COUNT", 40))   # Menos obstáculos

# PARÁMETROS DE Q-LEARNING OPTIMIZADOS
DEFAULT_ALPHA = float(os.getenv("ALPHA", 0.5))
DEFAULT_GAMMA = float(os.getenv("GAMMA", 0.95))
DEFAULT_EPS = float(os.getenv("EPS", 0.4))
EPS_DECAY = float(os.getenv("EPS_DECAY", 0.995))

# Epsilon Mínimo
EPS_MIN = float(os.getenv("EPS_MIN", 0.01))

# ENTRENAMIENTO
DEFAULT_EPISODES = int(os.getenv("EPISODES", 50))
DEFAULT_STEPS_PER_EPISODE = int(os.getenv("STEPS_PER_EP", 400))
SAVE_FREQUENCY = int(os.getenv("SAVE_FREQ", 10))

# SISTEMA DE RECOMPENSAS
REWARD_HARVEST = 40.0
REWARD_PLANT = 25.0              # NUEVO: recompensa por plantar
REWARD_IRRIGATE = 15.0           # NUEVO: recompensa por irrigar
PENALTY_FAILED_HARVEST = -2.0
PENALTY_STEP = -0.05
PENALTY_COLLISION = -1.5
REWARD_APPROACH_CROP = 0.5
PENALTY_COMPACTION = -3.0

# ROLES DE AGENTES (2 DE CADA TIPO)
AGENT_ROLES = [
    'planter',      # Agente 0: Plantador 1
    'planter',      # Agente 1: Plantador 2
    'harvester',    # Agente 2: Cosechador 1
    'harvester',    # Agente 3: Cosechador 2
    'irrigator',    # Agente 4: Irrigador 1
    'irrigator'     # Agente 5: Irrigador 2
]

DEFAULT_ROLES = AGENT_ROLES

# Colores para visualización (uno por agente)
AGENT_COLORS = [
    '#e74c3c',  # Rojo - Plantador 1
    '#c0392b',  # Rojo oscuro - Plantador 2
    '#27ae60',  # Verde - Cosechador 1
    '#229954',  # Verde oscuro - Cosechador 2
    '#3498db',  # Azul - Irrigador 1
    '#2874a6'   # Azul oscuro - Irrigador 2
]

# RUTAS DE ARCHIVOS
SAVE_DIR = os.path.join(os.path.dirname(__file__), "..", "saved")
os.makedirs(SAVE_DIR, exist_ok=True)

QTABLE_PATH = os.path.join(SAVE_DIR, "trained_qtables.pkl")
STATS_PATH = os.path.join(SAVE_DIR, "train_stats.json")
LOGS_PATH = os.path.join(SAVE_DIR, "training_logs.txt")

# VISUALIZACIÓN
SIMULATION_SPEED = float(os.getenv("SIM_SPEED", 0.12))

# Colores del grid para el canvas
COLOR_EMPTY = (255, 255, 255)
COLOR_OBSTACLE = (64, 64, 64)
COLOR_CROP = (34, 139, 34)
COLOR_PATH = (210, 180, 140)
COLOR_MANAGER = (255, 215, 0)
COLOR_WATER = (30, 144, 255)

# FUNCIONES AUXILIARES
def get_training_config():
    """Retorna configuración de entrenamiento"""
    return {
        'n_agents': N_AGENTS,
        'agent_roles': AGENT_ROLES,
        'alpha': DEFAULT_ALPHA,
        'gamma': DEFAULT_GAMMA,
        'epsilon': DEFAULT_EPS,
        'eps_decay': EPS_DECAY,
        'eps_min': EPS_MIN,
        'episodes': DEFAULT_EPISODES,
        'steps_per_episode': DEFAULT_STEPS_PER_EPISODE
    }

def print_config():
    """Imprime configuración actual"""
    print("=" * 70)
    print("CONFIGURACIÓN DEL SISTEMA")
    print("=" * 70)
    print(f"\nENTORNO:")
    print(f"  • Dimensiones: {GRID_W}x{GRID_H}")
    print(f"  • Agentes: {N_AGENTS}")
    for i, role in enumerate(AGENT_ROLES):
        print(f"    - Agente {i}: {role}")
    print(f"  • Cultivos: {CROP_COUNT}")
    print(f"  • Obstáculos: {OBSTACLE_COUNT}")
    
    print(f"\nQ-LEARNING:")
    print(f"  • Alpha (α): {DEFAULT_ALPHA} - Tasa de aprendizaje")
    print(f"  • Gamma (γ): {DEFAULT_GAMMA} - Factor de descuento")
    print(f"  • Epsilon (ε): {DEFAULT_EPS} - Exploración inicial")
    print(f"  • Decay: {EPS_DECAY} - Decaimiento de epsilon")
    
    print(f"\nRECOMPENSAS:")
    print(f"  • Cosechar: +{REWARD_HARVEST}")
    print(f"  • Plantar: +{REWARD_PLANT}")
    print(f"  • Irrigar: +{REWARD_IRRIGATE}")
    print(f"  • Paso: {PENALTY_STEP}")
    print(f"  • Colisión: {PENALTY_COLLISION}")
    
    print(f"\nENTRENAMIENTO:")
    print(f"  • Episodios: {DEFAULT_EPISODES}")
    print(f"  • Pasos/episodio: {DEFAULT_STEPS_PER_EPISODE}")
    print(f"  • Guardar cada: {SAVE_FREQUENCY} episodios")
    
    print("=" * 70)

if __name__ == "__main__":
    print_config()