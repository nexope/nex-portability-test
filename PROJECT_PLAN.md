# Project plan

## Purpose

NEX-Portability Test explores a narrow building block for Fediversity-style hosting: a self-hosted service should be able to export its declared state, restore it in a clean environment and produce a machine-readable receipt that binds the restored state to the deployment definition.

The current repository is a background proof-of-concept. It is intentionally small and generic so that future funded work can extend it without depending on any proprietary NEXOPE product, separate funding activity or domain-specific dataset.

## Current status

Implemented:

- dependency-free Node.js reference service;
- strict versioned state schema;
- deterministic JSON export;
- validated import and clean-directory round-trip verification;
- receipt generation with SHA-256 hashes of deployment files;
- automated Node.js tests;
- preliminary Nix flake and NixOS module;
- public GitHub Actions workflow for Node.js tests and `nix flake check`;
- local verification report.

Not yet claimed as completed:

- `nix flake lock`;
- committed `flake.lock`;
- NixOS virtual-machine boot test;
- state transfer between two independent NixOS instances;
- provider-independent portability profiles;
- upstream review or integration.

## Proposed future milestones

### Milestone 1 - Specification and threat model

Define portability assumptions, non-goals, state boundaries, failure cases and a minimal threat model for self-hosted service export and restore.

Deliverables:

- public specification document;
- state-boundary checklist;
- threat model and misuse cases;
- issue tracker labels and contribution workflow.

### Milestone 2 - NixOS packaging and reproducible service demo

Complete the Nix/NixOS packaging path and verify that the reference service can be built and run reproducibly on Linux.

Deliverables:

- committed `flake.lock`;
- passing `nix flake check`;
- documented NixOS module options;
- reproducible local service run instructions.

### Milestone 3 - Portability validation across clean instances

Demonstrate that state can be exported from one clean instance and restored into another clean instance with verifiable equivalence.

Deliverables:

- automated export/import/restore script;
- receipt schema validation;
- test evidence from two clean environments;
- documented failure cases.

### Milestone 4 - CI, security hardening and accessibility of evidence

Make the verification process easy for third parties to reproduce and inspect.

Deliverables:

- public CI results;
- negative tests for undeclared fields and malformed state;
- hardened service defaults;
- documented evidence format.

### Milestone 5 - Documentation and ecosystem feedback

Document the tool for developers and collect feedback from relevant NixOS, self-hosting and Fediversity-adjacent communities.

Deliverables:

- user documentation;
- developer documentation;
- comparison with related projects;
- release notes and public status update.

## Licensing

All repository contents are intended to be published under the MIT License unless a file explicitly states otherwise.
