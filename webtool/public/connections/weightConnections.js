function drawWeightConnections(planeEntries, jsonData, planeContent) {
  const svg = document.getElementById("plane-lines");
  if (!svg) return;
  svg.innerHTML = ""; // clear previous lines

  const containerRect = planeContent.getBoundingClientRect();

  // helper: center coordinates of an entry relative to planeContent
  function getCenter(entry) {
    const rect = entry.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  }

  // Build node info: center + map of tagName -> numeric weight
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
        const name = String(t.name);
        const w = Number(t.weight || 0); // numeric conversion (important)
        if (w > 0) tagsMap[name] = w;
      });
    }

    return { idx, center, tagsMap, name: narrative.name || "Untitled" };
  });

  // Build connection list based on shared tags (sum of both weights for each shared tag)
  const connections = [];
  let minScore = Infinity;
  let maxScore = -Infinity;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      let score = 0;
      const shared = [];

      for (const tagName in a.tagsMap) {
        if (Object.prototype.hasOwnProperty.call(b.tagsMap, tagName)) {
          const wA = a.tagsMap[tagName];
          const wB = b.tagsMap[tagName];
          // accumulate a pair score for this tag (you can tweak formula)
          score += wA + wB;
          shared.push(tagName);
        }
      }

      if (score > 0) {
        minScore = Math.min(minScore, score);
        maxScore = Math.max(maxScore, score);
        connections.push({ a, b, score, shared });
      }
    }
  }

  if (connections.length === 0) return; // nothing to draw

  // map score -> color (green -> orange -> red) and stroke width
  function scoreToVisuals(score) {
    // normalize 0..1
    let ratio = (score - minScore) / (maxScore - minScore || 1);

    // apply an exponential-like curve
    const exponent = 2; // bigger = steeper falloff
    ratio = Math.pow(ratio, exponent);

    // color from green  orange  red
    const r = Math.round(200 * ratio + 0 * (1 - ratio));
    const g = Math.round(128 * (1 - ratio));
    const b = 0;

    const alpha = 0.65;
    const minW = 1.0;
    const maxW = 16;
    const strokeWidth = minW + ratio * (maxW - minW);

    return { color: `rgba(${r},${g},${b},${alpha})`, strokeWidth, ratio };
  }

  // tooltip (reused)
  let tooltip = document.getElementById("weight-line-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "weight-line-tooltip";
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

  // draw lines
  connections.forEach((conn) => {
    const p1 = conn.a.center;
    const p2 = conn.b.center;
    const { color, strokeWidth } = scoreToVisuals(conn.score);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", strokeWidth);
    line.setAttribute("class", "plane-line");
    // allow mouse events so tooltip works
    line.style.pointerEvents = "stroke";

    // tooltip handlers
    line.addEventListener("mouseenter", (e) => {
      tooltip.textContent = `Shared tags: ${conn.shared.join(
        ", "
      )} - score: ${conn.score.toFixed(1)}`;
      tooltip.style.display = "block";
    });
    line.addEventListener("mousemove", (e) => {
      tooltip.style.left = e.pageX + 12 + "px";
      tooltip.style.top = e.pageY + 12 + "px";
    });
    line.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    svg.appendChild(line);
  });
}
