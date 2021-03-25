import compile from "./compile";
import transformer from "./transformer";
import { exec } from "./util";

Error.stackTraceLimit = Infinity;

export { compile, transformer, exec };