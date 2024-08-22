import fs from "fs/promises";
import { glob } from "glob";
import yaml from "yaml";
import prettier from "prettier";

const CRATES_DIR = "../../crates";
const integrity_regex = /^.+_integrity$/;

async function main() {
  const crates = await fs.readdir(CRATES_DIR);
  const classNames = await Promise.all(
    crates
      .filter((name) => integrity_regex.test(name))
      .map((name) => extractEntryEnumsForCrate(name))
  );

  classNames.filter((name) => !!name).sort();
  let indexContent = classNames
    .map((className) => `export * from "./${className}";\n`)
    .join("");

  const zomeIndices = await getZomeIndices();
  indexContent += `
    export enum IntegrityZomeIndex {
      ${zomeIndices.map((name, idx) => `${name} = ${idx}`).join(",\n")}
    }
    `;

  indexContent = await prettier.format(indexContent, { parser: "typescript" });
  fs.writeFile("./src/integrity-enums/index.ts", indexContent);
}

async function getZomeIndices() {
  const yamlContent = await fs.readFile("../../workdir/dna.yaml", "utf8");
  const dnaManifest = yaml.parse(yamlContent);
  return dnaManifest.integrity.zomes.map((zome) =>
    snakeToUpperCamel(zome.name)
  );
}

class EntryTypesEnumParser {
  state: "searching" | "enum-started" | "enum-ended" = "searching";
  defs: string[] = [];

  parseLine(line: string) {
    switch (this.state) {
      case "searching": {
        if (line === "pub enum EntryTypes {") {
          this.state = "enum-started";
        }
        return;
      }
      case "enum-started": {
        if (line === "}") {
          this.state = "enum-ended";
        } else {
          const match = line.match(/^\s+(\w+)\(\w+\),$/);
          if (!match) {
            console.error("Bad line:", line);
            throw new Error("Invalid EntryType variant");
          }
          this.defs.push(match[1]);
        }
        return;
      }
      case "enum-ended": {
        if (line === "pub enum EntryTypes {") {
          throw new Error("Repeat definition");
        }
        return;
      }
    }
  }
}

class LinkTypesEnumParser {
  state: "searching" | "enum-started" | "enum-ended" = "searching";
  defs: string[] = [];

  parseLine(line: string) {
    switch (this.state) {
      case "searching": {
        if (line === "pub enum LinkTypes {") {
          this.state = "enum-started";
        }
        return;
      }
      case "enum-started": {
        if (line === "}") {
          this.state = "enum-ended";
        } else {
          const match = line.match(/^\s+(\w+),$/);
          if (!match) {
            console.error("Bad line:", line);
            throw new Error("Invalid LinkType variant");
          }
          this.defs.push(match[1]);
        }
        return;
      }
      case "enum-ended": {
        if (line === "pub enum LinkTypes {") {
          throw new Error("Repeat definition");
        }
        return;
      }
    }
  }
}

async function extractEntryEnumsForCrate(name: string) {
  console.log("Start extracting entry enums for:", name);
  const rustFiles = await glob(`${CRATES_DIR}/${name}/src/**/*.rs`);
  let entryDefs: string[] | undefined;
  let linkDefs: string[] | undefined;
  await Promise.all(
    rustFiles.map(async (filePath) => {
      const lines = (await fs.readFile(filePath, "utf-8")).split("\n");
      const entryTypesParser = new EntryTypesEnumParser();
      const linkTypesParser = new LinkTypesEnumParser();
      for (const line of lines) {
        entryTypesParser.parseLine(line);
        linkTypesParser.parseLine(line);
      }
      if (entryTypesParser.state === "enum-ended") {
        if (entryDefs) {
          throw new Error("entry defs already parsed");
        }
        entryDefs = entryTypesParser.defs;
      }
      if (linkTypesParser.state === "enum-ended") {
        if (linkDefs) {
          throw new Error("link defs already parsed");
        }
        linkDefs = linkTypesParser.defs;
      }
    })
  );

  if (!entryDefs && !linkDefs) return;

  const zomeNameUpper = snakeToUpperCamel(name);
  let content = "";
  if (entryDefs?.length) {
    content += `
      export enum ${zomeNameUpper}EntryTypeIndex {
        ${entryDefs.map((def, idx) => `${def} = ${idx},`).join("\n")}
      }
      `;
  }
  if (linkDefs?.length) {
    content += `
      export enum ${zomeNameUpper}LinkTypeIndex {
        ${linkDefs.map((def, idx) => `${def} = ${idx},`).join("\n")}
      }
      `;
  }

  content = await prettier.format(content, { parser: "typescript" });
  await fs.writeFile(`./src/integrity-enums/${zomeNameUpper}.ts`, content);
  return zomeNameUpper;
}

const snakeToCamel = (str) =>
  str
    .toLowerCase()
    .replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );

const snakeToUpperCamel = (str) => {
  str = snakeToCamel(str);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

main().catch(console.error);
