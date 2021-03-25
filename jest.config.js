module.exports = {
  roots: [''],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/test/.*|(\\.|/)(test))\\.(jsx?|tsx?)$',
  modulePathIgnorePatterns: ["fixtures", "util.ts", "compile.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testURL: "http://localhost/",
  testEnvironment: "node",
  rootDir: "."
};
