import fs from "fs/promises";
import prettier from "prettier";

const HOLOCHAIN_TYPES = ["ActionHash", "AgentPubKey", "Record", "Signature"];

const DEPENDENCY_TYPES_PATH = "src/dependency-types.ts";
const TYPESHARE_GENERATED_PATH = "src/typeshare-generated.ts";

async function main() {
  const depTypesContent = await fs.readFile(DEPENDENCY_TYPES_PATH, "utf8");
  const depTypes = Array.from(
    depTypesContent.matchAll(/\nexport\s+\w+\s+(\w+)/g)
  ).map((match) => match[1]);

  let content = await fs.readFile(TYPESHARE_GENERATED_PATH, "utf8");
  content =
    `
  // Import prepended by scripts/add-imports-to-typeshare.ts
  import {${HOLOCHAIN_TYPES.join(", ")}} from "@holochain/client";
  import {${depTypes.join(", ")}} from "./dependency-types";
  ` + content;

  content = await prettier.format(content, { parser: "typescript" });
  await fs.writeFile(TYPESHARE_GENERATED_PATH, content);
}

main().catch(console.error);
