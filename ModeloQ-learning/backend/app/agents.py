import random
import numpy as np
from collections import defaultdict

ACTIONS = [(0,0), (1,0), (-1,0), (0,1), (0,-1)]

def zero_q():
    return np.zeros(len(ACTIONS))

class FarmAgent:
    def __init__(self, aid, start_pos, role='harvester', barn_pos=(0,0),
                 alpha=0.5, gamma=0.95, eps=0.4, capacity=10, fuel=100):
        # Identificación
        self.id = aid
        self.pos = tuple(start_pos)
        self.role = role
        self.barn_pos = tuple(barn_pos)
        self.path = []
        self.harvested = 0
        self.planted = 0
        self.irrigated = 0
        self.delivered = 0
        self.max_capacity = capacity
        self.current_capacity = capacity
        self.is_returning_to_barn = False
        self.recharge_counter = 0
        self.max_fuel = fuel
        self.current_fuel = fuel
        self.fuel_consumed = 0
        self.fuel_efficiency_score = 0
        self.low_fuel_warnings = 0
        self.out_of_fuel_count = 0
        self.current_goal = barn_pos
        self.last_goal_distance = float('inf')
        
        # Q-Learning
        self.Q = defaultdict(zero_q)
        self.alpha = alpha
        self.gamma = gamma
        self.eps = eps
        self.eps_min = 0.01
        
        # Estadísticas
        self.steps_taken = 0
        self.successful_actions = 0
        self.barn_visits = 0
        self.total_distance_traveled = 0
        self.fuel_refills = 0
        self.outbox = None
        
    def obs_to_state(self, obs):
        pos = obs['pos']
        goal = obs['goal']
        nearby = obs.get('nearby', set())
        
        dx = max(-8, min(8, goal[0] - pos[0]))
        dy = max(-8, min(8, goal[1] - pos[1]))
        occ = 0
        dirs = [(0,1), (0,-1), (-1,0), (1,0)]
        for i, d in enumerate(dirs):
            nb = (pos[0] + d[0], pos[1] + d[1])
            if nb in nearby:
                occ |= (1 << i)
        
        cap_level = int((self.current_capacity / self.max_capacity) * 4)
        cap_level = max(0, min(4, cap_level))
        barn_dist = abs(self.barn_pos[0] - pos[0]) + abs(self.barn_pos[1] - pos[1])
        barn_dist_q = min(5, barn_dist // 10)
        fuel_level = int((self.current_fuel / self.max_fuel) * 4)
        fuel_level = max(0, min(4, fuel_level))
        returning = 1 if self.is_returning_to_barn else 0
        
        return (dx, dy, occ, cap_level, barn_dist_q, fuel_level, returning)
    
    def consume_fuel(self, amount):
        if self.current_fuel > 0:
            self.current_fuel = max(0, self.current_fuel - amount)
            self.fuel_consumed += amount
            return True
        else:
            self.out_of_fuel_count += 1
            return False
    
    def get_fuel_percentage(self):
        return int((self.current_fuel / self.max_fuel) * 100)
    
    def is_fuel_low(self):
        fuel_pct = self.get_fuel_percentage()
        return fuel_pct <= 30
    
    def is_fuel_critical(self):
        fuel_pct = self.get_fuel_percentage()
        return fuel_pct <= 10  # 10% o menos
    
    def should_return_to_barn(self):
        if self.current_fuel <= 0:
            return True
        
        if self.is_fuel_critical():
            return True
        
        if self.is_fuel_low():
            dist_to_barn = abs(self.barn_pos[0] - self.pos[0]) + abs(self.barn_pos[1] - self.pos[1])
            if dist_to_barn < self.current_fuel * 0.8:
                return True
        
        if self.current_capacity <= 0:
            return True
        
        if self.current_capacity < self.max_capacity * 0.25:
            dist_to_barn = abs(self.barn_pos[0] - self.pos[0]) + abs(self.barn_pos[1] - self.pos[1])
            if dist_to_barn < 15:
                return True
        
        return False
    
    def is_at_barn(self):
        barn_cells = [
            self.barn_pos,
            (self.barn_pos[0] + 1, self.barn_pos[1]),
            (self.barn_pos[0], self.barn_pos[1] + 1),
            (self.barn_pos[0] + 1, self.barn_pos[1] + 1)
        ]
        return self.pos in barn_cells or (
            abs(self.pos[0] - self.barn_pos[0]) <= 1 and
            abs(self.pos[1] - self.barn_pos[1]) <= 1
        )
    
    def recharge_at_barn(self, fuel_recharge_rate=20):
        if self.is_at_barn():
            self.recharge_counter += 1
            if self.recharge_counter >= 1:
                self.current_capacity = self.max_capacity
                if self.current_fuel < self.max_fuel:
                    self.current_fuel = min(self.max_fuel, self.current_fuel + fuel_recharge_rate)
                    if self.current_fuel >= self.max_fuel:
                        self.current_fuel = self.max_fuel
                        self.is_returning_to_barn = False
                        self.recharge_counter = 0
                        self.barn_visits += 1
                        self.fuel_refills += 1
                        return True
                else:
                    self.is_returning_to_barn = False
                    self.recharge_counter = 0
                    self.barn_visits += 1
                    return True
        
        return False
    
    def use_capacity(self, amount=1):
        if self.current_capacity >= amount:
            self.current_capacity -= amount
            self.successful_actions += 1
            return True
        return False
    
    def choose_action(self, state, training=True):
        self.steps_taken += 1
        
        # PRIORIDAD 1: Si tiene un path válido de A*, seguirlo
        if hasattr(self, 'path') and self.path and len(self.path) > 0:
            next_pos = self.path[0]
            current_x, current_y = self.pos
            next_x, next_y = next_pos
            dx = next_x - current_x
            dy = next_y - current_y
            
            if dx == 0 and dy == 0:
                return 0  # Quedarse quieto
            elif dx > 0:
                return 1  # Derecha
            elif dx < 0:
                return 2  # Izquierda
            elif dy > 0:
                return 3  # Abajo
            elif dy < 0:
                return 4  # Arriba
        
        # PRIORIDAD 2: Si no hay path, usar estrategia inteligente hacia el objetivo
        if hasattr(self, 'current_goal') and self.current_goal:
            dx = self.current_goal[0] - self.pos[0]
            dy = self.current_goal[1] - self.pos[1]
            
            if abs(dx) > abs(dy):
                return 1 if dx > 0 else 2
            elif abs(dy) > 0:
                return 3 if dy > 0 else 4
        
        # PRIORIDAD 3: Si todo falla, exploración aleatoria (solo en entrenamiento)
        if training:
            return random.randrange(len(ACTIONS))
        return 0
    
    def update_q(self, state, action, reward, next_state, done=False):
        if state not in self.Q:
            self.Q[state] = np.zeros(len(ACTIONS))
        if next_state not in self.Q:
            self.Q[next_state] = np.zeros(len(ACTIONS))
        
        current_q = self.Q[state][action]
        
        if done:
            target = reward
        else:
            max_next_q = np.max(self.Q[next_state])
            target = reward + self.gamma * max_next_q
        
        td_error = target - current_q
        self.Q[state][action] = current_q + self.alpha * td_error
    
    def decay_epsilon(self, decay_rate=0.995):
        self.eps = max(self.eps_min, self.eps * decay_rate)
    
    def set_eps(self, eps):
        self.eps = max(self.eps_min, min(1.0, eps))
    
    def get_capacity_percentage(self):
        return int((self.current_capacity / self.max_capacity) * 100)
    
    def calculate_efficiency_score(self):
        if self.steps_taken == 0:
            return 100
        if self.fuel_consumed == 0:
            return 100
        efficiency = (self.successful_actions / self.fuel_consumed) * 100
        return min(100, efficiency)
    
    def get_stats(self):
        total_actions = self.harvested + self.planted + self.irrigated
        
        return {
            'id': int(self.id),
            'role': str(self.role),
            'states_learned': int(len(self.Q)),
            'steps_taken': int(self.steps_taken),
            'harvested': int(self.harvested),
            'planted': int(self.planted),
            'irrigated': int(self.irrigated),
            'delivered': int(self.delivered),
            'barn_visits': int(self.barn_visits),
            'capacity': int(self.current_capacity),
            'capacity_pct': int(self.get_capacity_percentage()),
            'fuel': float(self.current_fuel),
            'fuel_pct': int(self.get_fuel_percentage()),
            'fuel_consumed': float(self.fuel_consumed),
            'fuel_efficiency': float(self.calculate_efficiency_score()),
            'fuel_refills': int(self.fuel_refills),
            'out_of_fuel_count': int(self.out_of_fuel_count),
            'success_rate': float(self.successful_actions / max(1, self.steps_taken)),
            'epsilon': float(self.eps),
            'total_actions': int(total_actions),
            'is_returning': bool(self.is_returning_to_barn),
            'is_fuel_low': bool(self.is_fuel_low()),
            'is_fuel_critical': bool(self.is_fuel_critical())
        }
    
    def get_status_icon(self):
        """Retorna ícono según estado"""
        if self.is_at_barn():
            return '🏠'
        elif self.is_fuel_critical():
            return '🔴'  # Combustible crítico
        elif self.is_fuel_low():
            return '⚠️'  # Combustible bajo
        elif self.is_returning_to_barn:
            return '↩️'
        elif self.current_capacity < self.max_capacity * 0.3:
            return '⚠️'
        else:
            icons = {
                'planter': '🌱',
                'harvester': '🌾',
                'irrigator': '💧'
            }
            return icons.get(self.role, '🤖')