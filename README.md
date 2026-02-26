# Master Thesis for Lowering the Threshold for Embedded AI Ethics

## Designing Self-Assessment Tools for Stakeholder-Identified Ethical Concerns

### Abstract:

Unethical technology, such as systems that discriminate, exploit, cause harm, or violate
privacy, often arise from developers' struggles to define, assess and implement ethics
during development. The increasing pace of technological advancement, the ubiquitous
deployment of AI, and the complexity of shareholder considerations add to this challenge.
This thesis seeks to investigate key questions about ethical technology audits: what are
the relevant values and ethical concerns involved? And how can these be translated into
a testable environment? In particular, it explores the role of stakeholders in identifying
relevant values and creates tools that assist in translating them into the auditable artefacts
of Ethical Focus Areas (EFAs). The resulting workflow are the Ethics Self-Assessment
Tools (ESAT).
A mixed-methods approach is employed throughout the thesis to critically analyse the
problem, current approaches and their gaps, and to develop a participatory workflow for
eliciting values and concerns. Through trial workshops, a streamlined and approachable
method that generates ethical concerns as data is established. Additionally, a straight-
forward webtool to process and translate this data into testable artefacts is developed,
making the ethics assessment more accessible to non-ethical-expert developers. Context-
sensitive applications, such as LLM-based advice chatbots, are the focus of this thesis.
However, the transferability to other systems is also discussed.
The results indicate that by rooting the concerns directly in stakeholders' desires and
expectations, the ESAT workflow builds towards a comprehensive toolkit that integrates
auditing procedures early on in an AI's development cycle, enabling a continuous, context-
sensitive, and adaptable assessment of a technology's ethical concerns.

## Webtool

The webtool is an interactive web-based application for digitising the data obtained in workshops to audit technologies on AI. It is located in the `webtool/` folder.

It is a prototype.

### Features

The webtool includes:

- Interactive narrative mapping interface
- Tag-based categorisation and ethical value assessment
- Data visualization through clustering analysis
- Board and workshop management
- EFA (Ethical Framework Assessment) creation and review

For detailed screenshots and demonstrations of the webtool interface, see **Chapter 5.4** in the thesis document.

### Technology Stack

The webtool is built with:

- Node.js with Express.js (server.js)
- HTML5, CSS, JavaScript
- **Data Processing**: some Python scripts for clustering and anonymization
- **Dependencies**:
  - Express.js (server framework)
  - JSON-based data management
  - CORS proxy for cross-origin requests (included)

### How to Run

#### Prerequisites

- Node.js and npm installed
- Python 3.x (for clustering and data processing features)

#### Installation & Startup

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

### Project Structure

```
webtool/
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

### Key Components

- **Narrative Mapping**: Input and analysis of narrative data from workshops
- **EFA (Ethical Framework Assessment)**: Tool for creating and managing ethical assessments
- **Tagging System**: Categorize narratives by ethical values, stakeholders, and interaction types
- **Clustering**: Python-based analysis for grouping similar narratives and identifying patterns
- **Report Generation**: Create comprehensive audit reports from collected data

### Data Management

- Board data is saved as JSON files with unique identifiers
- Sample data is provided in the `public/data/` directory
- Anonymized datasets can be generated using clustering tools
- All data is stored locally by default

### Additional Notes

For more information about the research methodology and findings, please refer to the thesis document. Screenshots and detailed walkthroughs of the webtool interface can be found in the thesis under **Section 5.4**.
