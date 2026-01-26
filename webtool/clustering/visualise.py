import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Load clusters
with open("clustering/clusters-clean.json", "r", encoding="utf-8") as f:
    clusters = json.load(f)

# Prepare data for plotting
narratives = [len(c["narratives"]) for c in clusters]
tags = [len(c["common_tags"]) for c in clusters]
total_weights = [c["total_weight"] for c in clusters]
density = [c["density"] for c in clusters]
cluster_ids = [c["cluster_id"] for c in clusters]

# Add small jitter to avoid overlap
x_jittered = np.array(narratives) + np.random.uniform(-0.0, 0.0, size=len(narratives))
y_jittered = np.array(tags) + np.random.uniform(-0.03, 0.03, size=len(tags))

# Create scatter plot
plt.figure(figsize=(10, 6))
sns.set(style="whitegrid")

scatter = plt.scatter(
    x_jittered, 
    y_jittered, 
    s=[w*20 for w in total_weights],  # scale size for visibility
    c=density, 
    cmap='viridis', 
    alpha=0.7,
    edgecolors='k'
)

# Add colorbar for density
cbar = plt.colorbar(scatter)
cbar.set_label('Density')

# Annotate each point with cluster ID
for i, cid in enumerate(cluster_ids):
    plt.text(x_jittered[i]+0.05, y_jittered[i]+0.05, cid, fontsize=9)

plt.xlabel('Number of Narratives')
plt.ylabel('Number of Common Tags')

# Force integer ticks
import matplotlib.ticker as mticker
plt.gca().xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
plt.gca().yaxis.set_major_locator(mticker.MaxNLocator(integer=True))
plt.title('Cluster Overview: Narratives vs Tags (Size=Total Weight, Color=Density)')
plt.show()
