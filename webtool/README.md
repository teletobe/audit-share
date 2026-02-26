# Webtool - AI Ethics Auditing Application

An interactive web-based application for digitising the data obtained in workshops to audit technologies on AI. This is a prototype tool.

## Features

The webtool includes:

- Interactive narrative mapping interface
- Tag-based categorisation and ethical value assessment
- Data visualization through clustering analysis
- Board and workshop management
- EFA (Ethical Framework Assessment) creation and review

For detailed screenshots and demonstrations of the webtool interface, see **Chapter 5.4** in the thesis document.

## Technology Stack

The webtool is built with:

- **Backend**: Node.js with Express.js (server.js)
- **Frontend**: HTML5, CSS, JavaScript (vanilla)
- **Data Processing**: Python scripts for clustering and anonymization
- **Dependencies**:
  - Express.js (server framework)
  - JSON-based data management
  - CORS proxy for cross-origin requests (included)

## How to Run

### Prerequisites

- Node.js and npm installed
- Python 3.x (for clustering and data processing features)

### Installation & Startup

1. Navigate to the webtool directory:

   ```bash
   cd webtool
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the main server:

   ```bash
   npm start
   ```

   Or directly:

   ```bash
   node server.js
   ```

   The server will run on `http://localhost:3000`

4. In a separate terminal, start the CORS Anywhere proxy server (required for simulated backend requests):

   ```bash
   cd webtool/cors-anywhere
   npm install
   node server.js
   ```

   The CORS proxy will run on `http://localhost:8080`

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
webtool/
├── README.md                 # This file
├── server.js                 # Express server
├── package.json              # Node dependencies
├── narrative_mapping.json    # Narrative data mapping
├── tag_mapping.json          # Tag categorizations
├── public/                   # Frontend assets
│   ├── efa.html             # EFA creation interface
│   ├── narrative.html       # Narrative input interface
│   ├── tagging.html         # Tagging interface
│   ├── report.html          # Report generation
│   ├── efa.js, narrative.js, tagging.js, report.js
│   ├── style.css, efa-creator-style.css
│   ├── data/                # Sample data files
│   │   ├── boards/          # Workshop boards
│   │   ├── narratives/      # Text narratives
│   │   └── efas/            # EFA templates
│   └── connections/         # Data connection modules
├── clustering/              # Data analysis tools
│   ├── cluster.py          # Clustering analysis
│   ├── annonymise_data.py  # Data anonymization
│   └── visualise.py        # Data visualization
├── prompts/                 # AI prompt templates
│   ├── narrative_prompt.txt
│   └── tag_prompt.txt
└── cors-anywhere/          # CORS proxy service
```

## Key Components

- **Narrative Mapping**: Input and analysis of narrative data from workshops
- **EFA (Ethical Framework Assessment)**: Tool for creating and managing ethical assessments
- **Tagging System**: Categorize narratives by ethical values, stakeholders, and interaction types
- **Clustering**: Python-based analysis for grouping similar narratives and identifying patterns
- **Report Generation**: Create comprehensive audit reports from collected data

## Data Management

- Board data is saved as JSON files with unique identifiers
- Sample data is provided in the `public/data/` directory
- Anonymized datasets can be generated using clustering tools
- All data is stored locally by default

## Additional Notes

For more information about the research methodology and findings, please refer to the main thesis document. Screenshots and detailed walkthroughs of the webtool interface can be found in the thesis under **Section 5.4**.
