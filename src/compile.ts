import fs from "fs";
import * as ts from "typescript";
import transformer from "./transformer";
import { scan } from "./util";

export default function compile(dir: string, configFilePath: string, writeFileCallback?: ts.WriteFileCallback) {
  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(configFilePath, undefined as any, (<any>ts.sys));
  if (!parsedCommandLine) {
    throw new Error("Parsing config file error!");
  }
  const compilerOptions = parsedCommandLine.options;
  const filePaths = scan(dir);
  const program = ts.createProgram(filePaths, compilerOptions);
  const fileFnRangeMap = {};
  const transformers: ts.CustomTransformers = {
    before: [transformer(program, fileFnRangeMap)],
    after: [],
  };
  const { emitSkipped, diagnostics } = program.emit(undefined, writeFileCallback, undefined, false, transformers);
  if (emitSkipped) {
    throw new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n'));
  }
  writeToFile(".file-fn-range.json", fileFnRangeMap);
}

const writeToFile = (fileName: string, map: any) => {
  fs.writeFileSync(fileName, JSON.stringify(map));
};
