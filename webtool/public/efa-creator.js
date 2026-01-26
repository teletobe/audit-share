let jsonData = [];

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

  const reflexiveQuestions = [
    "What position or worldview is reflected in this narrative?",
    "Which groups might benefit or be harmed if this concern shapes the system?",
    "Does the perspective reinforce or challenge existing inequalities?",
    "Are any assumptions being made about identities, roles, or social norms?",
  ];

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
        if (!Array.isArray(jsonData)) {
          throw new Error("JSON must be an array.");
        }

        tbody.innerHTML = "";

        jsonData.forEach((narrative, index) => {
          const row = createTableRow(narrative, index);
          tbody.appendChild(row);
        });

        table.style.display = "table";
        efaBtnContainer.style.display = "flex";
      } catch (err) {
        alert("Error parsing JSON: " + err.message);
      }
    };

    reader.readAsText(file);
  });

  efaBtn.addEventListener("click", async () => {
    const checkboxes = document.querySelectorAll(".select-narrative:checked");
    const selectedIndexes = Array.from(checkboxes).map((cb) =>
      parseInt(cb.dataset.index)
    );
    const selectedNarratives = selectedIndexes.map((index) => jsonData[index]);

    if (selectedNarratives.length === 0) {
      alert("Please select at least one narrative.");
      return;
    }

    modal.style.display = "block";
    modalOverlay.style.display = "block";

    modalForm.dataset.selectedIndexes = JSON.stringify(selectedIndexes);

    selectedNarrativesContainer.innerHTML =
      '<div class="loading">Loading narrative content...</div>';

    try {
      const narrativeContents = await Promise.all(
        selectedNarratives.map(async (narrative) => {
          try {
            const response = await fetch(`narratives/${narrative.name}.txt`);
            if (!response.ok) {
              throw new Error(`File not found: ${narrative.name}.txt`);
            }
            return await response.text();
          } catch (error) {
            console.error(error);
            return `Error loading narrative content: ${
              error.message
            }\n\nJSON Context: ${narrative.context || "No context"}`;
          }
        })
      );

      selectedNarrativesContainer.innerHTML = selectedNarratives
        .map((n, i) => {
          const promptsHtml = reflexiveQuestions
            .map((q) => `<li>${q}</li>`)
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
      console.error("Error loading narratives:", error);
      selectedNarrativesContainer.innerHTML = `<div class="error">Error loading narrative content: ${error.message}</div>`;
    }
  });

  modalCloseBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  function closeModal() {
    modal.style.display = "none";
    modalOverlay.style.display = "none";
  }

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
      <label>Description:<input type="text" name="criteria-description" required></label>
      <label>How to test:<input type="text" name="criteria-method" required></label>
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

  modalForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const coreValues = Array.from(
      modalForm.querySelectorAll("input[name='efa-core-values']:checked")
    ).map((el) => el.value);

    const criteriaEntries = Array.from(
      criteriaList.querySelectorAll(".criteria-entry")
    );
    const testableCriteria = criteriaEntries.map((entry) => {
      return {
        type: entry.querySelector("select[name='requirement-type']").value,
        description: entry.querySelector("input[name='criteria-description']")
          .value,
        method: entry.querySelector("input[name='criteria-method']").value,
        status: entry.querySelector("select[name='criteria-status']").value,
      };
    });

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
    alert(
      "EFA created successfully (check console for JSON).\n" +
        JSON.stringify(efa, null, 2)
    );
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

    // --- NEW: Reset form and modal content ---
    modalForm.reset();
    criteriaList.innerHTML = "";
    selectedNarrativesContainer.innerHTML = "";
    const checkedValues = coreValuesContainer.querySelectorAll(
      "input[name='efa-core-values']"
    );
    checkedValues.forEach((cb) => (cb.checked = false));
    closeModal();
  });
});

function createTableRow(narrative, index) {
  const row = document.createElement("tr");

  const selectCell = document.createElement("td");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("select-narrative");
  checkbox.dataset.index = index;
  selectCell.classList.add("select-cell");
  selectCell.appendChild(checkbox);
  row.appendChild(selectCell);

  const nameCell = document.createElement("td");
  nameCell.textContent = narrative.name || "—";
  row.appendChild(nameCell);

  const contextCell = document.createElement("td");
  contextCell.textContent = narrative.context || "—";
  row.appendChild(contextCell);

  const tagsCell = document.createElement("td");
  tagsCell.textContent = Array.isArray(narrative.tags)
    ? narrative.tags.join(", ")
    : "—";
  row.appendChild(tagsCell);

  return row;
}

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
  "Support/Solidarity",
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
  label.appendChild(document.createTextNode(` ${value}`));

  coreValuesContainer.appendChild(label);
});
