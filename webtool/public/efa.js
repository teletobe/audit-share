document.addEventListener("DOMContentLoaded", () => {
  let selectedTags = [];
  let autoSelectedTags = [];
  let currentFileContent = "";
  let currentFileName = "";
  window.narratives = [];

  // Initialize tag sections with click handlers
  const initTagSection = (containerId, tagsArray, updateDisplayFn) => {
    const container = document.getElementById(containerId);

    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("tag-btn")) {
        const tag = e.target.getAttribute("data-tag");
        e.target.classList.toggle("selected");

        const tagIndex = tagsArray.indexOf(tag);
        if (tagIndex !== -1) {
          tagsArray.splice(tagIndex, 1);
        } else {
          tagsArray.push(tag);
        }
        updateDisplayFn();
      }

      if (e.target.id === `${containerId}-add-btn`) {
        const newTagInput = document.getElementById(`${containerId}-new-tag`);
        const newTag = newTagInput.value.trim();

        if (newTag && !tagsArray.includes(newTag)) {
          tagsArray.push(newTag);
          newTagInput.value = "";
          updateDisplayFn();
        }
      }
    });
  };

  // Update tag display in the given container
  const updateTagsDisplay = (containerId, tagsArray) => {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    tagsArray.forEach((tag) => {
      const tagEl = document.createElement("div");
      tagEl.className = "tag";
      tagEl.innerHTML = `
            ${tag}
            <span class="remove-tag" data-tag="${tag}">×</span>
          `;
      container.appendChild(tagEl);

      tagEl.querySelector(".remove-tag").addEventListener("click", (e) => {
        const tagToRemove = e.target.getAttribute("data-tag");
        const index = tagsArray.indexOf(tagToRemove);
        if (index !== -1) {
          tagsArray.splice(index, 1);
          updateTagsDisplay(containerId, tagsArray);
        }
      });
    });
  };

  // Load narratives from localStorage
  function loadNarratives() {
    const savedNarratives = localStorage.getItem("narratives");
    if (savedNarratives) {
      window.narratives = JSON.parse(savedNarratives);
      renderNarrativeTable();
    }
  }

  // Save narratives to localStorage
  function saveNarratives() {
    localStorage.setItem("narratives", JSON.stringify(window.narratives));
  }

  // Render narrative table
  function renderNarrativeTable() {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";

    window.narratives.forEach((narrative, index) => {
      const row = document.createElement("tr");
      const rowId = `row-${index}`;
      row.setAttribute("id", rowId);

      const tagsHtml = narrative.tags
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join(" ");

      row.innerHTML = `
            <td class="select-cell">
              <input type="checkbox" class="row-select" data-row-id="${rowId}">
            </td>
            <td>${narrative.name}</td>
            <td>${narrative.context}</td>
            <td>${tagsHtml}</td>
            <td>
              <button class="remove-btn" data-row-id="${rowId}">✕</button>
            </td>
          `;

      tableBody.appendChild(row);

      row
        .querySelector(".row-select")
        .addEventListener("change", updateSelectionCount);

      row.querySelector(".remove-btn").addEventListener("click", () => {
        window.narratives.splice(index, 1);
        saveNarratives();
        renderNarrativeTable();
        updateSelectionCount();
      });
    });

    updateSelectionCount();
  }

  // Load tag sections from HTML files and setup UI
  async function loadTagSections() {
    const manualContainer = document.getElementById("tags-container");
    const autoContainer = document.getElementById("auto-tags-container");

    if (!manualContainer || !autoContainer) return;

    try {
      const tagFiles = [
        "tags/advice-types.html",
        "tags/stakeholders.html",
        "tags/ethical-values.html",
      ];

      for (const file of tagFiles) {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        const content = await response.text();
        manualContainer.innerHTML += content;
        autoContainer.innerHTML += content;
      }

      manualContainer.innerHTML += `
            <div class="custom-tag">
              <input type="text" id="tags-container-new-tag" placeholder="Add custom tag">
              <button type="button" id="tags-container-add-btn">+</button>
            </div>
          `;

      autoContainer.innerHTML += `
            <div class="custom-tag">
              <input type="text" id="auto-tags-container-new-tag" placeholder="Add custom tag">
              <button type="button" id="auto-tags-container-add-btn">+</button>
            </div>
          `;
      // Remove or hide the loading message
      const loadingManual = manualContainer.querySelector(".loading-tags");
      if (loadingManual) loadingManual.remove();

      const loadingAuto = autoContainer.querySelector(".loading-tags");
      if (loadingAuto) loadingAuto.remove();

      initTagSection("tags-container", selectedTags, () =>
        updateTagsDisplay("selected-tags", selectedTags)
      );

      initTagSection("auto-tags-container", autoSelectedTags, () =>
        updateTagsDisplay("auto-selected-tags", autoSelectedTags)
      );
    } catch (error) {
      console.error("Error loading tag sections:", error);
      manualContainer.innerHTML = '<p class="error">Error loading tags.</p>';
      autoContainer.innerHTML = '<p class="error">Error loading tags.</p>';
    }
  }

  // Reset tags UI and clear tags array
  const resetTags = (containerId, tagsArray) => {
    tagsArray.length = 0;
    updateTagsDisplay(`${containerId}-tags`, tagsArray);
    document
      .querySelectorAll(`#${containerId} .tag-btn`)
      .forEach((btn) => btn.classList.remove("selected"));
    const newTagInput = document.getElementById(`${containerId}-new-tag`);
    if (newTagInput) newTagInput.value = "";
  };

  // Update selection count and toggle create button
  function updateSelectionCount() {
    const selectedCount = document.querySelectorAll(
      "input.row-select:checked"
    ).length;
    const totalCount = document.querySelectorAll("input.row-select").length;
    document.getElementById(
      "selection-count"
    ).textContent = `${selectedCount} of ${totalCount} narratives selected`;
    document.getElementById("create-efa-btn").disabled = selectedCount === 0;
  }

  // Read file content as text, returns Promise<string>
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Download all narratives as JSON file
  function downloadNarrativesAsJSON() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(window.narratives, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "narratives.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }

  // Create an EFA object and download as JSON file
  function createAndDownloadEFA(selectedNarratives) {
    if (selectedNarratives.length === 0) {
      alert("No narratives selected to create EFA.");
      return;
    }

    const efa = {
      efaName: `EFA - ${new Date().toISOString()}`,
      dateCreated: new Date().toISOString(),
      narratives: selectedNarratives,
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(efa, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `efa_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }

  // Event listener for manual narrative form submission
  document.getElementById("manual-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const context = document.getElementById("context").value.trim();

    if (name && context && selectedTags.length > 0) {
      window.narratives.push({
        name,
        context,
        tags: [...selectedTags],
        content: "",
      });
      saveNarratives();
      renderNarrativeTable();
      document.getElementById("name").value = "";
      document.getElementById("context").value = "";
      resetTags("tags-container", selectedTags);
    } else {
      alert("Please fill all fields and select at least one tag");
    }
  });

  // Event listener for automated narrative form submission
  document.getElementById("automated-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("auto-name").value.trim();
    const context = document.getElementById("auto-context").value.trim();

    if (name && context && autoSelectedTags.length > 0) {
      window.narratives.push({
        name,
        context,
        tags: [...autoSelectedTags],
        content: currentFileContent,
      });
      saveNarratives();
      renderNarrativeTable();
      document.getElementById("automated-form-container").style.display =
        "none";
      resetTags("auto-tags-container", autoSelectedTags);
    } else {
      alert("Please fill all fields and select at least one tag");
    }
  });

  // Cancel button hides automated form and resets tags
  document.getElementById("cancel-btn").addEventListener("click", () => {
    document.getElementById("automated-form-container").style.display = "none";
    resetTags("auto-tags-container", autoSelectedTags);
  });

  // Process button reads selected files and pre-fills automated form
  document.getElementById("process-btn").addEventListener("click", async () => {
    const fileInput = document.getElementById("file-input");
    const files = fileInput.files;

    if (files.length === 0) {
      alert("Please select at least one .txt file to process");
      return;
    }

    for (const file of files) {
      try {
        const content = await readFileAsText(file);
        currentFileContent = content;
        currentFileName = file.name.replace(/\.[^/.]+$/, "");

        let narrativeId = "N/A";
        const idMatch = content.match(/Narrative ID:\s*(.+)/);
        if (idMatch && idMatch[1]) narrativeId = idMatch[1].trim();

        let coreConcern = "";
        const concernMatch = content.match(
          /Core Concern\s*\n([\s\S]+?)\n\nContext/
        );
        if (concernMatch && concernMatch[1])
          coreConcern = concernMatch[1].trim();

        document.getElementById("automated-form-container").style.display =
          "block";
        document.getElementById("auto-name").value = narrativeId;
        document.getElementById("auto-context").value = coreConcern;
        document.getElementById("file-content-display").textContent = content;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
  });

  // Create EFA button creates EFA JSON from selected narratives and downloads it
  document.getElementById("create-efa-btn").addEventListener("click", () => {
    const selectedCheckboxes = document.querySelectorAll(
      "input.row-select:checked"
    );
    const selectedNarratives = [];

    selectedCheckboxes.forEach((checkbox) => {
      const rowId = checkbox.getAttribute("data-row-id");
      const rowIndex = parseInt(rowId.split("-")[1], 10);
      if (window.narratives[rowIndex]) {
        selectedNarratives.push(window.narratives[rowIndex]);
      }
    });

    createAndDownloadEFA(selectedNarratives);
  });

  // Export JSON button downloads all narratives as JSON file
  document.getElementById("export-json-btn").addEventListener("click", () => {
    if (window.narratives.length === 0) {
      alert("No narratives to export.");
      return;
    }
    downloadNarrativesAsJSON();
  });

  // Tab buttons switch between manual and automated narrative input forms
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Initialize everything
  loadTagSections();
  loadNarratives();
});
