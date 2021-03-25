import * as ts from "typescript";

export default (program: ts.Program, fileFnRangeMap: any): ts.TransformerFactory<ts.SourceFile> => {
  return (ctx: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      const visitor = (node: ts.Node): ts.Node => {
        return ts.visitEachChild(visitNode(node, program, sourceFile.fileName, fileFnRangeMap), visitor, ctx);
      };
      return <ts.SourceFile> ts.visitEachChild(visitNode(sourceFile, program, sourceFile.fileName, fileFnRangeMap), visitor, ctx);
    };
  };
}

const visitNode = (node: ts.Node, program: ts.Program, fileName: string, fileFnRangeMap: any): ts.Node => {
  if (ts.isSourceFile(node)) {
    fileFnRangeMap[node.fileName] = [];
    return node;
  }
  if (!isFnDeclaration(node)) {
    return node;
  }
  let start, end = 0;
  const positions = fileFnRangeMap[fileName];
  if (isVariableDeclarationWithArrowFunction(node)) {
    if (ts.isVariableDeclarationList(node.parent) || ts.isVariableDeclaration(node.parent)) {
      start = node.parent.pos;
      end = node.parent.end;
    }
  } else {
    start = node.pos;
    end = node.end;
  }
  positions.push({ start, end });
  return node;
};

const isFnDeclaration = (node: ts.Node): boolean => {
  return ts.isFunctionDeclaration(node)
    || ts.isFunctionExpression(node)
    || isVariableDeclarationWithArrowFunction(node)
    || ts.isArrowFunction(node)
    || ts.isMethodDeclaration(node)
    || ts.isConstructorDeclaration(node);
};

const isVariableDeclarationWithArrowFunction = (node: ts.Node): boolean => {
  return ts.isVariableDeclaration(node) && !!node.initializer && ts.isArrowFunction(node.initializer);
};
