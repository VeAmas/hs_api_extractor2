import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import { Scopable } from "@babel/types";
import getVariableInitValues from "./getVariableInitValues";

export default function (fileContent: string) {
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

  const scopeList: NodePath<Scopable>[] = [];

  traverse(ast, {
    Scopable: {
      enter(path) {
        scopeList.push(path);
      },
      // exit(path) {
      //   /** */
      // },
    },
  });

  return (start: number, end: number) => {
    const ret: { [key: string]: any } = {};
    let hitScope: NodePath<Scopable>;
    scopeList.forEach((v) => {
      const node = v.node;
      if (!node.start || !node.end) {
        return;
      }
      if (node.start < start && node.end > end) {
        if (!hitScope) {
          hitScope = v;
        } else {
          if (
            node.start >= hitScope.node.start! &&
            node.end <= hitScope.node.end!
          ) {
            hitScope = v;
          }
        }
      }

      if (hitScope) {
        let scopeDepth = 0;
        hitScope.traverse({
          Scopable: {
            enter() {
              scopeDepth++;
            },
            exit() {
              scopeDepth--;
            },
          },
          VariableDeclaration(path) {
            if (scopeDepth === 0) {
              path.node.declarations.forEach((v) => {
                Object.assign(ret, getVariableInitValues(v, fileContent));
              });
            }
          },
        });
      }
    });

    return ret;
  };
}
