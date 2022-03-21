import { Node } from "@babel/types";

export function clipCodeFromLoc(code: string, node: Node) {
  if (typeof node.start === "number" && typeof node.end === "number") {
    return code.substring(node.start, node.end);
  } else {
    return "";
  }
}
