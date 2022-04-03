import { LVal, VariableDeclarator } from "@babel/types";
import getPatternNames from "../fileStats/getPatternNames";
import { MemberRef } from "../types";
import evalExpression from "./evalExpression";

export default function (node: VariableDeclarator, code: string) {
  const pattern = node.id;
  const initValue = node.init === null ? null : evalExpression(node.init, code);

  const ret: { [key: string]: any } = {};
  let names: MemberRef[] = [];

  switch (pattern.type) {
    case "Identifier":
      ret[pattern.name] = initValue;
      break;
    case "ArrayPattern":
      names = pattern.elements.reduce((ret, el) => {
        return el ? ret.concat(getPatternNames(el)) : ret;
      }, [] as MemberRef[]);

      names.forEach((v, i) => {
        ret[v.name] = (initValue || [])[i];
      });
      break;
    case "ObjectPattern":
      names = pattern.properties.reduce((ret, prop) => {
        let next = prop.type === "RestElement" ? prop.argument : prop.value;
        if (next) {
          return ret.concat(getPatternNames(next as LVal));
        } else {
          console.warn(
            `getPatternNames - ObjectPattern next is invalid! Value: ${next}.`
          );
          return ret;
        }
      }, [] as MemberRef[]);

      names.forEach((v) => {
        ret[v.name] = (initValue || {})[v.name];
      });
      break;

    case "RestElement":
      names = getPatternNames(pattern.argument);
      names.forEach((v) => {
        ret[v.name] = initValue;
      });
  }

  return ret;
}
