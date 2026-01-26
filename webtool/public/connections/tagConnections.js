function drawTagConnections(planeEntries, jsonData, planeContent) {
  const svg = document.getElementById("plane-lines");
  if (!svg) return;
  svg.innerHTML = "";

  const tagMap = {};
  planeEntries.forEach((entry) => {
    const containerRect = planeContent.getBoundingClientRect();
    const narrativeIndex = parseInt(
      entry.querySelector('input[type="checkbox"]').dataset.index
    );
    const narrative = jsonData[narrativeIndex];
    if (!Array.isArray(narrative.tags)) return;
    narrative.tags.forEach((tag) => {
      if (tag.weight < 2) return;
      const tagEl = Array.from(entry.querySelectorAll(".plane-tag")).find(
        (el) => el.textContent.startsWith(tag.name)
      );
      if (!tagEl) return;
      const tagRect = tagEl.getBoundingClientRect();
      const x = tagRect.left - containerRect.left + tagRect.width / 2;
      const y = tagRect.top - containerRect.top + tagRect.height / 2;
      if (!tagMap[tag.name]) tagMap[tag.name] = [];
      tagMap[tag.name].push({ x, y });
    });
  });

  Object.values(tagMap).forEach((points) => {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", points[i].x);
        line.setAttribute("y1", points[i].y);
        line.setAttribute("x2", points[j].x);
        line.setAttribute("y2", points[j].y);
        line.setAttribute("stroke", "rgba(0,0,255,0.3)");
        line.setAttribute("stroke-width", 3);
        svg.appendChild(line);
      }
    }
  });
}
