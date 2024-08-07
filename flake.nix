{
  inputs = {
    nixpkgs.follows = "holonix/nixpkgs";

    versions.url = "github:holochain/holochain/holochain-0.4.0-dev.12?dir=versions/weekly";
    holonix.url = "github:holochain/holochain/holochain-0.4.0-dev.12";
    holonix.inputs.versions.follows = "versions";
    holonix.inputs.holochain.url = "github:holochain/holochain/holochain-0.4.0-dev.12";
  };

  outputs = inputs@{ holonix, ... }:
    holonix.inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      # provide a dev shell for all systems that the holonix flake supports
      systems = builtins.attrNames holonix.devShells;

      perSystem = { config, system, pkgs, ... }:
        {
          devShells.default = pkgs.mkShell {
            inputsFrom = [ holonix.devShells.${system}.holochainBinaries ];
            packages = with pkgs; [
              # add further packages from nixpkgs
              # nodejs
              cargo-nextest
            ];
          };
        };
    };
}
