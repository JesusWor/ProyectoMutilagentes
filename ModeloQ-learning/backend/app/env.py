import random
import numpy as np
from heapq import heappush, heappop
EMPTY=0; OBST=1; CROP=2; PATH=3; MANAGER=4; WATER=5
def heuristic(a,b): return abs(a[0]-b[0]) + abs(a[1]-b[1])
def astar(start, goal, obstacles_set, w, h):
    if start == goal: return [start]
    openq=[]; heappush(openq,(heuristic(start,goal),0,start,None))
    came={}; gscore={start:0}; closed=set()
    while openq:
        f,g,current,parent = heappop(openq)
        if current in closed: continue
        came[current] = parent
        if current == goal:
            path=[]; node=current
            while node:
                path.append(node); node=came[node]
            path.reverse(); return path
        closed.add(current)
        x,y = current
        for dx,dy in [(0,1),(0,-1),(1,0),(-1,0)]:
            nx,ny = x+dx, y+dy
            if not (0 <= nx < w and 0 <= ny < h): continue
            if (nx,ny) in obstacles_set: continue
            ng = g+1
            if ng < gscore.get((nx,ny), 1e9):
                gscore[(nx,ny)] = ng
                heappush(openq,(ng+heuristic((nx,ny),goal), ng, (nx,ny), current))
    return None
class MultiFieldEnv:
    def __init__(self, w=40, h=24, n_agents=3, crop_count=120, obst_count=60, max_steps=400):
        self.w=w; self.h=h; self.n_agents=n_agents
        self.crop_count=crop_count; self.obst_count=obst_count; self.max_steps=max_steps
        self.reset()
    def reset(self):
        self.grid = np.zeros((self.h,self.w), dtype=int) + EMPTY
        placed=0; attempts=0
        while placed < self.crop_count and attempts < self.crop_count*10:
            x=random.randrange(1,self.w-1); y=random.randrange(1,self.h-1)
            if self.grid[y,x]==EMPTY:
                self.grid[y,x] = CROP; placed+=1
            attempts+=1
        self.obstacles=set(); placed=0; attempts=0
        while placed < self.obst_count and attempts < self.obst_count*6:
            x=random.randrange(1,self.w-1); y=random.randrange(1,self.h-1)
            if self.grid[y,x]==EMPTY:
                self.grid[y,x]=OBST; self.obstacles.add((x,y)); placed+=1
            attempts+=1
        self.manager_pos=(self.w-2, self.h-2); self.grid[self.manager_pos[1], self.manager_pos[0]] = MANAGER
        starts=[]
        for i in range(self.n_agents):
            placed=False; attempts=0
            while not placed and attempts<1000:
                x=random.randrange(1,6); y=random.randrange(1,self.h-1)
                if self.grid[y,x]==EMPTY and (x,y) not in starts:
                    starts.append((x,y)); placed=True
                attempts+=1
            if not placed: starts.append((1,i+1))
        self.agents_init = starts
        self.compaction = np.zeros((self.h,self.w), dtype=int)
        self.water = np.zeros((self.h,self.w), dtype=int)
        self.blackboard = {'agents': {}, 'resources': {}, 'announcements': []}
        self.step_count = 0; self.harvested_total = 0
        return self._get_obs()
    def _get_obs(self):
        obs=[]
        occ = set(self.obstacles) | {self.manager_pos}
        for i,init in enumerate(self.agents_init):
            obs.append({'pos': init, 'goal': self.manager_pos, 'nearby': occ, 'blackboard': self.blackboard})
        return obs
    def _update_blackboard_from_agents(self, agents):
        for ag in agents:
            self.blackboard['agents'][f'agent_{ag.id}'] = {'pos': tuple(ag.pos), 'role': getattr(ag,'role',None), 'harvested': getattr(ag,'harvested',0)}
            if hasattr(ag,'outbox') and ag.outbox:
                msg = ag.outbox
                if isinstance(msg, dict) and msg.get('type') == 'resource':
                    cell = tuple(msg['pos']); self.blackboard['resources'].setdefault(cell, {'found_by':[], 'count':0})
                    self.blackboard['resources'][cell]['found_by'].append(ag.id); self.blackboard['resources'][cell]['count'] +=1
                elif isinstance(msg, str):
                    self.blackboard['announcements'].append((self.step_count, msg))
                ag.outbox = None
    def compute_paths(self, agents):
        obstset = set(self.obstacles) | {self.manager_pos}
        for i,ag in enumerate(agents):
            start = ag.pos; goal = self.manager_pos
            path = astar(start, goal, obstset, self.w, self.h)
            ag.path = path[1:] if path and len(path)>1 else []
    def step(self, agents, actions_by_q=None):
        self.step_count += 1
        if self.step_count % 50 == 0:
            for _ in range(3):
                x=random.randrange(1,self.w-1); y=random.randrange(1,self.h-1)
                if self.grid[y,x]==EMPTY: self.grid[y,x]=OBST; self.obstacles.add((x,y))
        if self.step_count % 70 == 0:
            for _ in range(5):
                x=random.randrange(1,self.w-1); y=random.randrange(1,self.h-1)
                if self.grid[y,x]==EMPTY:
                    self.grid[y,x] = CROP
        self._update_blackboard_from_agents(agents)
        self.compute_paths(agents)
        proposals=[]
        for i,ag in enumerate(agents):
            if actions_by_q and i in actions_by_q:
                dx,dy = actions_by_q[i]; nx,ny = ag.pos[0]+dx, ag.pos[1]+dy
            else:
                if ag.path: nx,ny = ag.path[0]
                else: nx,ny = ag.pos
            nx = max(0,min(self.w-1,nx)); ny = max(0,min(self.h-1,ny))
            proposals.append((nx,ny))
        return proposals
    def apply_final_positions_and_harvest(self, agents, final_positions):
        rewards = [0.0]*len(agents); infos=[{} for _ in agents]
        for i,ag in enumerate(agents):
            newpos = final_positions[i]; ag.pos = newpos
            x,y = newpos
            self.compaction[y,x] += 1
            comp = self.compaction[y,x]; comp_penalty = min(0.5, 0.05*(comp-1)) if comp>1 else 0.0
            if 0<=y<self.h and 0<=x<self.w and self.grid[y,x] == CROP:
                success = random.random() > comp_penalty
                if success:
                    self.grid[y,x] = PATH
                    ag.harvested = getattr(ag,'harvested',0) + 1
                    self.harvested_total += 1
                    rewards[i] += 40.0*(1-comp_penalty)
                    infos[i]['harvest'] = True
                    self.blackboard['announcements'].append((self.step_count, f"agent_{i} harvested {newpos}"))
                else:
                    rewards[i] -= 0.5
            else:
                rewards[i] -= 0.01
        done = (self.harvested_total >= self.crop_count//2) or (self.step_count >= self.max_steps)
        return rewards, infos, done
