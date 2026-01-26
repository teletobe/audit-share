// hindexConnections.js
// The H-index for each node measures the largest number h...
// such that the node has at least h connections (edges) with a score larger or equal to h

// highlights nodes that are well-connected to other strong nodes,
// helping to identify dense, meaningful clusters rather than all connections equally
// Strong nodes = highly connected to other well-connected nodes.
// Strongly connected edges = high-weight or high-overlap tag connections between nodes.

// but very prone to small changes of the threshold.. can collapse or merge clusters.
// and ignores weaker but potentially meaningful connections,
// and it doesnt handle sparse networks well, so it may miss subtler patterns.

function drawHIndexConnections(planeEntries, jsonData, planeContent) {
  const svg = document.getElementById("plane-lines");
  if (!svg) return;
  svg.innerHTML = "";

  const containerRect = planeContent.getBoundingClientRect();

  const minScoreThreshold = parseFloat(
    document.getElementById("hindex-threshold")?.value || "1"
  );

  function getCenter(entry) {
    const rect = entry.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  }

  // --- Build nodes ---
  const nodes = planeEntries.map((entry) => {
    const idx = parseInt(
      entry.querySelector('input[type="checkbox"]').dataset.index,
      10
    );
    const narrative = jsonData[idx];
    const center = getCenter(entry);

    const tagsMap = {};
    if (Array.isArray(narrative.tags)) {
      narrative.tags.forEach((t) => {
        const w = Number(t.weight || 0);
        if (w > 0) tagsMap[t.name] = w;
      });
    }
    return { idx, center, tagsMap, name: narrative.name || "Untitled" };
  });

  // --- Compute edges based on shared tags ---
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let score = 0;
      const shared = [];
      for (const tagName in a.tagsMap) {
        if (Object.prototype.hasOwnProperty.call(b.tagsMap, tagName)) {
          score += (a.tagsMap[tagName] + b.tagsMap[tagName]) / 2;
          shared.push(tagName);
        }
      }
      if (score >= minScoreThreshold) {
        edges.push({ a, b, score, shared });
      }
    }
  }

  // --- Compute adjacency for H-index info (optional) ---
  const adjacency = {};
  nodes.forEach((n) => (adjacency[n.idx] = []));
  edges.forEach((e) => {
    adjacency[e.a.idx].push(e.score);
    adjacency[e.b.idx].push(e.score);
  });

  const hIndexMap = {};
  nodes.forEach((n) => {
    const scores = adjacency[n.idx].sort((a, b) => b - a);
    let h = 0;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] >= i + 1) h = i + 1;
    }
    hIndexMap[n.idx] = h;
  });

  // --- Connected-component clustering ---
  const clusterMap = {};
  let clusterId = 0;
  const visited = new Set();

  function dfs(node, clusterId) {
    if (visited.has(node.idx)) return;
    visited.add(node.idx);
    clusterMap[node.idx] = clusterId;

    edges.forEach((e) => {
      if (e.a.idx === node.idx || e.b.idx === node.idx) {
        const neighbor = e.a.idx === node.idx ? e.b : e.a;
        dfs(neighbor, clusterId);
      }
    });
  }

  nodes.forEach((n) => {
    if (!visited.has(n.idx)) {
      dfs(n, clusterId);
      clusterId++;
    }
  });

  // --- Tooltip ---
  let tooltip = document.getElementById("hindex-line-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "hindex-line-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.background = "rgba(0,0,0,0.8)";
    tooltip.style.color = "white";
    tooltip.style.padding = "6px 8px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.display = "none";
    tooltip.style.zIndex = 10000;
    document.body.appendChild(tooltip);
  }

  // --- Draw edges ---
  edges.forEach((e) => {
    const c1 = clusterMap[e.a.idx];
    const c2 = clusterMap[e.b.idx];
    if (c1 !== c2) return; // skip inter-cluster

    // color by cluster ID → hue
    const hue = (c1 * 137) % 360; // golden angle
    const color = `hsl(${hue}, 70%, 45%)`;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", e.a.center.x);
    line.setAttribute("y1", e.a.center.y);
    line.setAttribute("x2", e.b.center.x);
    line.setAttribute("y2", e.b.center.y);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", 1.5 + Math.log(e.score + 1));
    line.style.pointerEvents = "stroke";

    line.addEventListener("mouseenter", () => {
      tooltip.innerHTML = `
          <strong>${e.a.name}</strong> ↔ <strong>${e.b.name}</strong><br>
          Score: ${e.score}<br>
          Shared tags: ${e.shared.join(", ") || "—"}<br>
          H(A)=${hIndexMap[e.a.idx]}, H(B)=${hIndexMap[e.b.idx]}<br>
          Cluster ${c1}
        `;
      tooltip.style.display = "block";
    });
    line.addEventListener("mousemove", (evt) => {
      tooltip.style.left = evt.pageX + 12 + "px";
      tooltip.style.top = evt.pageY + 12 + "px";
    });
    line.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    svg.appendChild(line);
  });
}
