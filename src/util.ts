import fs from "fs";
import path from "path";
import _ from "lodash";
import { SourceMapConsumer, NullableMappedPosition } from "source-map";
import ErrorStackParser from "error-stack-parser";

type Fn = ((...args: any[]) => Promise<any>) | ((...args: any[]) => any);

interface FnRange {
  start: number;
  end: number;
}

interface Location {
  file: string;
  line: number;
  column: number;
}

const getFnCode = (sourceFile: string, fileFnMap: string, line: number, column: number): { code: string, startLineNumber: number } => {
  const content = fs.readFileSync(sourceFile).toString();
  const lines = content.split("\n");
  let pos = 0;
  let targetLine = 0;
  while (targetLine + 1 < line) {
    pos += lines[targetLine].length;
    targetLine += 1;
  }
  pos += column;
  const map = JSON.parse(fs.readFileSync(fileFnMap).toString());
  const positions = map[path.relative(process.cwd(), sourceFile)];
  const availablePositions = positions.filter((e: FnRange) => e.start <= pos && e.end >= pos);
  const targetPosition = _.maxBy(availablePositions, (pos: FnRange) => pos.end - pos.start);
  const startPos = targetPosition!.start;
  const endPos = targetPosition!.end;
  const code = content.substring(startPos, endPos).trim();
  const startLineNumber = getLineNumberByPos(sourceFile, startPos);
  return { code, startLineNumber };
};

const getLineNumberByPos = (sourceFile: string, pos: number): number => {
  const content = fs.readFileSync(sourceFile).toString();
  const lines = content.split("\n");
  let posIdx = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx += 1) {
    if (posIdx + lines[lineIdx].length < pos + 1) {
      posIdx += lines[lineIdx].length;
      continue;
    }
    return lineIdx + 1;
  }
  throw new Error(`Can't find line number for position ${pos} in source file ${sourceFile}.`);
};

const getOriginalPosition = async (location: Location): Promise<NullableMappedPosition> => {
  return new Promise((resolve, reject) => {
    const sourceMapPath = `${location.file}.map`;
    if (!fs.existsSync(sourceMapPath)) {
      throw new Error(`Can't find source map file in path: ${sourceMapPath}.`);
    }
    const rawSourceMap = JSON.parse(fs.readFileSync(sourceMapPath).toString());
    SourceMapConsumer.with(rawSourceMap, null, consumer => {
      const res = consumer.originalPositionFor({
        line: location.line,
        column: location.column,
      });
      return resolve(res);
    });
  });
};

const getMaxLineLen = (content: string): number => {
  const lines = content.split("\n");
  if (lines.length === 0) {
    return 0;
  }
  return _
    .maxBy(lines, line => line.length)!
    .length;
};

const formatCode = (code: string, startLineNumber: number, line: number, column: number): string => {
  const rows = code.split("\n");
  const maxLineNumberLen = (startLineNumber + rows.length).toString().length;
  return rows
    .map((row: string, idx: number) => {
      const lineNumberPrefix = (startLineNumber + idx).toString().padStart(maxLineNumberLen);
      let content = `> ${lineNumberPrefix} ${row}`;
      if (line === startLineNumber + idx) {
        content += "\n";
        content += _.repeat(" ", `> ${lineNumberPrefix} `.length + column) + "^";
      }
      return content;
    })
    .join("\n");
};

export const exec = async (fn: Fn, self: any = null, ...args: any[]) => {
  try {
    return await fn.call(self, ...args);
  } catch (err) {
    const errStackFrames = ErrorStackParser.parse(err);
    const topFrame = errStackFrames[0];
    const originalPosition = await getOriginalPosition({
      file: topFrame.fileName!,
      line: topFrame.lineNumber!,
      column: topFrame.columnNumber!,
    });
    const tsSourceFile = path.normalize(`${path.dirname(topFrame.fileName!)}/${originalPosition.source!}`);
    const { code, startLineNumber } = getFnCode(tsSourceFile, ".file-fn-range.json", originalPosition.line!, originalPosition.column!);
    const formattedCode = formatCode(code, startLineNumber, originalPosition.line!, originalPosition.column!);
    const maxLineLen = getMaxLineLen(formattedCode);
    const codeSnippetTitle = " code snippet ";
    const frameLength = (maxLineLen - codeSnippetTitle.length) / 2;
    const codeSnippetHead = `${_.repeat("=", frameLength)}${codeSnippetTitle}${_.repeat("=", frameLength)}`;
    console.log(`>>> [ts-err-hunter] Caught error in TS source file: ${tsSourceFile}`);
    console.log(codeSnippetHead);
    console.log(formattedCode);
    console.log(_.repeat("=", codeSnippetHead.length));
    throw err;
  }
};
