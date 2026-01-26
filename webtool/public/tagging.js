document.addEventListener("DOMContentLoaded", () => {
  let selectedTags = [];
  let autoSelectedTags = [];
  let currentFileContent = "";
  let currentFileName = "";

  window.narratives = [];

  const updateTagsDisplay = (containerId, tagsArray) => {
    const container = document.getElementById(containerId);
    container.innerHTML = tagsArray
      .map(
        (tagObj, i) => `
          <span class="tag ${tagObj.locked ? "locked" : ""}">
            ${tagObj.name}
            <select class="weight-select" data-idx="${i}" ${
          tagObj.locked ? "disabled" : ""
        }>
  <option value="1" ${
    tagObj.weight === 1 ? "selected" : ""
  }>1 - Relevant</option>
  <option value="2" ${
    tagObj.weight === 2 ? "selected" : ""
  }>2 - Important</option>
  ${
    tagObj.locked
      ? `<option value="3" ${
          tagObj.weight === 3 ? "selected" : ""
        }>3 - Super Important</option>`
      : ""
  }
</select>

          </span>`
      )
      .join(" ");

    // Removal only for non-locked tags
    container.querySelectorAll(".remove-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        if (!tagsArray[idx].locked) {
          tagsArray.splice(idx, 1);
          updateTagsDisplay(containerId, tagsArray);
        }
      });
    });

    // Handle weight changes (skip locked)
    container.querySelectorAll(".weight-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const idx = parseInt(sel.getAttribute("data-idx"));
        if (!tagsArray[idx].locked) {
          tagsArray[idx].weight = parseInt(e.target.value);
        }
      });
    });
  };

  const initTagSection = (containerId, tagsArray, onUpdate) => {
    const container = document.getElementById(containerId);

    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("tag-btn")) {
        const tagName = e.target.textContent.trim();
        const existingIdx = tagsArray.findIndex((t) => t.name === tagName);

        if (existingIdx !== -1) {
          tagsArray.splice(existingIdx, 1);
          e.target.classList.remove("selected");
        } else {
          tagsArray.push({ name: tagName, weight: 1 }); // default weight
          e.target.classList.add("selected");
        }

        onUpdate();
      }
    });

    document
      .getElementById(containerId + "-add-btn")
      ?.addEventListener("click", () => {
        const input = document.getElementById(containerId + "-new-tag");
        const newTag = input.value.trim();
        if (newTag && !tagsArray.some((t) => t.name === newTag)) {
          tagsArray.push({ name: newTag, weight: 1 });
          input.value = "";
          onUpdate();
        }
      });
  };

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  const tagFiles = [
    //"tags/advice-types.html",
    //"tags/stakeholders.html",
    "tags/ethical-values.html",
    "tags/interaction-category.html",
  ];

  ["tags-container", "auto-tags-container"].forEach((containerId) => {
    const container = document.getElementById(containerId);
    const isAuto = containerId === "auto-tags-container";
    const tagsArray = isAuto ? autoSelectedTags : selectedTags;
    const displayId = isAuto ? "auto-selected-tags" : "selected-tags";

    Promise.all(
      tagFiles.map((file) => fetch(file).then((res) => res.text()))
    ).then((contents) => {
      // Join all tag file contents
      let allTagsHtml = contents.join("\n");

      // Remove locked tags from the list of selectable buttons
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = allTagsHtml;

      const lockedNames = tagsArray.filter((t) => t.locked).map((t) => t.name);
      tempDiv.querySelectorAll(".tag-btn").forEach((btn) => {
        if (lockedNames.includes(btn.textContent.trim())) {
          btn.remove();
        }
      });

      // Insert the filtered HTML into the container
      container.innerHTML = tempDiv.innerHTML;

      // Add custom tag input
      const customTagHtml = `
          <div class="custom-tag">
            <input type="text" id="${containerId}-new-tag" placeholder="Add custom tag" />
            <button type="button" id="${containerId}-add-btn">+</button>
          </div>`;
      container.insertAdjacentHTML("beforeend", customTagHtml);

      // Initialize click handlers
      initTagSection(containerId, tagsArray, () =>
        updateTagsDisplay(displayId, tagsArray)
      );
    });
  });

  document.getElementById("manual-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const context = document.getElementById("context").value.trim();
    if (!name || !context) return;

    window.narratives.push({ name, context, tags: [...selectedTags] });
    saveToLocalStorage();
    renderNarratives();
    e.target.reset();

    selectedTags.length = 0;
    updateTagsDisplay("selected-tags", selectedTags);

    document
      .querySelectorAll("#tags-container .tag-btn.selected")
      .forEach((btn) => btn.classList.remove("selected"));
  });

  document.getElementById("process-btn").addEventListener("click", () => {
    const txtFile = document.getElementById("file-input-txt").files[0];
    const jsonFile = document.getElementById("file-input-json").files[0];

    if (!txtFile || !jsonFile) {
      alert("Please upload both a .txt and a .json file");
      return;
    }

    // Read both files
    Promise.all([txtFile.text(), jsonFile.text()]).then(
      ([txtContent, jsonContent]) => {
        try {
          currentFileContent = txtContent;
          currentFileName = txtFile.name.replace(/\.[^/.]+$/, "");

          let narrativeId = "N/A";
          const idMatch = txtContent.match(/Narrative ID:\s*(.+)/);
          if (idMatch && idMatch[1]) narrativeId = idMatch[1].trim();

          let coreConcern = "";
          const concernMatch = txtContent.match(
            /Core Concern\s*\n([\s\S]+?)\n\nContext/
          );
          if (concernMatch && concernMatch[1])
            coreConcern = concernMatch[1].trim();

          document.getElementById("file-content-display").textContent =
            txtContent;
          document.getElementById("auto-name").value =
            narrativeId !== "N/A" ? narrativeId : currentFileName;
          document.getElementById("auto-context").value = coreConcern;

          // Parse JSON values → locked tags
          const parsedJson = JSON.parse(jsonContent);
          autoSelectedTags.length = 0; // reset
          if (parsedJson.values && Array.isArray(parsedJson.values)) {
            parsedJson.values.forEach((v) => {
              autoSelectedTags.push({
                name: v.value,
                weight: importanceToWeight(v.importance),
                locked: true,
              });
            });
          }

          // Update selected tags display
          updateTagsDisplay("auto-selected-tags", autoSelectedTags);

          // ✅ Remove locked tags from selectable buttons
          const container = document.getElementById("auto-tags-container");
          const lockedNames = autoSelectedTags.map((t) => t.name);
          container.querySelectorAll(".tag-btn").forEach((btn) => {
            if (lockedNames.includes(btn.textContent.trim())) {
              btn.remove();
            }
          });

          // Show the automated form
          document.getElementById("automated-form-container").style.display =
            "block";
        } catch (err) {
          console.error("Error processing files:", err);
        }
      }
    );
  });

  document.getElementById("automated-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("auto-name").value.trim();
    const context = document.getElementById("auto-context").value.trim();

    window.narratives.push({
      name,
      context,
      tags: [...autoSelectedTags],
      rawText: currentFileContent,
    });

    saveToLocalStorage();
    renderNarratives();
    e.target.reset();

    autoSelectedTags.length = 0;
    updateTagsDisplay("auto-selected-tags", autoSelectedTags);

    document
      .querySelectorAll("#auto-tags-container .tag-btn.selected")
      .forEach((btn) => btn.classList.remove("selected"));

    document.getElementById("automated-form-container").style.display = "none";
  });

  document.getElementById("cancel-btn").addEventListener("click", () => {
    document.getElementById("automated-form").reset();
    document.getElementById("automated-form-container").style.display = "none";
  });

  document.getElementById("export-json-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(window.narratives, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "efa-narratives.json";
    link.click();
  });

  const renderNarratives = () => {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";
    window.narratives.forEach((narrative, idx) => {
      const row = document.createElement("tr");
      const tagsFormatted = narrative.tags
        .map((t) => `${t.name} (${t.weight})`)
        .join(", ");
      row.innerHTML = `
          <td>${narrative.name}</td>
          <td>${narrative.context}</td>
          <td>${tagsFormatted}</td>
          <td><button class="btn remove-btn" data-idx="${idx}">Remove</button></td>
        `;
      tbody.appendChild(row);
    });
  };

  document.getElementById("table-body").addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const idx = e.target.getAttribute("data-idx");
      window.narratives.splice(idx, 1);
      saveToLocalStorage();
      renderNarratives();
    }
  });

  const saveToLocalStorage = () => {
    localStorage.setItem("efa-narratives", JSON.stringify(window.narratives));
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem("efa-narratives");
    if (stored) {
      window.narratives = JSON.parse(stored);
      renderNarratives();
    }
  };

  const importanceToWeight = (importance) => {
    if (!importance) return 1;
    if (importance.toLowerCase().includes("super")) return 3;
    if (importance.toLowerCase().includes("important")) return 2;
    return 1;
  };

  loadFromLocalStorage();
});
