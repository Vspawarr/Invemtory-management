# Krones Automation - Production

This repository contains a production-grade Python automation for processing 3D-Model requests from the Krones Partner Portal.

## Features & Architecture

* **Strict Idempotency:** Managed via `kc_production_state.json.lock`, ensuring failed artifacts or reruns *never* duplicate KC numbers or pollute production sequencing.
* **Package Validation:** Utilizes `pdfplumber` and `xml.etree` to strongly tie generic ZIP payloads to actual requested `EinkBeleg` and `Materialnummer` identifiers.
* **Dynamic Grouping:** Prevents static path bindings. Dynamically maps SAP WebDynpro `Erfassungsdatum` (Input Date) to Month-level Folders, Excel artifacts, and ZIP artifacts.
* **Playwright Asynchronous Layer:** Abstracts `#WD33` parsing and downloads inside robust asyncio routines.

## Installation

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## Running the Automation (Jupyter)

The most direct way to execute this pipeline is via the thin Notebook wrapper:

1. Launch Jupyter environment: `jupyter notebook`
2. Open `Krones_Automation_Production.ipynb`.
3. Run the cells.
4. An interactive Chromium window will appear. Complete any SSO or MFA on the portal. The bot will wait for you to navigate to the *Übersicht 3D-Modellanfragen* screen and then take over processing.

## Running Tests

The automation contains an exhaustive pytest suite running entirely without live SAP credentials (mocking HTML/Filesystem behavior).

```bash
pytest -v tests/
```

## Environment & Configuration

Refer to `config.py` (or duplicate it as `config.example.py` if overriding).
- `KRONES_OUTPUT_DIR`: Defaults to `./output`
- `KRONES_STATE_FILE`: Defaults to `./kc_production_state.json`

## Rerun / Idempotency Behavior

- If the script fails halfway through a download or ZIP extraction, rerunning it will **safely re-attempt**.
- If a request is successfully packaged, marked valid, and logged in Excel, a subsequent rerun **will recognize the state and skip redundant downloading**, while reusing the same assigned KC number.

## Live SAP Requirements

Since the development environment did not have access to live SAP Krones, the actual `sap_client.py` DOM abstraction hooks into standard Playwright navigation methods. The user should expect to maintain the `TABLE_ID` (`#WD33`) mapping in `config.py` if the UI changes.
