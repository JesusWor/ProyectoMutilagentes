# agent.py
import agentpy as ap
import math

class OrbitAgent(ap.Agent):

    def setup(self):
        self.t = 0
        self.radius = self.p.radius
        self.speed = self.p.speed

    def step(self):
        self.t += self.speed
        self.x = math.sin(self.t) * self.radius
        self.y = 0
        self.z = math.cos(self.t) * self.radius
