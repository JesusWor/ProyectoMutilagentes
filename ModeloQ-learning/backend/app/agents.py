import random
import numpy as np
from collections import defaultdict
ACTIONS = [(0,0),(1,0),(-1,0),(0,1),(0,-1)]
def zero_q():
    return np.zeros(len(ACTIONS))
class FarmAgent:
    def __init__(self, aid, start_pos, role='harvester', alpha=0.3, gamma=0.9, eps=0.25):
        self.id = aid
        self.pos = tuple(start_pos)
        self.role = role
        self.path = []
        self.harvested = 0
        self.outbox = None
        self.Q = defaultdict(zero_q)
        self.alpha = alpha; self.gamma = gamma; self.eps = eps
    def obs_to_state(self, obs):
        pos = obs['pos']; goal = obs['goal']; nearby = obs.get('nearby', set())
        dx = max(-6, min(6, goal[0]-pos[0])); dy = max(-6, min(6, goal[1]-pos[1]))
        occ = 0
        dirs = [(0,1),(0,-1),(-1,0),(1,0)]
        for i,d in enumerate(dirs):
            nb = (pos[0]+d[0], pos[1]+d[1])
            if nb in nearby:
                occ |= (1<<i)
        ann = len(obs.get('blackboard', {}).get('announcements', []))
        return (dx,dy,occ, min(ann,7))
    def choose_action(self, state):
        if random.random() < self.eps or state not in self.Q:
            return random.randrange(len(ACTIONS))
        return int(np.argmax(self.Q[state]))
    def update_q(self, s,a,r,s2, done=False):
        if s not in self.Q: self.Q[s] = np.zeros(len(ACTIONS))
        if s2 not in self.Q: self.Q[s2] = np.zeros(len(ACTIONS))
        q = self.Q[s][a]
        target = r if done else r + self.gamma * np.max(self.Q[s2])
        self.Q[s][a] = q + self.alpha * (target - q)
    def set_eps(self, eps):
        self.eps = eps
