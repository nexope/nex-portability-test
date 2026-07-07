# Local verification report

Date: 2026-07-07  
Environment: Windows, Node.js v24.16.0  
Command set: `npm.cmd test`, `npm.cmd run verify`, `node src\cli.js receipt evidence\portability.receipt.json`

## Results

- Automated tests: 7
- Passed: 7
- Failed: 0
- Deterministic export: passed
- Clean-directory export/import round trip: passed
- Schema validation: passed
- Unknown-field rejection: passed
- HTTP reference-service test: passed
- Portability receipt generation: passed and written to `evidence/portability.receipt.json`
- Public GitHub Actions workflow: passed for Node.js tests and `nix flake check` on Linux

Verified portable-state SHA-256 for the empty reference state:

`d561fe356c159d549704fd1f250dd85356a671ab5382464824dc78b6452aaaa7`

## Not yet verified

- `nix flake lock`
- committed `flake.lock`
- NixOS module boot in a virtual machine
- transfer between two independent NixOS instances

These remaining items must not be described as completed in a grant application until evidence is available.
