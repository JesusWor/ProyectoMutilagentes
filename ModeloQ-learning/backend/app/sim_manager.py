# backend/app/sim_manager.py
import threading
import time
import os
import pickle
from collections import defaultdict
import numpy as np

from .config import GRID_W, GRID_H, N_AGENTS, DEFAULT_ALPHA, DEFAULT_GAMMA, DEFAULT_EPS, EPS_DECAY, QTABLE_PATH
from .env import MultiFieldEnv
from .agents import FarmAgent

class SimManager:
    def __init__(self):
        self.env = MultiFieldEnv(w=GRID_W, h=GRID_H, n_agents=N_AGENTS)
        default_roles = ['planter','planter','harvester','harvester','irrigator','irrigator']
        self.agents = []
        for i in range(self.env.n_agents):
            role = default_roles[i] if i < len(default_roles) else 'harvester'
            a = FarmAgent(i, self.env.agents_init[i], role=role,
                          alpha=DEFAULT_ALPHA, gamma=DEFAULT_GAMMA, eps=DEFAULT_EPS)
            self.agents.append(a)

        # training control
        self.running = False
        self.train_thread = None
        self.train_stats = {'episodes': []}
        self.lock = threading.Lock()
        self.params = {'alpha': DEFAULT_ALPHA, 'gamma': DEFAULT_GAMMA, 'eps': DEFAULT_EPS, 'eps_decay': EPS_DECAY}

        # trained-run control
        self.running_trained = False
        self.trained_thread = None

    def get_state(self):
        with self.lock:
            grid = self.env.grid.copy()
            agent_states = [{'id': a.id, 'pos': a.pos, 'role': a.role, 'harvested': a.harvested} for a in self.agents]
            bb = self.env.blackboard
            meta = {'step': self.env.step_count, 'harvested_total': getattr(self.env, 'harvested_total', 0)}
        return {'grid': grid.tolist(), 'agents': agent_states, 'blackboard': bb, 'meta': meta}

    # ----------------------------
    # TRAINING (unchanged)
    # ----------------------------
    def train_background(self, episodes=20, steps_per_episode=400):
        self.running = True
        for ep in range(episodes):
            if not self.running:
                break
            obs = self.env.reset()
            for i, a in enumerate(self.agents):
                a.pos = self.env.agents_init[i]
                a.harvested = 0
                a.set_eps(self.params['eps'])
                a.alpha = self.params['alpha']
                a.gamma = self.params['gamma']

            total_reward = 0.0
            for step in range(steps_per_episode):
                if not self.running:
                    break
                obs_list = self.env._get_obs()
                actions = {}
                states = []

                for i, a in enumerate(self.agents):
                    s = a.obs_to_state(obs_list[i])
                    states.append(s)
                    ai = a.choose_action(s)
                    actions[i] = {0: (0,0), 1: (1,0), 2: (-1,0), 3: (0,1), 4: (0,-1)}[ai]
                    if getattr(a, 'path', None):
                        nx, ny = a.path[0]
                        actions[i] = (nx - a.pos[0], ny - a.pos[1])

                proposals = self.env.step(self.agents, actions_by_q=actions)
                counts = {}
                for p in proposals:
                    counts[p] = counts.get(p, 0) + 1

                finals = []
                for i, p in enumerate(proposals):
                    if counts[p] > 1:
                        finals.append(self.agents[i].pos)
                    else:
                        finals.append(p)

                rewards, infos, done = self.env.apply_final_positions_and_harvest(self.agents, finals)
                total_reward += sum(rewards)

                obs2 = self.env._get_obs()
                for i, a in enumerate(self.agents):
                    s2 = a.obs_to_state(obs2[i])
                    idx_map = {(0,0): 0, (1,0): 1, (-1,0): 2, (0,1): 3, (0,-1): 4}
                    ai = idx_map.get((finals[i][0] - a.pos[0], finals[i][1] - a.pos[1]), 0)
                    a.update_q(states[i], ai, rewards[i], s2, done)

                for a in self.agents:
                    a.set_eps(max(0.01, a.eps * self.params['eps_decay']))

                if done:
                    break

            self.train_stats['episodes'].append({'ep': ep+1, 'reward': total_reward, 'harvested': self.env.harvested_total})
            if (ep+1) % 10 == 0:
                self.save_qs()

        self.running = False
        self.save_qs()

    def start_training(self, episodes=20, steps_per_episode=400):
        if self.running:
            return False
        self.train_thread = threading.Thread(target=self.train_background, args=(episodes, steps_per_episode), daemon=True)
        self.train_thread.start()
        return True

    def stop_training(self):
        self.running = False
        if self.train_thread:
            self.train_thread.join(timeout=1)
        self.save_qs()
        return True

    # ----------------------------
    # Q-TABLE I/O
    # ----------------------------
    def save_qs(self, path=QTABLE_PATH):
        data = []
        for a in self.agents:
            d = {}
            for k, v in a.Q.items():
                d[str(k)] = v.tolist()
            data.append(d)
        with open(path, "wb") as f:
            pickle.dump(data, f)

    def load_qs(self, path=QTABLE_PATH):
        if not os.path.exists(path):
            return False
        try:
            with open(path, "rb") as f:
                raw = pickle.load(f)
            for i, a in enumerate(self.agents):
                if i < len(raw):
                    newQ = defaultdict(lambda: np.zeros(5))
                    for k_str, arr in raw[i].items():
                        try:
                            key = eval(k_str)
                        except Exception:
                            key = k_str
                        newQ[key] = np.array(arr)
                    a.Q = newQ
            return True
        except Exception as e:
            print("Error loading Qs:", e)
            return False

    # ----------------------------
    # TRAINED RUN (new)
    # ----------------------------
    def best_action(self, agent, obs):
        """Return index of best action from agent.Q given observation."""
        s = agent.obs_to_state(obs)
        # if unseen state, return random
        if s not in agent.Q:
            return np.random.randint(0, 5)
        return int(np.argmax(agent.Q[s]))

    def run_trained_loop(self, sleep=0.12):
        """Loop that runs the environment using agents' Q-tables (in their current .Q)."""
        # reset environment and agent positions
        with self.lock:
            self.env.reset()
            for i, a in enumerate(self.agents):
                a.pos = self.env.agents_init[i]
                a.harvested = 0

        self.running_trained = True
        while self.running_trained:
            with self.lock:
                obs_list = self.env._get_obs()
                actions = {}
                for i, a in enumerate(self.agents):
                    act_idx = self.best_action(a, obs_list[i])
                    actions[i] = {0: (0,0), 1: (1,0), 2: (-1,0), 3: (0,1), 4: (0,-1)}[act_idx]

                proposals = self.env.step(self.agents, actions_by_q=actions)
                counts = {}
                for p in proposals:
                    counts[p] = counts.get(p, 0) + 1

                finals = []
                for i, p in enumerate(proposals):
                    if counts[p] > 1:
                        finals.append(self.agents[i].pos)
                    else:
                        finals.append(p)

                self.env.apply_final_positions_and_harvest(self.agents, finals)

            time.sleep(sleep)

        return True

    def start_run_trained(self):
        """Start the thread that runs the trained Q-tables in real-time."""
        if self.running_trained:
            return False
        # ensure Qs are loaded (caller can load beforehand)
        self.trained_thread = threading.Thread(target=self.run_trained_loop, daemon=True)
        self.trained_thread.start()
        return True

    def stop_run_trained(self):
        self.running_trained = False
        if self.trained_thread:
            self.trained_thread.join(timeout=1)
        return True

    # convenience static utilities for external use (optional)
    @staticmethod
    def load_qtables(path):
        with open(path, "rb") as f:
            return pickle.load(f)

    @staticmethod
    def run_simulation_return_frames(steps, width, height, n_agents, qtables, sleep=0.0):
        """Standalone simulation that returns frames (not used by real-time run)."""
        env = MultiFieldEnv(width, height, n_agents)
        agents = []
        for i in range(n_agents):
            a = FarmAgent(i, env.agents_init[i], "worker")
            # load qtable if provided
            if i < len(qtables):
                raw = qtables[i]
                newQ = defaultdict(lambda: np.zeros(5))
                for k_str, arr in raw.items():
                    try:
                        key = eval(k_str)
                    except Exception:
                        key = k_str
                    newQ[key] = np.array(arr)
                a.Q = newQ
            agents.append(a)

        frames = []
        for _ in range(steps):
            proposals = env.step(agents)
            _, _, _ = env.apply_final_positions_and_harvest(agents, proposals)
            frames.append({'grid': env.grid.tolist(), 'agents': [ag.pos for ag in agents]})
            if sleep:
                time.sleep(sleep)
        return frames
