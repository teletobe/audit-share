const startBtn = document.getElementById("startBtn");
const formContainer = document.getElementById("formContainer");
const previewContainer = document.getElementById("previewContainer");
const boardForm = document.getElementById("boardForm");
const preview = document.getElementById("preview");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

const addValueBtn = document.getElementById("addValueBtn");
const valuesContainer = document.getElementById("valuesContainer");

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

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  loadBoardBtn.style.display = "none"; // hide load board button
  formContainer.style.display = "block";
  addValue();
});

// Create a new value block
function addValue() {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

  const div = document.createElement("div");
  div.className = "value-block";

  const optionsHtml = valueOptions
    .map((v) => `<option value="${v}">${v}</option>`)
    .join("");

  div.innerHTML = `
    <label>Participant Number:
      <input type="number" name="value_${uniqueId}_participantNumber" min="1" required>
    </label><br/>

    <label>Value:
      <select name="value_${uniqueId}_value_select" required>
        <option value="">-- Select a Value --</option>
        ${optionsHtml}
        <option value="__custom">Other (Specify Below)</option>
      </select>
    </label><br/>

    <label>If Other, Specify:
      <input type="text" name="value_${uniqueId}_value_custom" placeholder="Custom value" disabled>
    </label><br/>

    <label>Reason:
      <input type="text" name="value_${uniqueId}_reason">
    </label><br/>

    <label>Category:
      <select name="value_${uniqueId}_category">
        <option value="Promote">Promote</option>
        <option value="Hinder">Hinder</option>
        <option value="Unclear">Unclear</option>
      </select>
    </label><br/>

    <label>Importance:
      <select name="value_${uniqueId}_importance">
        <option value="Important">Important</option>
        <option value="Super Important">Super Important</option>
      </select>
    </label><br/>

    <button type="button" class="removeBtn">Remove</button>
    <hr/>
  `;

  // Enable/disable custom input
  const select = div.querySelector(
    `select[name="value_${uniqueId}_value_select"]`
  );
  const customInput = div.querySelector(
    `input[name="value_${uniqueId}_value_custom"]`
  );

  select.addEventListener("change", () => {
    if (select.value === "__custom") {
      customInput.disabled = false;
      customInput.required = true;
    } else {
      customInput.disabled = true;
      customInput.required = false;
      customInput.value = "";
    }
  });

  // Remove block
  div.querySelector(".removeBtn").addEventListener("click", () => {
    div.remove();
  });

  valuesContainer.appendChild(div);
}

addValueBtn.addEventListener("click", addValue);

boardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(boardForm);
  const data = {};

  // Add normal non-array fields
  formData.forEach((value, key) => {
    if (!key.startsWith("value_")) {
      data[key] = value;
    }
  });

  // Add values
  data.values = [];
  document.querySelectorAll(".value-block").forEach((block) => {
    const participantNumber = block.querySelector(
      'input[name$="_participantNumber"]'
    ).value;

    const selectedValue = block.querySelector(
      'select[name$="_value_select"]'
    ).value;

    const customValue = block
      .querySelector('input[name$="_value_custom"]')
      .value.trim();

    const value =
      selectedValue === "__custom" && customValue ? customValue : selectedValue;

    const reason = block.querySelector('input[name$="_reason"]').value;

    const category = block.querySelector('select[name$="_category"]').value;

    const importance = block.querySelector('select[name$="_importance"]').value;

    data.values.push({
      participantNumber,
      value,
      reason,
      category,
      importance,
    });
  });

  preview.textContent = JSON.stringify(data, null, 2);
  formContainer.style.display = "none";
  previewContainer.style.display = "block";
});

editBtn.addEventListener("click", () => {
  previewContainer.style.display = "none";
  formContainer.style.display = "block";
});

saveBtn.addEventListener("click", async () => {
  const jsonData = JSON.parse(preview.textContent);
  const response = await fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonData),
  });
  const result = await response.json();
  alert(`Saved as ${result.file}`);
  location.reload();
});

// BOARD FUNCTIONALITY
//******************** */
const loadBoardBtn = document.getElementById("loadBoardBtn");
const jsonFileUpload = document.getElementById("jsonFileUpload");
const boardContainer = document.getElementById("boardContainer");
const board = document.getElementById("board");

// Setup board container
board.style.backgroundImage = "url('board.png')";
board.style.width = "1000px";
board.style.height = "700px";
board.style.position = "relative";
board.style.backgroundSize = "cover";
board.style.margin = "0 auto"; // Center the board

// Event listeners for new functionality
loadBoardBtn.addEventListener("click", () => {
  jsonFileUpload.click();
  startBtn.style.display = "none"; // hide start button
  loadBoardBtn.style.display = "none";
});

jsonFileUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const boardData = JSON.parse(e.target.result);
      displayBoardData(boardData);
      boardContainer.style.display = "block";
    } catch (error) {
      alert("Invalid JSON file: " + error.message);
    }
  };
  reader.readAsText(file);
});

function displayBoardData(data) {
  // Clear previous board content
  board.innerHTML = "";

  // Create elements based on JSON data
  if (data.values) {
    // Only take first 4 values
    const valuesToDisplay = data.values.slice(0, 4);
    valuesToDisplay.forEach((value, index) => {
      createValueElement(value, index);
    });
  }

  // Add story elements
  if (data.iWant) {
    createBoardElement(`${data.iWant}`, "story", 44, 13);
  }
  if (data.soThat) {
    createBoardElement(`${data.soThat}`, "story", 59, 13);
  }
  if (data.because) {
    createBoardElement(`${data.because}`, "story", 75, 13);
  }

  // Add criteria elements
  if (data.desirable) {
    createBoardElement(`${data.desirable}`, "criteria", 44, 36.5);
  }
  if (data.acceptable) {
    createBoardElement(`${data.acceptable}`, "criteria", 60, 36.5);
  }
  if (data.dealBreakers) {
    createBoardElement(`${data.dealBreakers}`, "criteria", 75, 36.5);
  }
  // Add comment if it exists
  if (data.comment) {
    createCommentElement(data.comment);
  }
}

function createBoardElement(text, type, topPercent, leftPercent) {
  const element = document.createElement("div");
  element.className = `board-element ${type}-element`;

  // Create a content container for scrollable content
  const content = document.createElement("div");
  content.className = "element-content";
  content.textContent = text;
  element.appendChild(content);

  // Position based on percentages
  element.style.top = `${topPercent}%`;
  element.style.left = `${leftPercent}%`;
  element.style.transform = "translate(-50%, -50%)";

  // Set fixed dimensions
  switch (type) {
    case "story":
      element.style.width = "218px"; // Fixed width
      element.style.height = "95px"; // Fixed height
      break;
    case "criteria":
      element.style.width = "218px"; // Fixed width
      element.style.height = "80px"; // Fixed height
      break;
  }

  // Add type-specific styling
  switch (type) {
    case "value":
      element.style.backgroundColor = "rgba(254, 211, 142, 0.8)";
      break;
    case "story":
      element.style.backgroundColor = "rgba(189, 170, 228, 0.82)";
      break;
    case "criteria":
      element.style.backgroundColor = "rgba(0, 0, 0, 0)";
      break;
  }

  board.appendChild(element);
}

function createValueElement(value, index) {
  // Create value box (just the value name)
  const valueBox = document.createElement("div");
  valueBox.className = "board-element value-element";

  // Create content container for value
  const valueContent = document.createElement("div");
  valueContent.className = "element-content";
  valueContent.textContent = value.value;
  valueBox.appendChild(valueContent);

  // Position value box on right side
  const xPos = 88;
  let yPos = 10 + index * 9;

  // Adjust position based on importance and category
  let xAdjust = 0;
  if (value.importance === "Super Important") {
    xAdjust = -26;
  }

  if (value.category === "hinder") {
    yPos += 50;
  }

  valueBox.style.top = `${yPos}%`;
  valueBox.style.left = `${xPos + xAdjust}%`;
  valueBox.style.transform = "translate(-50%, -50%)";
  valueBox.style.width = "150px";
  valueBox.style.height = "55px";
  board.appendChild(valueBox);

  // Create separate box for value + reason (top-left corner)
  const reasonBox = document.createElement("div");
  reasonBox.className = "board-element value-reason";

  // Create content container for value reason
  const reasonContent = document.createElement("div");
  reasonContent.className = "element-content";
  reasonContent.textContent = `${value.value}: ${
    value.explanation || "No reason provided"
  }`;
  reasonBox.appendChild(reasonContent);

  // Position in top-left grid - bottom two raised 5%
  let gridX = (index % 2) * 20;
  let gridY = Math.floor(index / 2) * 20;

  if (index >= 2) {
    gridY -= 5;
  }
  if (index % 2) {
    gridX += 4;
  }

  reasonBox.style.top = `${6 + gridY}%`;
  reasonBox.style.left = `${2 + gridX}%`;
  reasonBox.style.width = "210px";
  reasonBox.style.height = "90px";
  board.appendChild(reasonBox);
}

// NEW FUNCTION TO HANDLE COMMENTS
function createCommentElement(commentText) {
  const commentBox = document.createElement("div");
  commentBox.className = "board-element comment-element";

  // Create content container for comment
  const content = document.createElement("div");
  content.className = "element-content";
  content.textContent = `Comment: ${commentText}`;
  commentBox.appendChild(content);

  // Position at bottom center
  commentBox.style.top = "93%";
  commentBox.style.left = "24%";
  commentBox.style.transform = "translate(-50%, -50%)";

  // Set fixed dimensions
  commentBox.style.width = "400px";
  commentBox.style.height = "65px";

  // Add styling
  commentBox.style.backgroundColor = "rgba(197, 215, 255, 0.42)";
  commentBox.style.fontStyle = "italic";

  board.appendChild(commentBox);
}
