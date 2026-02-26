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

## Project Structure

```
.
├── README.md                 # This file
├── thesis_.pdf               # Main thesis document
├── informed-consent.pdf      # Informed consent forms
├── data-protection.pdf       # Data protection guidelines
├── activity-materials.pdf    # Activity materials
├── survey.pdf                # Survey materials
├── workflow-diagram1.png     # Project workflow diagram
├── workflow-diagram2.png     # Project workflow diagram
├── workshop-sample-slides.pdf # Workshop presentation slides
└── webtool/                  # Web-based auditing tool
    └── README.md             # Webtool specific documentation
```

## Webtool

The `webtool/` folder contains an interactive web-based application for digitising data from workshops to audit AI technologies. See [webtool/README.md](webtool/README.md) for detailed documentation on how to run and use the webtool.

## Additional Resources

- **Thesis Document**: See `thesis_.pdf` for the complete thesis
- **Chapter 5.4**: Contains detailed screenshots and demonstrations of the webtool interface
