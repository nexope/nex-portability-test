{ config, lib, pkgs, ... }:
let
  cfg = config.services.nex-portability-test;
in
{
  options.services.nex-portability-test = {
    enable = lib.mkEnableOption "NEX-Portability Test reference service";
    package = lib.mkOption {
      type = lib.types.package;
      description = "NEX-Portability Test package to execute.";
    };
    port = lib.mkOption {
      type = lib.types.port;
      default = 8080;
      description = "Loopback HTTP port.";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.services.nex-portability-test = {
      description = "NEX-Portability Test reference service";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      environment = {
        NPT_DATA_DIR = "/var/lib/nex-portability-test";
        PORT = toString cfg.port;
      };
      serviceConfig = {
        DynamicUser = true;
        StateDirectory = "nex-portability-test";
        ExecStart = "${cfg.package}/bin/npt serve";
        Restart = "on-failure";
        NoNewPrivileges = true;
        PrivateTmp = true;
        ProtectHome = true;
        ProtectSystem = "strict";
      };
    };
  };
}
