# ts-err-hunter

## Introduction

This tool records all code range of function declarations and arrow functions into a json file named `.ts-err-hunter-file-fn-range.json` in the project root.

Sample: 

```
|---my-app
|   |---src
|   |   |---inner
|   |   |   |---b.ts
|   |   |---a.ts
```

src/a.ts:
```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

src/inner/b.ts:
```typescript
export const add = (a: number, b: number): number => {
  return a + b;
}

export class Calc {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

_.ts-err-hunter-file-fn-range.json:
```json
{
  "src/a.ts": [
    {
      "start": 0,
      "end": 69
    }
  ],
  "src/inner/b.ts": [
    {
      "start": 6,
      "end": 72
    },
    {
      "start": 18,
      "end": 72
    },
    {
      "start": 93,
      "end": 153
    }
  ]
}
```

## Installation

```shell script
$ npm i -D ts-err-hunter
```

## Usage

To use `ts-err-hunter`, please add this code into your entry file:

```typescript
import { register } from "ts-err-hunter";

register();
```

And assumes that your source code directory is `src` and `tsconfig.json` is in the project root.

Creates a new file named `compile.ts` in the project root with content:

```typescript
import { compile } from "ts-err-hunter";

compile("src", "tsconfig.json");
```

Then run this to compile your code into JS.

```shell script
$ ts-node compile.ts
```

You can also create `compile.js` with:

```javascript
const compile = require("ts-err-hunter").compile;

compile("src", "tsconfig.json");
```

then run: 

```shell script
$ node compile.js
```

Now you can use it:

```typescript
import fs from "fs";
import { register } from "ts-err-hunter";

register();

const foo = () => {
  // comments...
  fs.readFileSync("xxx.json");
}

(async () => {
  try {
    foo();
  } catch (err) {
    const sourceCode = await err.getSourceCode();
    if (sourceCode) {
      console.log(`source file: ${sourceCode.fileName}`);
      console.log(sourceCode.content);
    }
    throw err;
  }
})();
```

Executes these code, and we will get error point in detail (with TS source code):

```
source file: /absolute/path/to/TS/code.ts
>  6 const foo = () => {
>  7   // comments...
>  8   fs.readFileSync("xxx.json");
          ^ ------------> ENOENT: no such file or directory, open 'xxx.json'

>  9 }
```
