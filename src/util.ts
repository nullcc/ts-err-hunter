import fs from "fs";
import path from "path";
import _ from "lodash";

export const scan = (dir: string): string[] => {
  let files = fs.readdirSync(dir);
  return _
    .chain(files)
    .map(file => path.join(dir, file))
    .flatMap(filePath => {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) return scan(filePath);
      else if (stats.isFile() && [".ts", ".tsx"].includes(path.extname(filePath))) return filePath;
      return "";
    })
    .flatMap()
    .filter(e => e !== "")
    .value();
};

export const writeToFile = (fileName: string, content: string) => {
  fs.writeFileSync(fileName, content);
};
