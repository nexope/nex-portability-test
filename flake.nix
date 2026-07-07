{
  description = "NEX-Portability Test: reproducible Node.js service portability proof";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (system:
        let pkgs = import nixpkgs { inherit system; };
        in {
          default = pkgs.stdenvNoCC.mkDerivation {
            pname = "nex-portability-test";
            version = "0.1.0";
            src = ./.;
            nativeBuildInputs = [ pkgs.makeWrapper ];
            installPhase = ''
              runHook preInstall
              mkdir -p $out/lib/nex-portability-test $out/bin
              cp -r src nix flake.nix package.json $out/lib/nex-portability-test/
              makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/npt \
                --add-flags "$out/lib/nex-portability-test/src/cli.js"
              runHook postInstall
            '';
          };
        });

      checks = forAllSystems (system:
        let pkgs = import nixpkgs { inherit system; };
        in {
          node-tests = pkgs.runCommand "nex-portability-test-check" {
            nativeBuildInputs = [ pkgs.nodejs_22 ];
          } ''
            cp -r ${self} source
            chmod -R +w source
            cd source
            node --test
            touch $out
          '';
        });

      apps = forAllSystems (system: {
        default = {
          type = "app";
          program = "${self.packages.${system}.default}/bin/npt";
        };
      });

      nixosModules.default = { pkgs, ... }: {
        imports = [ ./nix/module.nix ];
        services.nex-portability-test.package = self.packages.${pkgs.system}.default;
      };
    };
}
