import fs from "fs/promises";
import { glob } from "glob";
import prettier from "prettier";
import { HOLOCHAIN_TYPES } from "./holochain-types";

const CRATES_DIR = "../../crates";
const coordinator_regex = /^.+_coordinator$/;

async function main() {
  const crates = await fs.readdir(CRATES_DIR);
  const typesTransform = await TypeTransform.init();
  const classNames = await Promise.all(
    crates
      .filter((name) => coordinator_regex.test(name))
      .map((name) => extractFnBindingsForCrate(name, typesTransform))
  );

  classNames.sort();
  let indexContent = classNames
    .map((className) => `export * from "./${className}";\n`)
    .join("");
  indexContent = await prettier.format(indexContent, { parser: "typescript" });
  fs.writeFile("./src/zome-functions/index.ts", indexContent);
}

const extern_regex =
  /#\[hdk_extern\]\n(pub )?fn (\w+)?\(\s*(\w+): (\(\)|\w+),?\n?\) -> ExternResult<(.+)> \{/g;

const SKIPPED_METHODS = ["init", "recv_remote_signal"];

interface Binding {
  fnName: string;
  inputName: string;
  inputType: string;
  outputType: string;
}

async function extractFnBindingsForCrate(
  name: string,
  typesTransform: TypeTransform
) {
  console.log("Start extracting fn bindings for:", name);
  const rustFiles = await glob(`${CRATES_DIR}/${name}/src/**/*.rs`);
  const bindings: Binding[] = [];
  let deps = new Set<string>();
  await Promise.all(
    rustFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf-8");
      const matches = Array.from(content.matchAll(extern_regex));

      const externCount = Array.from(
        content.matchAll(/#\[hdk_extern\]/g)
      ).length;
      if (externCount !== matches.length) {
        console.error(
          `hdk_extern regex only captured ${matches.length} / ${externCount} occurrences in ${filePath}`
        );
      }

      for (const match of matches) {
        const [
          _fullMatch,
          _pub,
          fnName,
          inputName,
          rustInputType,
          rustOutputType,
        ] = match;
        if (SKIPPED_METHODS.includes(fnName)) {
          continue;
        }
        try {
          const { type: inputType, deps: inputDeps } =
            typesTransform.transform(rustInputType);
          const { type: outputType, deps: outputDeps } =
            typesTransform.transform(rustOutputType);
          deps = new Set([...inputDeps, ...outputDeps, ...deps]);
          bindings.push({
            fnName,
            inputName,
            inputType,
            outputType,
          });
        } catch (err) {
          console.log("Failed:", fnName);
          //   console.error("Skipped", fnName, err);
        }
      }
    })
  );
  bindings.sort((x1, x2) => (x1.fnName < x2.fnName ? -1 : 1));

  const methodStrs = bindings.map((binding) => {
    const camelFnName = snakeToCamel(binding.fnName);
    if (binding.inputType === "void") {
      return `async ${camelFnName}(): Promise<${binding.outputType}> {
        return this.callFn("${binding.fnName}");
        }`;
    } else {
      const camelInputName = snakeToCamel(binding.inputName);
      return `async ${camelFnName}(${camelInputName}: ${binding.inputType}): Promise<${binding.outputType}> {
          return this.callFn("${binding.fnName}", ${camelInputName});
        }`;
    }
  });

  const splitDeps = {
    holochain: ["AppClient"],
    holoom: [],
    deps: [],
    typeshare: [],
  };
  for (const dep of deps) {
    const [location, name] = dep.split(":");
    splitDeps[location].push(name);
  }

  let classFile = `import {${splitDeps.holochain.sort().join(", ")}} from '@holochain/client';\n`;
  if (splitDeps.deps.length) {
    classFile += `import {${splitDeps.deps.sort().join(", ")}} from '../dependency-types';\n`;
  }
  if (splitDeps.typeshare.length) {
    classFile += `import {${splitDeps.typeshare.sort().join(", ")}} from '../typeshare-generated';\n`;
  }
  if (splitDeps.holoom.length) {
    classFile += `import {${splitDeps.holoom.sort().join(", ")}} from '../types';\n`;
  }
  classFile += `import { callZomeAndTransformError } from "../call-zome-helper";\n`;

  const className = snakeToUpperCamel(name);
  classFile += `
  export class ${className} {
    constructor(
        private readonly client: AppClient,
        private readonly roleName = 'holoom',
        private readonly zomeName = '${name.replace("_coordinator", "")}',
    ) {}

    callFn(fn_name: string, payload?: unknown) {
      return callZomeAndTransformError(
        this.client,
        this.roleName,
        this.zomeName,
        fn_name,
        payload,
      );
    }
    
    ${methodStrs.join("\n\n")}
  }
  `;

  classFile = await prettier.format(classFile, { parser: "typescript" });
  await fs.writeFile(`./src/zome-functions/${className}.ts`, classFile);
  return className;
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

class TypeTransform {
  constructor(
    readonly holoomTypes: string[],
    readonly depTypes: string[],
    readonly typeshareTypes: string[]
  ) {}

  static async init() {
    const tsFiles = await fs.readdir(`${CRATES_DIR}/holoom_types/bindings`);
    const holoomTypes = tsFiles.map((name) => name.slice(0, -3));

    const depTypesContent = await fs.readFile(
      "src/dependency-types.ts",
      "utf8"
    );
    const depTypes = Array.from(
      depTypesContent.matchAll(/\nexport\s+\w+\s+(\w+)/g)
    ).map((match) => match[1]);

    const typeshareContent = await fs.readFile(
      "src/typeshare-generated.ts",
      "utf8"
    );
    const typeshareTypes = Array.from(
      typeshareContent.matchAll(/\nexport\s+\w+\s+(\w+)/g)
    ).map((match) => match[1]);

    return new TypeTransform(holoomTypes, depTypes, typeshareTypes);
  }

  transform(rustType): { type: string; deps: Set<string> } {
    const withDelimiters = rustType.replace(/([a-z0-9]+|[^\w])/gi, "$1†");
    const parts = withDelimiters
      .split("†")
      .map((str) => str.trim())
      .filter((str) => !!str);
    // console.log("parts", parts, rustType, withDelimiters);
    if (parts.length === 0) {
      throw Error("Empty rust type");
    }
    if (parts.length === 1) {
      return this.transformShallow(rustType);
    }
    // Type is complex

    if (parts[0] === "(") {
      // Found a tuple or Unit type
      if (parts[parts.length - 1] !== ")") {
        throw new Error(`Invalid type ${rustType}`);
      }
      if (parts.length === 2) {
        // Rust unit type
        return { type: "void", deps: new Set() };
      }
      // Found tuple
      const { types, deps } = this.transformElemsFromParts(parts.slice(1, -1));
      return { type: `[${types.join(", ")}]`, deps };
    }

    if (parts[1] === "<") {
      // Found a generic
      if (parts[parts.length - 1] !== ">") {
        throw new Error(`Invalid type ${rustType}`);
      }

      const { types, deps } = this.transformElemsFromParts(parts.slice(2, -1));

      if (parts[0] === "Vec") {
        if (types.length !== 1) {
          throw new Error(`Invalid Vec '${rustType}'`);
        }
        return { type: `${types[0]}[]`, deps };
      } else if (parts[0] === "Option") {
        if (types.length !== 1) {
          throw new Error(`Invalid Option '${rustType}'`);
        }
        return { type: `(${types[0]}) | null`, deps };
      } else if (parts[0] === "HashMap") {
        if (types.length !== 2) {
          throw new Error(`Invalid HashMap '${rustType}'`);
        }
        return {
          type: `{[key: ${types[0]}]: ${types[1]}}`,
          deps,
        };
      }
    }
    throw new Error(`Type not determined for '${rustType}'`);
  }

  transformElemsFromParts(parts): { types: string[]; deps: Set<string> } {
    const rustElems = parts
      .join("")
      .split(/,\s*?/)
      .filter((str) => !!str); // Protects against trailing comma
    const tsElems = rustElems.map((elem) => this.transform(elem));
    const deps = tsElems.reduce(
      (acc, elem) => new Set([...elem.deps, ...acc]),
      new Set()
    );
    const types = tsElems.map((elem) => elem.type);

    return { types, deps };
  }

  transformShallow(rustType): { type: string; deps: Set<string> } {
    if (HOLOCHAIN_TYPES.includes(rustType)) {
      return { type: rustType, deps: new Set([`holochain:${rustType}`]) };
    } else if (this.depTypes.includes(rustType)) {
      return { type: rustType, deps: new Set([`dep:${rustType}`]) };
    } else if (this.typeshareTypes.includes(rustType)) {
      return { type: rustType, deps: new Set([`typeshare:${rustType}`]) };
    } else if (this.holoomTypes.includes(rustType)) {
      return { type: rustType, deps: new Set([`holoom:${rustType}`]) };
    }
    const type = (() => {
      switch (rustType) {
        case "String":
          return "string";
        case "bool":
          return "boolean";
        case "EvmAddress":
          return "Uint8Array";
        case "EvmSignature":
          return "[Uint8Array, Uint8Array, number]";
        case "SolanaAddress":
          return "Uint8Array";
        case "SolanaSignature":
          return "number[]";
        default:
          throw new Error(`Unknown type ${rustType}`);
      }
    })();
    return { type, deps: new Set() };
  }
}

main().catch(console.error);
