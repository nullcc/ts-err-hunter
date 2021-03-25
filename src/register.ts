import { ErrHunter } from "./errHunter";

export const register = () => {
  Error.stackTraceLimit = Infinity;

  // @ts-ignore
  Error.prototype.getSourceCode = async function (depth: number = 1) {
    if (this["sourceCode"]) {
      return this["sourceCode"];
    }
    const errHunter = new ErrHunter(this);
    this["sourceCode"] = await errHunter.getFnSourceCode(depth);
    return this["sourceCode"];
  };
};
