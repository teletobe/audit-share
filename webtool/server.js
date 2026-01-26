const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.json());

app.post("/save", (req, res) => {
  const boardData = req.body;

  // Get the sourceBoardID from the JSON payload
  let sourceBoardId = boardData.sourceBoardID || "unknown";

  // Make sure it’s safe for filenames
  sourceBoardId = sourceBoardId.replace(/[^a-z0-9-_]/gi, "_");

  // Add a random number for uniqueness
  const random = Math.floor(Math.random() * 10000);

  const filename = `${sourceBoardId}-${random}.json`;

  fs.writeFileSync(
    path.join(__dirname, filename),
    JSON.stringify(boardData, null, 2)
  );

  res.json({ message: "Board saved", file: filename });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
