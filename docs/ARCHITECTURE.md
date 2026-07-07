# Architecture

The proof separates four concerns:

1. `server.js` provides a deliberately small HTTP service with persistent state.
2. `core.js` owns the versioned state model, canonicalisation, validation and atomic writes.
3. `portability.js` performs a clean-directory restore and creates a deterministic evidence receipt.
4. `flake.nix` and `nix/module.nix` describe reproducible packaging and a hardened NixOS service.

The portable bundle contains only fields declared by its public JSON Schema. Unknown fields are rejected rather than silently copied, reducing the risk of exporting credentials added to internal state by mistake.

The verification currently proves application-level state round-trip equality. Future grant work would need to add provider-independent adapters, NixOS VM tests, failure injection, version migration, cryptographic signing, interoperability profiles and upstream integration. Those future tasks are not implemented or claimed by this Background proof.
