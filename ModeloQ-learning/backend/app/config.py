import os

BASE_DIR = os.path.dirname(__file__)

# =============================================================================
# PARÁMETROS DEL ENTORNO
# =============================================================================

GRID_W = int(os.getenv("GRID_W", 60))
GRID_H = int(os.getenv("GRID_H", 40))
N_AGENTS = int(os.getenv("N_AGENTS", 6))

CROP_COUNT = int(os.getenv("CROP_COUNT", 200))
OBSTACLE_COUNT = int(os.getenv("OBST_COUNT", 30))

# =============================================================================
# TIPOS DE CELDAS
# =============================================================================

EMPTY = 0
OBST = 1
CROP = 2
PATH = 3
MANAGER = 4
WATER = 5
PLANTER_BARN = 6
HARVESTER_BARN = 7
IRRIGATOR_BARN = 8
SEED_STORAGE = 9
CROP_STORAGE = 10
PARCEL_BORDER = 11  # Nuevo: borde de parcela

# =============================================================================
# DEFINICIÓN DE PARCELAS (2 HECTÁREAS SIMULADAS)
# =============================================================================

# Parcela 1 (Izquierda) - Primera hectárea
PARCEL_1 = {
    'x_start': 8,
    'x_end': 28,
    'y_start': 8,
    'y_end': 32,
    'name': 'Parcela 1',
    'color': '#8b7355'
}

# Parcela 2 (Derecha) - Segunda hectárea
PARCEL_2 = {
    'x_start': 32,
    'x_end': 52,
    'y_start': 8,
    'y_end': 32,
    'name': 'Parcela 2',
    'color': '#a0826d'
}

PARCELS = [PARCEL_1, PARCEL_2]

# =============================================================================
# UBICACIONES ESTRATÉGICAS
# =============================================================================

PLANTER_BARN_POS = (3, 3)                    # Arriba-izquierda
HARVESTER_BARN_POS = (GRID_W - 5, 3)         # Arriba-derecha  
IRRIGATOR_BARN_POS = (3, GRID_H - 5)         # Abajo-izquierda
MANAGER_POS = (GRID_W - 5, GRID_H - 5)       # Abajo-derecha

# =============================================================================
# ROLES Y CONFIGURACIÓN DE AGENTES
# =============================================================================

AGENT_ROLES = [
    'planter',      # Agente 0
    'planter',      # Agente 1
    'harvester',    # Agente 2
    'harvester',    # Agente 3
    'irrigator',    # Agente 4
    'irrigator'     # Agente 5
]

DEFAULT_ROLES = AGENT_ROLES

# Posiciones iniciales (cerca de sus graneros)
AGENT_START_POSITIONS = [
    (4, 4),                        # Plantador 1
    (5, 4),                        # Plantador 2
    (GRID_W - 6, 4),               # Cosechador 1
    (GRID_W - 7, 4),               # Cosechador 2
    (4, GRID_H - 6),               # Irrigador 1
    (5, GRID_H - 6)                # Irrigador 2
]

# Graneros asignados por rol
ROLE_BARNS = {
    'planter': PLANTER_BARN_POS,
    'harvester': HARVESTER_BARN_POS,
    'irrigator': IRRIGATOR_BARN_POS
}

# Colores para visualización
AGENT_COLORS = {
    'planter': '#e74c3c',
    'harvester': '#27ae60',
    'irrigator': '#3498db'
}

# =============================================================================
# SISTEMA DE COMBUSTIBLE
# =============================================================================

# Combustible inicial por rol
PLANTER_FUEL = 500
HARVESTER_FUEL = 520
IRRIGATOR_FUEL = 550

# Consumo de combustible por acción
FUEL_COST_MOVE = 1          # Por cada movimiento
FUEL_COST_PLANT = 2         # Por plantar
FUEL_COST_HARVEST = 2       # Por cosechar
FUEL_COST_IRRIGATE = 1.5    # Por irrigar

# Umbral para regresar a recargar (%)
FUEL_WARNING_THRESHOLD = 30  # Cuando quede 30% o menos
FUEL_CRITICAL_THRESHOLD = 10  # Crítico al 10%

# Velocidad de recarga en granero
FUEL_RECHARGE_RATE = 100  # Puntos por paso en granero

# =============================================================================
# CAPACIDADES POR ROL (SEMILLAS/COSECHA)
# =============================================================================

PLANTER_CAPACITY = 100      # Semillas que puede plantar
HARVESTER_CAPACITY = 120    # Cultivos que puede cosechar
IRRIGATOR_CAPACITY = 200    # Celdas que puede irrigar

BARN_RECHARGE_TIME = 5     # Pasos en granero para recargar

# =============================================================================
# PARÁMETROS Q-LEARNING (DIFERENCIADOS POR ROL)
# =============================================================================

# Plantadores: Aprenden rápido, exploran más
PLANTER_PARAMS = {
    'alpha': 0.6,
    'gamma': 0.92,
    'eps': 0.5
}

# Cosechadores: Balance, visión a largo plazo
HARVESTER_PARAMS = {
    'alpha': 0.5,
    'gamma': 0.95,
    'eps': 0.4
}

# Irrigadores: Estables, menos exploración
IRRIGATOR_PARAMS = {
    'alpha': 0.4,
    'gamma': 0.93,
    'eps': 0.3
}

ROLE_PARAMS = {
    'planter': PLANTER_PARAMS,
    'harvester': HARVESTER_PARAMS,
    'irrigator': IRRIGATOR_PARAMS
}

# Parámetros por defecto
DEFAULT_ALPHA = 0.5
DEFAULT_GAMMA = 0.95
DEFAULT_EPS = 0.4
EPS_DECAY = 0.995
EPS_MIN = 0.01

# =============================================================================
# SISTEMA DE RECOMPENSAS
# =============================================================================

# Recompensas por acción
REWARD_HARVEST = 40.0
REWARD_PLANT = 35.0
REWARD_IRRIGATE = 30.0
REWARD_DELIVER = 20.0
REWARD_RETURN_BARN = 15.0
REWARD_APPROACH_TARGET = 2.0
REWARD_FUEL_EFFICIENT = 5.0  # Bonus por ser eficiente con combustible

# Penalizaciones
PENALTY_STEP = -0.05
PENALTY_COLLISION = -2.0
PENALTY_FAILED_HARVEST = -2.0
PENALTY_PLANT_FAIL = -2.0
PENALTY_IRRIGATE_FAIL = -1.0
PENALTY_COMPACTION = -3.0
PENALTY_WRONG_DIRECTION = -1.0
PENALTY_OUT_OF_FUEL = -10.0  # Penalización por quedarse sin combustible
PENALTY_FUEL_WASTE = -0.5    # Penalización leve por desperdiciar combustible

# =============================================================================
# ENTRENAMIENTO
# =============================================================================

DEFAULT_EPISODES = int(os.getenv("EPISODES", 50))
DEFAULT_STEPS_PER_EPISODE = int(os.getenv("STEPS_PER_EP", 2000))  # Aumentado para ciclo completo
SAVE_FREQUENCY = int(os.getenv("SAVE_FREQ", 10))

# =============================================================================
# ARCHIVOS Y RUTAS
# =============================================================================

SAVE_DIR = os.path.join(os.path.dirname(__file__), "..", "saved")
os.makedirs(SAVE_DIR, exist_ok=True)

# Q-Tables
QTABLE_PATH = os.path.join(SAVE_DIR, "trained_qtables.pkl")
PLANTER_QTABLE_PATH = os.path.join(SAVE_DIR, "planter_qtable.pkl")
HARVESTER_QTABLE_PATH = os.path.join(SAVE_DIR, "harvester_qtable.pkl")
IRRIGATOR_QTABLE_PATH = os.path.join(SAVE_DIR, "irrigator_qtable.pkl")

# Estadísticas y logs
STATS_PATH = os.path.join(SAVE_DIR, "train_stats.json")
LOGS_PATH = os.path.join(SAVE_DIR, "training_logs.txt")

# =============================================================================
# VISUALIZACIÓN
# =============================================================================

SIMULATION_SPEED = float(os.getenv("SIM_SPEED", 0.12))

# Colores del grid
COLOR_SOIL = (139, 115, 85)
COLOR_GRASS = (76, 153, 0)
COLOR_CROP_YOUNG = (144, 238, 144)
COLOR_CROP_MATURE = (34, 139, 34)
COLOR_PATH = (210, 180, 140)
COLOR_WATER = (100, 149, 237)
COLOR_BARN_WOOD = (139, 90, 43)
COLOR_BARN_ROOF = (178, 34, 34)
COLOR_EMPTY = (255, 255, 255)
COLOR_OBSTACLE = (64, 64, 64)
COLOR_CROP = (34, 139, 34)
COLOR_MANAGER = (255, 215, 0)
COLOR_PARCEL_BORDER = (101, 67, 33)

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def is_inside_parcel(x, y):
    """Verifica si una coordenada está dentro de alguna parcela"""
    for parcel in PARCELS:
        if (parcel['x_start'] <= x < parcel['x_end'] and 
            parcel['y_start'] <= y < parcel['y_end']):
            return True
    return False

def get_parcel(x, y):
    """Retorna la parcela a la que pertenece una coordenada"""
    for i, parcel in enumerate(PARCELS):
        if (parcel['x_start'] <= x < parcel['x_end'] and 
            parcel['y_start'] <= y < parcel['y_end']):
            return i, parcel
    return None, None

def get_training_config():
    """Retorna configuración de entrenamiento"""
    return {
        'n_agents': N_AGENTS,
        'agent_roles': AGENT_ROLES,
        'role_params': ROLE_PARAMS,
        'episodes': DEFAULT_EPISODES,
        'steps_per_episode': DEFAULT_STEPS_PER_EPISODE,
        'barns': {
            'planter': PLANTER_BARN_POS,
            'harvester': HARVESTER_BARN_POS,
            'irrigator': IRRIGATOR_BARN_POS
        },
        'capacities': {
            'planter': PLANTER_CAPACITY,
            'harvester': HARVESTER_CAPACITY,
            'irrigator': IRRIGATOR_CAPACITY
        },
        'fuel': {
            'planter': PLANTER_FUEL,
            'harvester': HARVESTER_FUEL,
            'irrigator': IRRIGATOR_FUEL
        },
        'parcels': PARCELS
    }

def print_config():
    """Imprime configuración actual"""
    print("=" * 70)
    print("🌾 CONFIGURACIÓN DEL SISTEMA DE GRANJA")
    print("=" * 70)
    
    print(f"\n📏 ENTORNO:")
    print(f"  • Dimensiones: {GRID_W}x{GRID_H}")
    print(f"  • Parcelas: {len(PARCELS)} (2 hectáreas simuladas)")
    print(f"  • Cultivos iniciales: {CROP_COUNT}")
    print(f"  • Obstáculos: {OBSTACLE_COUNT}")
    
    print(f"\n🏠 GRANEROS:")
    print(f"  • Plantadores: {PLANTER_BARN_POS}")
    print(f"  • Cosechadores: {HARVESTER_BARN_POS}")
    print(f"  • Irrigadores: {IRRIGATOR_BARN_POS}")
    print(f"  • Almacén: {MANAGER_POS}")
    
    print(f"\n⛽ SISTEMA DE COMBUSTIBLE:")
    print(f"  • Plantador: {PLANTER_FUEL} unidades")
    print(f"  • Cosechador: {HARVESTER_FUEL} unidades")
    print(f"  • Irrigador: {IRRIGATOR_FUEL} unidades")
    print(f"  • Umbral advertencia: {FUEL_WARNING_THRESHOLD}%")
    print(f"  • Umbral crítico: {FUEL_CRITICAL_THRESHOLD}%")
    
    print(f"\n👥 AGENTES ({N_AGENTS} total):")
    for i, role in enumerate(AGENT_ROLES):
        params = ROLE_PARAMS[role]
        capacity = PLANTER_CAPACITY if role == 'planter' else (
            HARVESTER_CAPACITY if role == 'harvester' else IRRIGATOR_CAPACITY
        )
        print(f"  • A{i} ({role}): α={params['alpha']} γ={params['gamma']} ε={params['eps']} Cap={capacity}")
    
    print(f"\n🎯 RECOMPENSAS:")
    print(f"  • Plantar: +{REWARD_PLANT}")
    print(f"  • Cosechar: +{REWARD_HARVEST}")
    print(f"  • Irrigar: +{REWARD_IRRIGATE}")
    print(f"  • Eficiencia combustible: +{REWARD_FUEL_EFFICIENT}")
    print(f"  • Sin combustible: {PENALTY_OUT_OF_FUEL}")
    
    print(f"\n📊 ENTRENAMIENTO:")
    print(f"  • Episodios: {DEFAULT_EPISODES}")
    print(f"  • Pasos máximos: {DEFAULT_STEPS_PER_EPISODE}")
    print(f"  • Guardar cada: {SAVE_FREQUENCY} episodios")
    
    print("=" * 70)

if __name__ == "__main__":
    print_config()