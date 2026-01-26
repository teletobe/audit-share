function drawStepwiseConnections(planeEntries, jsonData, planeContent) {
  const svg = document.getElementById("plane-lines");
  if (!svg) return;
  svg.innerHTML = "";

  const containerRect = planeContent.getBoundingClientRect();

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
      entry.querySelector("input[type='checkbox']").dataset.index,
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

  // --- Find all edges ---
  const edges = [];
  nodes.forEach((a, i) => {
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let score = 0;
      const shared = [];
      for (const tag in a.tagsMap) {
        if (b.tagsMap[tag] !== undefined) {
          score += (a.tagsMap[tag] + b.tagsMap[tag]) / 2;
          shared.push(tag);
        }
      }
      if (score > 0) edges.push({ a, b, score, shared });
    }
  });

  if (edges.length === 0) return;

  // --- Step 1: find the strongest seed edge ---
  const strongEdges = edges.filter(
    (e) =>
      e.shared.length >= 5 && // rather arbitrary chosen...
      e.shared.every((t) => e.a.tagsMap[t] >= 2 && e.b.tagsMap[t] >= 2)
  );

  if (strongEdges.length === 0) return;

  strongEdges.sort((a, b) => b.score - a.score);
  const seedEdge = strongEdges[0];

  const clusterNodes = new Set([seedEdge.a.idx, seedEdge.b.idx]);
  const clusterEdges = [seedEdge];
  const clusterTags = new Set(seedEdge.shared);

  // Midpoint of seed edge for second-order edges
  const midpoint = {
    x: (seedEdge.a.center.x + seedEdge.b.center.x) / 2,
    y: (seedEdge.a.center.y + seedEdge.b.center.y) / 2,
  };

  // --- Step 2: add second-order nodes connected to seed edge ---
  let added;
  do {
    added = false;
    nodes.forEach((n) => {
      if (clusterNodes.has(n.idx)) return;

      // check if node shares any seed tags
      const shared = Array.from(clusterTags).filter(
        (t) => n.tagsMap[t] !== undefined && n.tagsMap[t] >= 1
      );

      if (shared.length > 0) {
        clusterNodes.add(n.idx);
        clusterEdges.push({
          a: null,
          b: n,
          score: shared.length,
          shared,
          fromMid: true,
        });
        shared.forEach((t) => clusterTags.add(t));
        added = true;
      }
    });
  } while (added);

  // --- Tooltip ---
  let tooltip = document.getElementById("stepwise-midpoint-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "stepwise-midpoint-tooltip";
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
  clusterEdges.forEach((e) => {
    let p1, p2, color, strokeWidth;

    if (e.fromMid) {
      // second-order edge from midpoint
      p1 = midpoint;
      p2 = e.b.center;
      color = `rgba(255,165,0,0.7)`; // orange
      strokeWidth = 2 + e.score * 3; // thickness proportional to number of shared tags
    } else {
      // first-order seed edge
      p1 = e.a.center;
      p2 = e.b.center;
      color = `red`;
      strokeWidth = 3 + e.score;
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", strokeWidth);
    line.style.pointerEvents = "stroke";

    line.addEventListener("mouseenter", () => {
      tooltip.innerHTML = e.fromMid
        ? `<strong>Second-order</strong> ↔ <strong>${e.b.name}</strong><br>
           Shared tags: ${e.shared.join(", ")}<br>
           Score: ${e.score}`
        : `<strong>${e.a.name}</strong> ↔ <strong>${e.b.name}</strong><br>
           Shared tags: ${e.shared.join(", ")}<br>
           Score: ${e.score}`;
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
