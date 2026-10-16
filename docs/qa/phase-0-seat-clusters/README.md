# Phase 0 Seat Cluster QA

Visual QA screenshot capture was attempted for the requested viewport/table-size
matrix, but local Chrome headless failed before rendering because the Windows GPU
process was unusable. No screenshots were produced in this environment.

Manual review URLs:

- 1440 6-max:
  `http://127.0.0.1:5173/?route=tournaments&tab=replayer&previewSeats=6`
- 1440 8-max:
  `http://127.0.0.1:5173/?route=tournaments&tab=replayer&previewSeats=8`
- 1440 9-max:
  `http://127.0.0.1:5173/?route=tournaments&tab=replayer&previewSeats=9`
- 1024 8-max:
  `http://127.0.0.1:5173/?route=tournaments&tab=replayer&previewSeats=8`
- 390 8-max:
  `http://127.0.0.1:5173/?route=tournaments&tab=replayer&previewSeats=8`
- 390 9-max:
  `http://127.0.0.1:5173/?route=tournaments&tab=replayer&previewSeats=9`

Screenshot commands attempted with Chrome headless included software-rendering and
single-process fallbacks. Both failed before image output with GPU process errors.
