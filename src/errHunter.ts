import fs from "fs";
import path from "path";
import _ from "lodash";
import ErrorStackParser, { StackFrame } from "error-stack-parser";
import { SourceMapConsumer, NullableMappedPosition } from "source-map";
import { OUTPUT_FILE_NAME } from "./constant";

interface FnRange {
  start: number;
  end: number;
}

interface Location {
  fileName: string;
  line: number;
  column: number;
}

interface Code {
  fileName: string;
  content: string;
  startLineNumber: number;
  endLineNumber: number;
}

export class ErrHunter {
  private readonly _err: Error;

  constructor(err: Error) {
    this._err = err;
  }

  async getFnSourceCode(depth: number = 1): Promise<Code | null> {
    const userStackFrames = this._getUserStackFrames();
    const topFrame = userStackFrames[0];
    const errLocation = this._getLocation(topFrame);
    const originalPosition = await this._getOriginalPosition(errLocation);
    if (originalPosition === null) {
      return null;
    }
    const sourceFile = path.normalize(`${path.dirname(errLocation.fileName)}/${originalPosition.source!}`);
    const code = this._getFnCode(sourceFile, originalPosition.line!, originalPosition.column!);
    code.content = this._prettifyCode(code, originalPosition.line!, originalPosition.column!);
    return code;
  }

  private _getUserStackFrames(): StackFrame[] {
    const errStackFrames = ErrorStackParser.parse(this._err);
    return _
      .chain(errStackFrames)
      .filter(e => e.getFileName().indexOf("node_modules") === -1) // ignore all files in node_modules
      .filter(e => e.getFileName().startsWith("/")) // ignore non project file
      .value();
  }

  private _getLocation(stackFrame: StackFrame): Location {
    return {
      fileName: stackFrame.getFileName(),
      line: stackFrame.getLineNumber(),
      column: stackFrame.getColumnNumber(),
    }
  }

  private _getOriginalPosition(location: Location): Promise<NullableMappedPosition | null> {
    return new Promise((resolve, reject) => {
      const sourceMapPath = `${location.fileName}.map`;
      if (!fs.existsSync(sourceMapPath)) {
        console.warn(`[ts-err-hunter] Can't find source map in path: ${sourceMapPath}!`);
        return resolve(null);
      }
      const sourceMap = JSON.parse(fs.readFileSync(sourceMapPath).toString());
      SourceMapConsumer.with(sourceMap, null, consumer => {
        const res = consumer.originalPositionFor({
          line: location.line,
          column: location.column,
        });
        return resolve(res);
      });
    });
  }

  private _getFnCode(fileName: string, line: number, column: number): Code {
    const fileContent = fs.readFileSync(fileName).toString();
    const lines = fileContent.split("\n");
    let pos = 0;
    let targetLine = 1;
    while (targetLine < line) {
      pos += lines[targetLine].length;
      targetLine += 1;
    }
    pos += column;
    const fileFnRange = JSON.parse(fs.readFileSync(OUTPUT_FILE_NAME).toString());
    const positions = fileFnRange[fileName] || fileFnRange[path.relative(process.cwd(), fileName)];
    const fnCodeRange = _
      .chain(positions)
      .filter((e: FnRange) => e.start <= pos && e.end >= pos)
      .maxBy((e: FnRange) => e.end - e.start)
      .value();
    const start = fnCodeRange.start;
    const end = fnCodeRange.end;
    const startLineNumber = this._getLineNumberByPos(fileName, start);
    const endLineNumber = this._getLineNumberByPos(fileName, end);
    const codeContent = fileContent.substring(start, end).trim()
    return { fileName, content: codeContent, startLineNumber, endLineNumber };
  }

  private _getLineNumberByPos(fileName: string, pos: number): number {
    const content = fs.readFileSync(fileName).toString();
    const lines = content.split("\n");
    let posIdx = 0;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx += 1) {
      if (posIdx + lines[lineIdx].length < pos + 1) {
        posIdx += lines[lineIdx].length;
        continue;
      }
      return lineIdx + 1;
    }
    console.warn(`[ts-err-hunter] Can't find line number for position ${pos} in file ${fileName}!`);
    return -1;
  }

  private _prettifyCode(code: Code, errLine: number, errColumn: number): string {
    const lines = code.content.split("\n");
    const maxLineNumberLen = (code.startLineNumber + lines.length).toString().length;
    return lines
      .map((line: string, idx: number) => {
        const lineNumberPrefix = (code.startLineNumber + idx).toString().padStart(maxLineNumberLen);
        let content = `> ${lineNumberPrefix} ${line}`;
        if (errLine === code.startLineNumber + idx) {
          content += "\n";
          content += _.repeat(" ", `> ${lineNumberPrefix} `.length + errColumn) + `^ ------------> ${this._err.message}`;
          content += "\n";
        }
        return content;
      })
      .join("\n");
  }
}
