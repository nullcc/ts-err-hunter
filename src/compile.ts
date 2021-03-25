import ts from "typescript";
import transformer from "./transformer";
import * as util from "./util";
import { OUTPUT_FILE_NAME } from "./constant";

export default function compile(dir: string, configFilePath: string, writeFileCallback?: ts.WriteFileCallback) {
  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(configFilePath, undefined as any, ts.sys as any);
  if (!parsedCommandLine) {
    throw new Error("Parsing TS config file error!");
  }
  const filePaths = util.scan(dir);
  const compilerOptions = parsedCommandLine.options;
  compilerOptions.sourceMap = true;
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
  util.writeToFile(OUTPUT_FILE_NAME, JSON.stringify(fileFnRangeMap));
}
