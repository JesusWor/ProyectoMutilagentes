import agentpy as ap
import math
import matplotlib.pyplot as plt

class OrbitAgent(ap.Agent):

    def setup(self):
        self.t = self.id * (2 * math.pi / self.model.p.N)  # <- Desfase segun ID
        self.history = []

    def step(self):
        self.t += self.p.speed
        self.x = math.sin(self.t) * self.p.radius
        self.y = 0
        self.z = math.cos(self.t) * self.p.radius

        self.history.append((self.x, self.z))

class OrbitModel(ap.Model):

    def setup(self):
        self.agents = ap.AgentList(self, self.p.N, OrbitAgent)
    
    def step(self):
        for a in self.agents:
            a.step()

    def plot_paths(self):
        plt.figure(figsize=(6,6))
        for a in self.agents:
            xs = [p[0] for p in a.history]
            zs = [p[1] for p in a.history]
            plt.plot(xs, zs, label=f"Agente {a.id}")

        plt.title("Trayectoria de agentes")
        plt.xlabel("Eje X")
        plt.ylabel("Eje Z")
        plt.legend()
        plt.grid(True)
        plt.savefig("trayectorias.png")
        plt.close()