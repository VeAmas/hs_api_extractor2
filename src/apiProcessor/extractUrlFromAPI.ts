import { Constants, MemberRelation } from "../types";
import { isExpression, Node } from "@babel/types";
import store from "./store";
import evalExpression from "./evalExpression";
import { clipCodeFromLoc } from "./utils";

export /** 从一个API强关联的node中提取API的url */
const extractUrlFromAPI = (
  node: Node,
  relations: MemberRelation,
  fileContent: string,
  constants: Constants
) => {
  const res: string[] = [];

  if (node.type === "CallExpression") {
    const args = node.arguments;

    let thisScope = null;

    const scopeFn = (key: string) => {
      if (key === "window") return Object.freeze(store.sysconfig);
      if (key === "this") {
        if (!thisScope) {
          /** */
        }
        return thisScope;
      }
      if (constants.has(key)) {
        return constants.get(key);
      } else if (key in relations) {
        relations[key];
        // return evalExpression()
      }
    };

    if (args[0]) {
      const arg = args[0];
      const codeClip = clipCodeFromLoc(fileContent, arg);
      if (!codeClip) return [];
      let argValue;
      if (arg.type === "SpreadElement") {
        argValue = evalExpression(arg.argument, fileContent, scopeFn);
      } else if (isExpression(arg)) {
        argValue = evalExpression(arg, fileContent, scopeFn);
      }

      if (typeof argValue === "string") {
        res.push(argValue);
      } else if (typeof argValue === "object") {
        if (argValue.url) {
          res.push(argValue.url);
        }
      }
    }

    // args.forEach((arg) => {
    //   /** 如果直接是一个字符串 */
    //   if (arg.type === "StringLiteral") {
    //     res.push(arg.value.split("?")[0]);

    //     /** 如果是一个加法运算 */
    //   } else if (arg.type === "BinaryExpression") {
    //     const exprssion: string[] = [];

    //     const loop = (n: Node) => {
    //       if (n.type === "BinaryExpression") {
    //         loop(n.left);
    //         loop(n.right);
    //       } else if (n.type === "StringLiteral") {
    //         exprssion.push(n.value);

    //         /** 如果是一个变量 */
    //       } else if (n.type === "Identifier") {
    //         /** 查找全局变量中是否存在该变量 */
    //         if (relations[n.name]) {
    //           const relation = relations[n.name]?.[0];
    //           if (relation) {
    //             if ("nodes" in relation && relation.nodes[0]) {
    //               const node = relation.nodes[0];
    //               const expression = fileContent.substring(
    //                 node.start!,
    //                 node.end!
    //               );
    //               let n: any = store.sysconfig;
    //               expression
    //                 .split(".")
    //                 .slice(1)
    //                 .forEach((v) => {
    //                   n = n[v];
    //                 });

    //               exprssion.push(n);
    //             }
    //           } else {
    //             const constant = constants.get(n.name);
    //             if (!constant) {
    //               return;
    //             }
    //             exprssion.push(constant);
    //           }
    //         } else {
    //           /** TODO: 如果是一个函数内部定义的局部变量的话怎么办? */
    //         }
    //       } else {
    //         /** 其他情况 (例如是个函数调用或者'MemberExpression') 暂时不用处理吧 */
    //       }
    //     };

    //     loop(arg);

    //     res.push(exprssion.join("").split("?")[0]);

    //     /** 其他情况 */
    //   } else {
    //     /** */
    //   }
    // });

    return res;

    /** 其他情况 (TODO:待补充) */
  } else {
    /** 不是调用的话 就不管了 */
  }

  return [];
};
