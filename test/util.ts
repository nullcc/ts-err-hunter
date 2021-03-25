import fs from "fs";

export const getFnCode = (sourceFile: string, start: number, end: number): string => {
  const content = fs.readFileSync(sourceFile).toString();
  return content.substring(start, end).trim();
};