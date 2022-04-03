import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import { ConditionalExpression, ReturnStatement } from "@babel/types";
import evalExpression from "./evalExpression";
import { AlternativeList } from "./extractUrlFromAPI";

export default (fileContent: string) => {
  const thisObj = {};

  const ast = parse(fileContent, {
    sourceType: "module",
    plugins: [
      "dynamicImport",
      "classProperties",
      "flowComments",
      "objectRestSpread",
      "functionBind",
      "jsx",
    ],
  });

  let pathStack: NodePath[] = [];
  let currentScopePath: NodePath | undefined = undefined;

  traverse(ast, {
    Program(path) {
      currentScopePath = path;
    },
    Scopable: {
      enter(path) {
        currentScopePath = path;
        pathStack.push(currentScopePath);
      },
      exit() {
        pathStack.pop();
      },
    },
    ObjectMethod(path) {
      if (pathStack.length !== 1 || path.node.key.name !== "data") {
        return;
      }
      const blockStatementBodies = path.node.body.body;
      const returnStatement = blockStatementBodies.find(
        (v): v is ReturnStatement => v.type === "ReturnStatement"
      );

      if (returnStatement) {
        const expression = returnStatement.argument;
        const dataValue = expression
          ? evalExpression(
              expression,
              fileContent,
              {},
              {
                ConditionalExpression(_node, loop, currentScopeDepth) {
                  const node = _node as ConditionalExpression;
                  const consequent = loop(node.consequent);
                  const alternate = loop(node.alternate);
                  if (
                    currentScopeDepth === 1 &&
                    node.test.type === "MemberExpression" &&
                    node.test.object.type === "ThisExpression"
                  ) {
                    return AlternativeList.from([consequent, alternate]);
                  } else {
                    const test = loop(node.test);
                    return test ? consequent : alternate;
                  }
                },
              }
            )
          : {};
        Object.assign(thisObj, dataValue);
      }
    },
  });

  return thisObj;
};
