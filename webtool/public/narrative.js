const apiKeyInput = document.getElementById("apiKeyInput");
const jsonFileInput = document.getElementById("jsonFileInput");
const jsonDisplay = document.getElementById("jsonDisplay");
const turnNarrativeBtn = document.getElementById("turnNarrativeBtn");
const generatedNarrative = document.getElementById("generatedNarrative");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadTxtBtn = document.getElementById("downloadTxtBtn");

let loadedJson = null;
let latestMarkdownContent = "";

// Enable the "Turn Into Narrative" button only when key & JSON are present
function updateButtonState() {
  turnNarrativeBtn.disabled = !(
    apiKeyInput.value.trim() && loadedJson !== null
  );
}

jsonFileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    loadedJson = null;
    jsonDisplay.textContent = "No file loaded yet.";
    updateButtonState();
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      loadedJson = JSON.parse(e.target.result);
      jsonDisplay.textContent = JSON.stringify(loadedJson, null, 2);
    } catch {
      loadedJson = null;
      jsonDisplay.textContent = "Error parsing JSON!";
    }
    updateButtonState();
  };
  reader.readAsText(file);
});

apiKeyInput.addEventListener("input", updateButtonState);

turnNarrativeBtn.addEventListener("click", async () => {
  if (!loadedJson || !apiKeyInput.value.trim()) {
    alert("Load a JSON file and enter your API key.");
    return;
  }

  generatedNarrative.innerHTML = "Generating narrative...";
  generatedNarrative.style.display = "block"; // Ensure it's visible
  downloadPdfBtn.disabled = true;
  downloadTxtBtn.disabled = true;

  try {
    const templateResponse = await fetch("narrative-template.txt");
    const narrativeTemplate = await templateResponse.text();

    const prompt = `Below is a JSON that serves as raw data which was captured by participants. This data is unprocessed and needs to be transformed into a 1-pager 'Narrative' which will represent it. Its purpose is to be read through easily to get an understanding of the data without having to look at the raw data.\n
Create a clear, structured narrative summary based ONLY on the JSON and following the narrative-template provide.\n
Important:\n
- process the data to capture important aspects of it at the right places\n
- the participant numbers are not important any more, don't use them - only what they said in the datas content is important\n
- use full sentences that can be read through\n
- capture all of the data in the final narrative\n
- follow the template strictly, from the title all the way to the metadata\n
- Don't invent anything on top of it! No names or fictional scenarios!\n
Follow the format of the template-narrative. If there is no data (e.g. for explanations) leave this out.\n
Structure it all in paragraphs that are clear to read through and don't use lists unless necessary.
\n\nData:\n${JSON.stringify(loadedJson, null, 2)}
\n\nNarrative Template:\n${narrativeTemplate}`;

    const response = await fetch(
      `http://localhost:8080/https://aqueduct.ai.datalab.tuwien.ac.at/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeyInput.value.trim()}`,
        },
        body: JSON.stringify({
          model: "openai/TechxGenus/Mistral-Large-Instruct-2411-AWQ",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    latestMarkdownContent =
      data.choices?.[0]?.message?.content || "No content returned.";

    // Convert Markdown to HTML for display
    const htmlContent = marked.parse(latestMarkdownContent);
    generatedNarrative.innerHTML = htmlContent;
    generatedNarrative.style.display = "block"; // Ensure it's visible

    // Enable download buttons
    downloadPdfBtn.disabled = false;
    downloadTxtBtn.disabled = false;
  } catch (err) {
    generatedNarrative.textContent =
      "Error generating narrative: " + err.message;
    generatedNarrative.style.display = "block"; // Ensure it's visible
    downloadPdfBtn.disabled = true;
    downloadTxtBtn.disabled = true;
  }
});

downloadTxtBtn.addEventListener("click", () => {
  if (!latestMarkdownContent) {
    alert("No narrative generated yet!");
    return;
  }

  const blob = new Blob([latestMarkdownContent], { type: "text/plain" });
  const link = document.createElement("a");

  const randomNumber = Math.floor(Math.random() * 1000000);
  link.download = `narrative-${randomNumber}.txt`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

downloadPdfBtn.addEventListener("click", () => {
  if (!latestMarkdownContent) {
    alert("No narrative generated yet!");
    return;
  }

  // Create a clean container for rendering
  const element = document.createElement("div");
  element.innerHTML = marked.parse(latestMarkdownContent);

  // Style it for PDF layout
  element.style.maxWidth = "800px";
  element.style.margin = "0 auto";
  element.style.padding = "40px";
  element.style.backgroundColor = "white";
  element.style.color = "black";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.lineHeight = "1.6";
  element.style.fontSize = "12pt";

  const opt = {
    margin: 1,
    filename: "narrative.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(element).save();
});
