let jsonData = [];
let planeEntries = [];
let selectedItems = [];
let currentView = "table"; // 'table' or 'plane'
let linesVisible = true; // Track line visibility state
let planeVisibility = []; // Track which narratives are visible in plane
let planePositions = {}; // Track positions of plane entries

// --- Connection strategy ---
let connectionStrategy = drawTagConnections; // default strategy (from tagConnections.js)

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("json-upload");
  const loadBtn = document.getElementById("load-json-btn");
  const efaBtn = document.getElementById("create-efa-btn");
  const table = document.getElementById("narrative-table");
  const tbody = document.getElementById("table-body");
  const efaBtnContainer = document.getElementById("efa-btn-container");
  const modal = document.getElementById("efa-modal");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalForm = document.getElementById("efa-form");
  const selectedNarrativesContainer = document.getElementById(
    "selected-narratives"
  );
  const addCriteriaBtn = document.getElementById("add-criteria-btn");
  const criteriaList = document.getElementById("criteria-list");
  const toggleViewBtn = document.getElementById("toggle-view");
  const resetViewBtn = document.getElementById("reset-view");
  const planeContainer = document.getElementById("free-plane-container");
  const planeContent = document.getElementById("plane-content");
  const planeSidebar = document.getElementById("plane-sidebar");
  const narrativeList = document.getElementById("narrative-list");
  const toggleSidebarBtn = document.getElementById("toggle-sidebar");
  const toggleLinesBtn = document.getElementById("toggle-lines-btn");

  // Dropdown for connection strategies
  const strategySelect = document.createElement("select");
  strategySelect.id = "connection-strategy";
  strategySelect.innerHTML = `
    <option value="tag">Tag Connections</option>
    <option value="weight">Weight Connections</option>
    <option value="hindex">H-Index Connections</option>
    <option value="stepwise">Stepwise Connections</option>
  `;

  const hindexContainer = document.getElementById("hindex-slider-container");
  hindexContainer.style.display =
    strategySelect.value === "hindex" ? "inline-block" : "none";

  document.querySelector(".view-toggle").appendChild(strategySelect);

  strategySelect.addEventListener("change", () => {
    if (strategySelect.value === "tag") {
      connectionStrategy = drawTagConnections;
      hindexContainer.style.display = "none";
    } else if (strategySelect.value === "hindex") {
      connectionStrategy = drawHIndexConnections;
      hindexContainer.style.display = "inline-block";
    } else if (strategySelect.value === "weight") {
      connectionStrategy = drawWeightConnections;
      hindexContainer.style.display = "none";
    } else if (strategySelect.value === "stepwise") {
      connectionStrategy = drawStepwiseConnections;
      hindexContainer.style.display = "none";
    }
    renderPlaneView();
  });

  // H-index threshold slider
  const hindexSlider = document.getElementById("hindex-threshold");
  const hindexValue = document.getElementById("hindex-threshold-value");

  if (hindexSlider) {
    hindexSlider.addEventListener("input", () => {
      hindexValue.textContent = hindexSlider.value;
      if (strategySelect.value === "hindex") {
        renderPlaneView(); // redraw with new threshold
      }
    });
  }

  // Initialize core values
  const valueOptions = [
    "Privacy",
    "Transparency",
    "Accountability",
    "Autonomy",
    "Safety",
    "Trust",
    "Dignity",
    "Reliability",
    "Accessibility",
    "Fairness",
    "Inclusiveness",
    "Authenticity",
    "Beneficence",
    "Creativity",
    "Diversity",
    "Growth",
    "Empowerment",
    "Happiness",
    "Health",
    "Honesty",
    "Justice",
    "Participation",
    "Respect",
    "Support / Solidarity",
    "Sustainability",
    "Non-maleficence",
  ];

  const coreValuesContainer = document.getElementById("coreValuesContainer");
  coreValuesContainer.classList.add("checkbox-grid");
  valueOptions.forEach((value) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "efa-core-values";
    checkbox.value = value;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(value));
    coreValuesContainer.appendChild(label);
  });

  // --- Create EFA button ---
  efaBtn.addEventListener("click", async () => {
    const checkboxes =
      currentView === "table"
        ? document.querySelectorAll(".select-narrative:checked")
        : document.querySelectorAll(
            "#plane-content .plane-entry input[type='checkbox']:checked"
          );

    const selectedIndexes = Array.from(checkboxes).map((cb) =>
      parseInt(cb.dataset.index)
    );
    const selectedNarratives = selectedIndexes.map((index) => jsonData[index]);

    if (selectedNarratives.length === 0) {
      alert("Please select at least one narrative.");
      return;
    }

    // Show modal
    modal.style.display = "block";
    modalOverlay.style.display = "block";
    modalForm.dataset.selectedIndexes = JSON.stringify(selectedIndexes);

    // Placeholder while loading narrative contents
    selectedNarrativesContainer.innerHTML =
      '<div class="loading">Loading narrative content...</div>';

    try {
      const narrativeContents = await Promise.all(
        selectedNarratives.map(async (narrative) => {
          try {
            const response = await fetch(
              `data/narratives/${narrative.name}.txt`
            );
            if (!response.ok) {
              throw new Error(`File not found: ${narrative.name}.txt`);
            }
            return await response.text();
          } catch (error) {
            return `Error loading narrative content: ${
              error.message
            }\n\nJSON Context: ${narrative.context || "No context"}`;
          }
        })
      );

      const reflexiveQuestions = [
        "What positions inform the concerns, expectations and values of this data?",
        "Which groups are affected and excluded if this data shapes the system and its assessment?",
        "Does this perspective reinforce structural inequalities?",
        "Would implementing this risk harm to any groups?",
        "Is this concern following e.g. human rights?",
      ];

      selectedNarrativesContainer.innerHTML = selectedNarratives
        .map((n, i) => {
          const promptsHtml = reflexiveQuestions
            .map(
              (q, idx) => `
        <li>
          <label><strong>${q}</strong></label>
          <textarea 
            name="reflexive-answer-${i}-${idx}" 
            placeholder=" Your reflection..." 
            class="reflexive-answer"
            rows="2"
            style="width: 100%; margin-top: 0.3rem; margin-bottom: 0.7rem; resize: vertical;"
          ></textarea>
        </li>`
            )
            .join("");

          return `
      <div class="narrative-full">
        <h3>${n.name || "Untitled"}</h3>
        <div class="narrative-content">${narrativeContents[i]}</div>
        <div class="reflexive-prompts">
          <p><strong>Reflexive prompts for this narrative:</strong></p>
          <ul>${promptsHtml}</ul>
        </div>
      </div>
    `;
        })
        .join("<hr>");
    } catch (error) {
      selectedNarrativesContainer.innerHTML = `<div class="error">Error loading narratives: ${error.message}</div>`;
    }
  });

  // --- Modal close buttons ---
  modalCloseBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  function closeModal() {
    modal.style.display = "none";
    modalOverlay.style.display = "none";
  }

  // --- Add Criterion button ---
  if (addCriteriaBtn) {
    addCriteriaBtn.addEventListener("click", () => {
      const container = document.createElement("div");
      container.classList.add("criteria-entry");

      container.innerHTML = `
        <label>Requirement Type:
          <select name="requirement-type">
            <option value="must">Must do</option>
            <option value="should">Should do</option>
            <option value="must-not">Must not do</option>
          </select>
        </label>
        <label>Description:
          <input type="text" name="criteria-description" required>
        </label>
        <label>How to test:
          <input type="text" name="criteria-method" required>
        </label>
        <label>Status:
          <select name="criteria-status">
            <option value="not-tested">Not tested</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <hr>
      `;

      criteriaList.appendChild(container);
    });
  }

  // --- EFA form submission ---
  modalForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const coreValues = Array.from(
      modalForm.querySelectorAll("input[name='efa-core-values']:checked")
    ).map((el) => el.value);

    const criteriaEntries = Array.from(
      criteriaList.querySelectorAll(".criteria-entry")
    );
    const testableCriteria = criteriaEntries.map((entry) => ({
      type: entry.querySelector("select[name='requirement-type']").value,
      description: entry.querySelector("input[name='criteria-description']")
        .value,
      method: entry.querySelector("input[name='criteria-method']").value,
      status: entry.querySelector("select[name='criteria-status']").value,
    }));

    const efa = {
      id: modalForm["efa-id"].value,
      title: modalForm["efa-title"].value,
      description: modalForm["efa-description"].value,
      coreValues,
      testableCriteria,
      weight: modalForm["efa-weight"].value,
      priority: modalForm["efa-priority"].value,
      linkedNarratives: JSON.parse(modalForm.dataset.selectedIndexes).map(
        (i) => jsonData[i]
      ),
    };

    console.log("Created EFA:", efa);
    alert(`EFA created successfully (check console for JSON).`);

    // Download JSON
    const blob = new Blob([JSON.stringify(efa, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${efa.id || "efa"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Reset modal
    modalForm.reset();
    criteriaList.innerHTML = "";
    selectedNarrativesContainer.innerHTML = "";
    closeModal();
  });

  // Toggle sidebar button
  toggleSidebarBtn.addEventListener("click", () => {
    if (planeSidebar.style.display === "none") {
      planeSidebar.style.display = "block";
      toggleSidebarBtn.textContent = "☰ Hide Sidebar";
    } else {
      planeSidebar.style.display = "none";
      toggleSidebarBtn.textContent = "☰ Show Sidebar";
    }
  });

  // Load JSON button
  loadBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        jsonData = JSON.parse(e.target.result);
        if (!Array.isArray(jsonData)) throw new Error("JSON must be an array.");
        tbody.innerHTML = "";
        selectedItems = [];
        jsonData.forEach((narrative, index) => {
          const row = createTableRow(narrative, index);
          tbody.appendChild(row);
        });
        table.style.display = "table";
        planeContainer.style.display = "none";
        efaBtnContainer.style.display = "flex";
        planeVisibility = new Array(jsonData.length).fill(false);
        renderSidebar();
      } catch (err) {
        alert("Error parsing JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Toggle view button
  toggleViewBtn.addEventListener("click", () => {
    if (currentView === "table") {
      currentView = "plane";
      table.style.display = "none";
      planeContainer.style.display = "block";
      toggleViewBtn.textContent = "Switch to Table View";
      resetViewBtn.style.display = "inline-block";
      toggleSidebarBtn.style.display = "block";
      planeSidebar.style.display = "block";
      renderPlaneView();
    } else {
      currentView = "table";
      table.style.display = "table";
      planeContainer.style.display = "none";
      toggleViewBtn.textContent = "Switch to Free Plane View";
      resetViewBtn.style.display = "none";
      toggleSidebarBtn.style.display = "none";
    }
  });

  resetViewBtn.addEventListener("click", renderPlaneView);

  // Toggle lines
  toggleLinesBtn.addEventListener("click", function () {
    linesVisible = !linesVisible;
    const svg = document.getElementById("plane-lines");
    if (svg) svg.style.display = linesVisible ? "block" : "none";
    this.textContent = linesVisible ? "Hide Lines" : "Show Lines";
  });

  // --- helper functions (shortened for clarity) ---
  function createTableRow(narrative, index) {
    const row = document.createElement("tr");
    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("select-narrative");
    checkbox.dataset.index = index;
    checkbox.addEventListener("change", () => toggleItemSelection(index));
    selectCell.appendChild(checkbox);
    row.appendChild(selectCell);
    const nameCell = document.createElement("td");
    nameCell.textContent = narrative.name || "—";
    row.appendChild(nameCell);
    const contextCell = document.createElement("td");
    contextCell.textContent = narrative.context || "—";
    row.appendChild(contextCell);
    const tagsCell = document.createElement("td");
    if (Array.isArray(narrative.tags)) {
      tagsCell.textContent = narrative.tags
        .map((tag) => {
          let type =
            tag.weight === 3
              ? "SI"
              : tag.weight === 2
              ? "I"
              : tag.weight === 1
              ? "R"
              : "?";
          return `${tag.name} (${type})`;
        })
        .join(", ");
    } else {
      tagsCell.textContent = "—";
    }
    row.appendChild(tagsCell);
    return row;
  }

  function renderSidebar() {
    narrativeList.innerHTML = "";
    jsonData.forEach((narrative, index) => {
      const listItem = document.createElement("div");
      listItem.className = "narrative-list-item";
      listItem.innerHTML = `
        <input type="checkbox" id="narrative-${index}" data-index="${index}" ${
        planeVisibility[index] ? "checked" : ""
      }>
        <label for="narrative-${index}" class="narrative-list-name">${
        narrative.name || "Untitled"
      }</label>
      `;
      narrativeList.appendChild(listItem);
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      checkbox.addEventListener("change", (e) => {
        planeVisibility[index] = e.target.checked;
        if (currentView === "plane") renderPlaneView();
      });
    });
  }

  function toggleItemSelection(index) {
    const itemIndex = selectedItems.indexOf(index);
    if (itemIndex === -1) selectedItems.push(index);
    else selectedItems.splice(itemIndex, 1);
    updateSelectionState();
  }

  function updateSelectionState() {
    document.querySelectorAll("#table-body tr").forEach((row) => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const index = parseInt(checkbox.dataset.index);
      checkbox.checked = selectedItems.includes(index);
    });
    document.querySelectorAll(".plane-entry").forEach((entry) => {
      const checkbox = entry.querySelector("input[type='checkbox']");
      const index = parseInt(checkbox.dataset.index);
      checkbox.checked = selectedItems.includes(index);
    });
  }

  function renderPlaneView() {
    planeContent.innerHTML = "";
    planeEntries = [];
    if (!jsonData.length) return;
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "plane-lines";
    svg.style.position = "absolute";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.display = linesVisible ? "block" : "none";
    planeContent.appendChild(svg);
    toggleLinesBtn.textContent = linesVisible ? "Hide Lines" : "Show Lines";

    let visibleCount = 0;
    const cols = 4,
      entryWidth = 300,
      horizontalSpacing = 50,
      verticalSpacing = 150;
    const containerWidth = planeContent.offsetWidth;
    const gridWidth =
      cols * (entryWidth + horizontalSpacing) - horizontalSpacing;
    const startX = Math.max(0, (containerWidth - gridWidth) / 2);
    let startY = 50;

    jsonData.forEach((narrative, index) => {
      if (!planeVisibility[index]) return;
      const entry = document.createElement("div");
      entry.className = "plane-entry";
      const col = visibleCount % cols;
      const row = Math.floor(visibleCount / cols);
      let left = startX + col * (entryWidth + horizontalSpacing);
      let top = startY + (row % 5) * verticalSpacing;
      if (planePositions[index]) {
        left = planePositions[index].left;
        top = planePositions[index].top;
      }
      entry.style.left = `${left}px`;
      entry.style.top = `${top}px`;
      entry.style.width = `${entryWidth}px`;
      entry.innerHTML = `
        <div class="plane-entry-header">
          <input type="checkbox" class="select-narrative" data-index="${index}">
          <div class="plane-entry-name">${narrative.name || "Untitled"}</div>
        </div>
        <div class="plane-entry-content">${
          narrative.context || "No context provided"
        }</div>
        <div class="plane-entry-tags">
          ${
            Array.isArray(narrative.tags)
              ? narrative.tags
                  .map((tag) => {
                    let type =
                      tag.weight === 3
                        ? "SI"
                        : tag.weight === 2
                        ? "I"
                        : tag.weight === 1
                        ? "R"
                        : "?";
                    return `<span class="plane-tag">${tag.name} (${type})</span>`;
                  })
                  .join("")
              : ""
          }
        </div>
      `;
      planeContent.appendChild(entry);
      planeEntries.push(entry);
      makeDraggable(entry, index);
      const checkbox = entry.querySelector("input[type='checkbox']");
      checkbox.addEventListener("change", () => toggleItemSelection(index));
      visibleCount++;
    });

    connectionStrategy(planeEntries, jsonData, planeContent);
  }

  function makeDraggable(element, index) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    element.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;
      element.style.top = `${newTop}px`;
      element.style.left = `${newLeft}px`;
      planePositions[index] = { top: newTop, left: newLeft };
      connectionStrategy(planeEntries, jsonData, planeContent);
    }
    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
});
