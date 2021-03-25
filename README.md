# ts-err-hunter

## Introduction

This tool records all code range of function declarations and arrow functions into a json file named `.file-fn-range.json` in the project root.

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

_fileFnRange.json:
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

Assumes that your source code directory is `src` and `tsconfig.json` is in the project root.

Creates a new file named "compile.ts" in the project root with following content:s

```typescript
import { compile } from "ts-err-hunter";

compile("src", "tsconfig.json");
```

Then run

```shell script
$ ts-node compile.ts
```

to compile your code into JS.