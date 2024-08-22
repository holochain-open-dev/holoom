import fs from "fs/promises";
import prettier from "prettier";
import { HOLOCHAIN_TYPES } from "./holochain-types";

const BINDINGS_PATH = "../../crates/holoom_types/bindings/";

async function main() {
  const files = await fs.readdir(BINDINGS_PATH);
  for (const file of files) {
    // Insert missing imports
    let content = await fs.readFile(BINDINGS_PATH + file, "utf8");
    const imports = HOLOCHAIN_TYPES.filter((typeName) =>
      content.includes(typeName)
    );
    if (imports.length) {
      // Prepend imports
      const importLine = `import { ${imports.join(
        ", "
      )} } from "@holochain/client";\n`;
      content = importLine + content;
    }
    content = await prettier.format(content, { parser: "typescript" });
    fs.writeFile(`./src/types/${file}`, content);
  }

  let indexContent = files
    .map((file) => `export * from "./${file.slice(0, -3)}";\n`)
    .join("");
  indexContent = await prettier.format(indexContent, { parser: "typescript" });
  fs.writeFile("./src/types/index.ts", indexContent);
}

main();
