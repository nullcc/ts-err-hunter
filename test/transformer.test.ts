import fs from "fs";
import compile from "../src/compile";
import { getFnCode } from "./util";
import { OUTPUT_FILE_NAME } from "../src/constant";

describe("Test transformer.", () => {
  let fileFnRange = {};

  beforeAll(async () => {
    compile("test/fixtures/src", "tsconfig.json");
    fileFnRange = JSON.parse(fs.readFileSync(OUTPUT_FILE_NAME).toString());
  });

  test("Should output _fileFnRangeMap.json to root directory.", async () => {
    expect(fs.existsSync(OUTPUT_FILE_NAME)).toBeTruthy();
  });

  test("Should record fn ranges in test/fixtures/src/fn/functionDeclaration.ts", async () => {
    const filePath = "test/fixtures/src/fn/functionDeclaration.ts";
    const fnRanges = fileFnRange[filePath];

    expect(fnRanges)
      .toEqual([
        {
          "start": 0,
          "end": 69
        },
        {
          "start": 69,
          "end": 156
        }
      ]);

    const code1 = getFnCode(filePath, fnRanges[0].start, fnRanges[0].end);
    const code2 = getFnCode(filePath, fnRanges[1].start, fnRanges[1].end);

    expect(code1).toEqual("export function add(x: number, y: number): number {\n" +
      "  return x + y;\n" +
      "}");
    expect(code2).toEqual("export function* idGenerator() {\n" +
      "  let id = 0;\n" +
      "  while (true) {\n" +
      "    yield id++;\n" +
      "  }\n" +
      "}");
  });

  test("Should record fn ranges in test/fixtures/src/fn/arrowFunctionDeclaration.ts", async () => {
    const filePath = "test/fixtures/src/fn/arrowFunctionDeclaration.ts";
    const fnRanges = fileFnRange[filePath];

    expect(fnRanges)
      .toEqual([
        {
          "start": 81,
          "end": 147
        },
        {
          "start": 93,
          "end": 147
        },
        {
          "start": 156,
          "end": 226
        },
        {
          "start": 169,
          "end": 226
        }
      ]);

    const code1 = getFnCode(filePath, fnRanges[0].start, fnRanges[0].end);
    const code2 = getFnCode(filePath, fnRanges[1].start, fnRanges[1].end);
    const code3 = getFnCode(filePath, fnRanges[2].start, fnRanges[2].end);
    const code4 = getFnCode(filePath, fnRanges[3].start, fnRanges[3].end);

    expect(code1).toEqual("const add = (x: number, y: number): number => {\n" +
      "  return x + y;\n" +
      "}");
    expect(code2).toEqual("(x: number, y: number): number => {\n" +
      "  return x + y;\n" +
      "}");
    expect(code3).toEqual("const exec = async (fn: Fn): Promise<any> => {\n" +
      "  return await fn();\n" +
      "}");
    expect(code4).toEqual("async (fn: Fn): Promise<any> => {\n" +
      "  return await fn();\n" +
      "}");
  });

  test("Should record fn ranges in test/fixtures/src/fn/functionDeclaration.ts", async () => {
    const filePath = "test/fixtures/src/fn/functionDeclaration.ts";
    const fnRanges = fileFnRange[filePath];

    expect(fnRanges)
      .toEqual([
        {
          "start": 0,
          "end": 69
        },
        {
          "start": 69,
          "end": 156
        }
      ]);

    const code1 = getFnCode(filePath, fnRanges[0].start, fnRanges[0].end);
    const code2 = getFnCode(filePath, fnRanges[1].start, fnRanges[1].end);

    expect(code1).toEqual("export function add(x: number, y: number): number {\n" +
      "  return x + y;\n" +
      "}");
    expect(code2).toEqual("export function* idGenerator() {\n" +
      "  let id = 0;\n" +
      "  while (true) {\n" +
      "    yield id++;\n" +
      "  }\n" +
      "}");
  });

  test("Should record fn ranges in test/fixtures/src/fn/methodDeclaration.ts", async () => {
    const filePath = "test/fixtures/src/fn/methodDeclaration.ts";
    const fnRanges = fileFnRange[filePath];

    expect(fnRanges)
      .toEqual([
        {
          "start": 19,
          "end": 41
        },
        {
          "start": 41,
          "end": 102
        }
      ]);

    const code1 = getFnCode(filePath, fnRanges[0].start, fnRanges[0].end);
    const code2 = getFnCode(filePath, fnRanges[1].start, fnRanges[1].end);

    expect(code1).toEqual("constructor() {\n" +
      "  }");
    expect(code2).toEqual("add(x: number, y: number): number {\n" +
      "    return x + y;\n" +
      "  }");
  });

  test("Should record fn ranges in test/fixtures/src/main.ts", async () => {
    const filePath = "test/fixtures/src/main.ts";
    const fnRanges = fileFnRange[filePath];

    expect(fnRanges)
      .toEqual([
        {
          "start": 50,
          "end": 108
        }
      ]);

    const code1 = getFnCode(filePath, fnRanges[0].start, fnRanges[0].end);

    expect(code1).toEqual("function main() {\n" +
      "  console.log(`1 + 2 = ${add(1, 2)}`);\n" +
      "}");
  });
});
