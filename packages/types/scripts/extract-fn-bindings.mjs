import fs from "fs/promises";
import { glob } from "glob";
import prettier from "prettier";

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

async function extractFnBindingsForCrate(name, typesTransform) {
  console.log("Start extracting fn bindings for:", name);
  const rustFiles = await glob(`${CRATES_DIR}/${name}/src/**/*.rs`);
  const bindings = [];
  let deps = new Set();
  await Promise.all(
    rustFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf-8");
      const matches = content.matchAll(extern_regex);
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
    if (binding.inputType === "void") {
      return `async ${snakeToCamel(binding.fnName)}(): Promise<${binding.outputType}> {
        return this.callZomeFn("${binding.fnName}")
      }`;
    } else {
      const inputName = snakeToCamel(binding.inputName);
      return `async ${snakeToCamel(binding.fnName)}(${inputName}: ${binding.inputType}): Promise<${binding.outputType}> {
        return this.callZomeFn("${binding.fnName}", ${inputName})
      }`;
    }
  });

  const splitDeps = { holochain: ["AppClient"], holoom: [] };
  for (const dep of deps) {
    const [location, name] = dep.split(":");
    splitDeps[location].push(name);
  }

  let classFile = `
  import { callZomeFnHelper } from '../utils';
  import {${splitDeps.holochain.sort().join(", ")}} from '@holochain/client';
  `;
  if (splitDeps.holoom.length) {
    classFile += `import {${splitDeps.holoom.sort().join(", ")}} from '../types';\n`;
  }
  const className = snakeToUpperCamel(name);
  classFile += `
  export class ${className} {
    constructor(
        private readonly client: AppClient,
        private readonly roleName = 'holoom',
        private readonly zomeName = '${name.replace("_coordinator", "")}',
    ) {}

    callZomeFn(fnName:string, payload?: unknown) {
      return callZomeFnHelper(
        this.client,
        this.roleName,
        this.zomeName,
        fnName,
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

const HOLOCHAIN_TYPES = ["ActionHash", "AgentPubKey", "Record", "Signature"];

class TypeTransform {
  static async init() {
    const tsFiles = await fs.readdir(`${CRATES_DIR}/holoom_types/bindings`);
    const holoomTypes = tsFiles.map((name) => name.slice(0, -3));
    const transform = new TypeTransform();
    transform.holoomTypes = holoomTypes;
    return transform;
  }

  transform(rustType) {
    const tokens = rustType
      .split(/(\w+|[^\w])/gi)
      .map((str) => str.trim())
      .filter((str) => !!str);
    // console.log("tokens", tokens, rustType);
    if (tokens.length === 0) {
      throw Error("Empty rust type");
    }
    if (tokens.length === 1) {
      return this.transformShallow(rustType);
    }
    // Type is complex

    if (tokens[0] === "(") {
      // Found a tuple or Unit type
      if (tokens[tokens.length - 1] !== ")") {
        throw new Error(`Invalid type ${rustType}`);
      }
      if (tokens.length === 2) {
        // Rust unit type
        return { type: "void", deps: new Set() };
      }
      // Found tuple
      const { types, deps } = this.transformElemsFromParts(tokens.slice(1, -1));
      return { type: `[${types.join(", ")}]`, deps };
    }

    if (tokens[1] === "<") {
      // Found a generic
      if (tokens[tokens.length - 1] !== ">") {
        throw new Error(`Invalid type ${rustType}`);
      }

      const { types, deps } = this.transformElemsFromParts(tokens.slice(2, -1));

      if (tokens[0] === "Vec") {
        if (types.length !== 1) {
          throw new Error(`Invalid Vec '${rustType}'`);
        }
        return { type: `${types[0]}[]`, deps };
      } else if (tokens[0] === "Option") {
        if (types.length !== 1) {
          throw new Error(`Invalid Option '${rustType}'`);
        }
        return { type: `(${types[0]}) | null`, deps };
      } else if (tokens[0] === "HashMap") {
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

  transformElemsFromParts(tokens) {
    const rustElems = flattenTokens(tokens);
    const tsElems = rustElems.map((elem) => this.transform(elem));
    const deps = tsElems.reduce(
      (acc, elem) => new Set([...elem.deps, ...acc]),
      new Set()
    );
    const types = tsElems.map((elem) => elem.type);

    return { types, deps };
  }

  transformShallow(rustType) {
    if (HOLOCHAIN_TYPES.includes(rustType)) {
      return { type: rustType, deps: new Set([`holochain:${rustType}`]) };
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

// Joins any tokens that are part of an opened scope
function flattenTokens(tokens) {
  let openBrackets = 0;
  let openArrows = 0;
  const parts = [];
  let activePart = "";
  for (const token of tokens) {
    if (token === "(") {
      openBrackets++;
    } else if (token === ")") {
      openBrackets--;
    } else if (token === "<") {
      openArrows++;
    } else if (token === ">") {
      openArrows--;
    }

    if (token === "," && openBrackets === 0 && openArrows === 0) {
      parts.push(activePart);
      activePart = "";
    } else {
      activePart += token;
    }
  }
  if (activePart) parts.push(activePart);
  return parts;
}

main().catch(console.error);
