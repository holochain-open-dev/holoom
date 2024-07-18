import fs from "fs/promises";

const BINDINGS_PATH = "../../crates/holoom_types/bindings/";
const HC_TYPES = ["AgentPubKey", "ActionHash", "Record", "Signature"];

async function main() {
  const files = await fs.readdir(BINDINGS_PATH);
  for (const file of files) {
    // Insert missing imports
    let content = await fs.readFile(BINDINGS_PATH + file, "utf8");
    const imports = HC_TYPES.filter((typeName) => content.includes(typeName));
    if (imports.length) {
      // Prepend imports
      const importLine = `import { ${imports.join(
        ", "
      )} } from "@holochain/client";\n`;
      content = importLine + content;
    }
    fs.writeFile(`./src/${file}`, content);
  }

  const indexContent = files
    .map((file) => `export * from "./${file.slice(0, -3)}";\n`)
    .join("");
  fs.writeFile("./src/index.ts", indexContent);
}

main();
