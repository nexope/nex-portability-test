# NEX-Portability Test

[![portability-proof](https://github.com/nexope/nex-portability-test/actions/workflows/ci.yml/badge.svg)](https://github.com/nexope/nex-portability-test/actions/workflows/ci.yml)

NEX-Portability Test is a small, dependency-free proof-of-concept for deterministic export, validation, restore and verification of a self-hosted Node.js service packaged for NixOS.

It demonstrates a narrow technical hypothesis for NGI Fediversity: a hosted service should be able to produce a portable state bundle and a machine-readable receipt showing that the bundle survives a clean restore without exporting undeclared fields.

## What is implemented

- loopback-only Node.js reference service;
- strict, versioned portable-state schema;
- deterministic canonical JSON export;
- validated import and clean-directory round trip;
- SHA-256 portability receipt binding state and deployment files;
- dependency-free automated tests;
- Nix flake package and hardened NixOS systemd module;
- Linux CI definitions for Node and `nix flake check`.

This is not yet a cross-provider conformance suite, a production backup system or proof that every Node.js service is portable.

## Run on Windows or Linux with Node.js 20+

```text
npm test
npm run verify
npm run receipt
npm start
```

By default, state is stored in `.data`. Override it with `NPT_DATA_DIR`.

Example API use after starting the service:

```text
curl http://127.0.0.1:8080/health
curl -X POST http://127.0.0.1:8080/api/records -H "content-type: application/json" -d '{"id":"demo","value":"portable"}'
node src/cli.js export portable-state.json
node src/cli.js verify
node src/cli.js receipt portability.receipt.json
```

## Run with Nix

On a Linux system with flakes enabled:

```text
nix flake lock
nix flake check
nix run . -- verify
nix build
```

The lock file must be generated and committed from a Nix-capable environment before this repository is presented as reproducibly pinned.

Example NixOS configuration:

```nix
{
  inputs.nex-portability-test.url = "path:/path/to/nex-portability-test";
  outputs = { self, nixpkgs, nex-portability-test, ... }: {
    nixosConfigurations.demo = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        nex-portability-test.nixosModules.default
        {
          services.nex-portability-test.enable = true;
          services.nex-portability-test.port = 8080;
        }
      ];
    };
  };
}
```

## Remaining validation before an application

1. Generate and commit `flake.lock` on Linux/NixOS before claiming the repository is reproducibly pinned.
2. Boot the NixOS module in a VM and execute export/restore across two clean instances.
3. Compare the proposed follow-up with existing NLnet projects and obtain upstream feedback.
4. Replace this reference-only scope with milestones that create genuinely new public value after any grant selection.

GitHub Actions currently verifies the Node.js test suite and `nix flake check` on Linux. This is useful public evidence, but it is not the same as a full NixOS virtual-machine deployment test.

See `PROJECT_PLAN.md` for the proposed technical roadmap.

## Licensing and provenance

The code is available under the MIT License. See `GENAI_PROVENANCE.md` and `BACKGROUND_AND_OVERLAP.md` before reusing this work in a proposal.
