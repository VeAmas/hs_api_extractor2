import { Expression, isExpression, isLiteral } from "@babel/types";
import { clipCodeFromLoc } from "./utils";

/**
 * 计算某个表达式的值
 * @param expression 表达式的Node
 * @param code 源代码
 * @param scope 作用域 也可以是返回作用域中值的函数
 * @returns
 */
export default function (
  expression: Expression,
  code: string,
  scope: { [key: string]: any } | { (key: string): any } | undefined = {},
  overrideCases?: {
    [key in Expression["type"]]?: {
      (
        node: Expression,
        loop: (node: Expression) => any,
        currentScopeDepth: number
      ): any;
    };
  }
): any | undefined {
  const getValueFromScope = (key: string) => {
    if (typeof scope === "function") {
      return scope?.(key);
    } else {
      return scope[key];
    }
  };

  let currentScopeDepth = 0;

  const loop = (node: typeof expression): any => {
    /** 字面量 */
    if (isLiteral(node)) {
      return eval(clipCodeFromLoc(code, node));
    } else {
      if (overrideCases?.[node.type]) {
        return overrideCases[node.type]?.(node, loop, currentScopeDepth);
      }
      switch (node.type) {
        /** 变量 */
        case "Identifier": {
          return getValueFromScope(node.name);
        }
        /** this表达式 */
        case "ThisExpression": {
          return getValueFromScope("this");
        }
        /** 逻辑表达式 */
        case "LogicalExpression":
        /** 二元运算 */
        case "BinaryExpression": {
          const op = node.operator;
          const leftNode = node.left;
          const rightNode = node.right;
          const leftValue = loop(leftNode);
          const rightValue = loop(rightNode);
          const fn = new Function("a, b", "return a " + op + " b;");
          return fn(leftValue, rightValue);
        }
        /** 数组 */
        case "ArrayExpression": {
          return node.elements.flatMap((v) => {
            /** 普通表达式 */
            if (isExpression(v)) {
              return [loop(v)];

              /** 空的项 [1,,2] */
            } else if (!v) {
              return [undefined];

              /** 拓展运算符 [..., a] */
            } else {
              const value = loop(v.argument);
              return Array.isArray(value) ? value : [];
            }
          });
        }
        /** 对象可选属性 */
        case "OptionalMemberExpression":
        /** 对象属性 */
        case "MemberExpression": {
          const object = node.object;
          const property = node.property;
          const objectValue = loop(object);
          const propertyValue = node.computed ? loop(property) : property.name;
          return objectValue?.[propertyValue];
        }
        /** 一元运算 (-a) */
        case "UnaryExpression": {
          const rightValue = loop(node.argument);
          const op = node.operator;
          const fn = new Function("a", "return " + op + " a;");
          return fn(rightValue);
        }
        /** 三元运算 */
        case "ConditionalExpression": {
          const test = loop(node.test);
          const consequent = loop(node.consequent);
          const alternate = loop(node.alternate);
          return test ? consequent : alternate;
        }
        /** 逗号表达式 */
        case "SequenceExpression": {
          if (node.expressions.length === 0) {
            return undefined;
          }
          return loop(node.expressions[node.expressions.length - 1]);
        }
        case "OptionalCallExpression":
        case "CallExpression": {
          return;
        }
        /** ++ | -- */
        case "UpdateExpression": {
          let arg = loop(node.argument);
          const op = node.operator;
          /** NOTE: update操作无法改变原始值 复杂情况下会发生错误 */
          if (op === "++") {
            return node.prefix ? ++arg : arg++;
          } else {
            return node.prefix ? --arg : arg--;
          }
        }
        /** 对象字面量 */
        case "ObjectExpression": {
          currentScopeDepth++;
          const properties = node.properties;
          const ret = {};
          properties.forEach((v) => {
            if (v.type === "SpreadElement") {
              const value = loop(v.argument);
              Object.assign(ret, value);
            } else {
              let key;
              let value;
              if (v.type === "ObjectProperty" && v.shorthand) {
                key = v.key.name;
              } else {
                if (v.computed) {
                  key = loop(v.key);
                } else {
                  key = v.key.name;
                }
              }
              if (v.type === "ObjectMethod") {
                value = new Function();
              } else {
                if (isExpression(v.value)) {
                  value = loop(v.value);
                } else {
                  /** 其他情况就不管了 我没碰到过其他情况 */
                  // v.value.type === ''
                  currentScopeDepth--;
                  return;
                }
              }
              ret[key] = value;
            }
          });
          currentScopeDepth--;
          return ret;
        }
        /** new表达式 */
        case "NewExpression": {
          if (node.callee.type === "V8IntrinsicIdentifier") {
            return undefined;
          }
          return new (loop(node.callee))();
        }
        /** 赋值表达式 */
        case "AssignmentExpression": {
          /** NOTE: update操作无法改变原始值 复杂情况下会发生错误 */
          return loop(node.right);
        }
        default: {
          /*
          // TupleExpression
          // FunctionExpression 
          // ParenthesizedExpression 
          // ArrowFunctionExpression 
          // ClassExpression 
          // MetaProperty 
          // Super 
          // TaggedTemplateExpression 
          // YieldExpression 
          // TypeCastExpression 
          // JSXElement 
          // JSXFragment 
          // AwaitExpression 
          // BindExpression 
          // PipelinePrimaryTopicReference 
          // Import 
          // DoExpression 
          // RecordExpression 
          // TSAsExpression 
          // TSTypeAssertion 
          // TSNonNullExpression;
          */
        }
      }
    }
  };

  try {
    return loop(expression);
  } catch (e) {
    console.warn(e);
    return undefined;
  }
}
