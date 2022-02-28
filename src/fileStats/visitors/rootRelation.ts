import {
  VariableDeclarator,
  VariableDeclaration,
  LVal,
  ExportSpecifier,
  StringLiteral,
} from "@babel/types";
import { NodePath, Visitor } from "@babel/traverse";
import getPatternNames from "../getPatternNames";
import getDeclarationNames from "../getDeclarationNames";
import getModuleReffromExportSpecifier from "../getModuleRefFromExportSpecifier";
import { Declarations, MemberRef, ImportBase, Member } from "../../types";
import _debug from "debug";
import { MODULE_DEFAULT } from "../constants";

const debug = _debug("es-stats:scope");

type Scope = {
  /** 作用域的局部变量 */
  privates: Set<string>;
  /** 作用域中可能是全局变量的变量 */
  candidates: (Member | ImportBase)[];
};

/**
 * 创建一个Babel visitor用来生成[根作用域]中[局部变量]的引用关系
 * @param relations 生成的变量间引用关系
 */
export default function createRootRelationVisitors(
  relations: Declarations = {}
): Visitor {
  /** visitor在访问时的当前的作用域 (非函数级 而是更广义上的作用域) */
  let scope = { privates: new Set(), candidates: [] } as Scope;
  /** 父级的作用域 (栈) */
  const parentScopes = [] as Scope[];
  /** 将访问到的[新定义的局部变量]加入作用域的局部变量列表 */
  const addRefsToPrivates = (refs: Array<MemberRef>) => {
    refs.forEach(({ alias }) => scope.privates.add(alias));
  };
  /** 作用域入栈 */
  const newScope = () => {
    parentScopes.push(scope);
    scope = { privates: new Set(), candidates: [] } as Scope;
  };
  /** 作用域出栈 */
  const exitScopeHandler = () => {
    if (parentScopes.length <= 1) return;
    const { candidates, privates } = scope;
    /** 筛选出候选变量中[非本作用域的局部变量]的变量 */
    const filteredCandidates = candidates.filter(
      (d) => !("nodes" in d) || !privates.has(d.name)
    );
    /** 作用域出栈 */
    scope = parentScopes.pop() as Scope;
    /** 候选名单合并 */
    scope.candidates = Array.from(
      new Set(scope.candidates.concat(filteredCandidates))
    );
    return filteredCandidates;
  };

  const dedupliateCandidate = (candidates?: Scope["candidates"]) => {
    if (!candidates) {
      return [];
    }
    const candidatesMap: Map<string, Member> = new Map();
    const importBaseList: ImportBase[] = [];
    candidates?.forEach((v) => {
      if (!("nodes" in v)) {
        importBaseList.push(v);
      } else {
        if (!candidatesMap.get(v.name)) {
          candidatesMap.set(v.name, {
            name: v.name,
            nodes: [...v.nodes],
          });
        } else {
          candidatesMap.get(v.name)?.nodes.concat(v.nodes);
        }
      }
    });
    const dedupCandidatesList: (Member | ImportBase)[] = [...candidatesMap].map(
      (v) => {
        v[1].nodes = Array.from(new Set(v[1].nodes));
        return v[1];
      }
    );

    return dedupCandidatesList.concat(importBaseList);
  };

  return {
    /** 声明函数 */
    FunctionDeclaration({ node }) {
      if (node.id) {
        scope.privates.add(node.id.name);
      }
    },
    /** 声明类 */
    ClassDeclaration({ node }) {
      if (node.id) {
        scope.privates.add(node.id.name);
      }
    },
    /** 声明变量 */
    VariableDeclaration: {
      /**
       * 进入声明作用域
       * 例如声明一个很大的对象
       */
      enter({ node }) {
        /** 将声明的对象名称存入局部变量 */
        const refs = getDeclarationNames(node as VariableDeclaration);
        if (refs) {
          addRefsToPrivates(refs);
        }
        newScope();
      },
      /** 离开声明作用域 */
      exit({ node }) {
        debug("EXIT-variable scope", parentScopes, scope);
        /** 获取哦变量声明作用域中的[全局变量候选] */
        const candidates = exitScopeHandler();
        /** 如果当前是在根作用域 */
        if (parentScopes.length === 1) {
          /** 获取当前声明的变量的名称 */
          const refs = getDeclarationNames(node as VariableDeclaration);
          if (refs) {
            /** 关联声明的变量与全局变量的关系 */
            refs.forEach(({ alias }) => {
              relations[alias] = {
                dependencies: dedupliateCandidate(candidates),
                loc: node.loc,
              };
            });
          }
        }
      },
    },
    /** 具名导出 */
    ExportNamedDeclaration({ node }) {
      if (node.source) {
        node.specifiers.forEach((specifier) => {
          const ref = getModuleReffromExportSpecifier(
            specifier as ExportSpecifier
          );
          if (ref && !relations[ref.name]) {
            relations[ref.alias] = {
              dependencies: [],
              loc: node.loc,
            };
          }
        });
      }
    },
    /** 匿名导出 */
    ExportDefaultDeclaration: {
      enter() {
        /** 压入匿名导出作用域 */
        scope.privates.add(MODULE_DEFAULT);
        newScope();
      },
      exit({ node }) {
        /** 保存匿名导出中所有用到的全局变量 */
        debug("EXIT-export default scope", parentScopes, scope);
        const candidates = exitScopeHandler();
        if (parentScopes.length === 1) {
          relations[MODULE_DEFAULT] = {
            dependencies: Array.from(new Set(candidates)),
            loc: node.loc,
          };
        }
      },
    },
    /**
     * 任何有作用域的类型
     * 包括 ArrowFunctionExpression / BlockStatement / CatchClause / ClassDeclaration / ClassExpression / ClassMethod
     * ClassPrivateMethod / DoWhileStatement / ForInStatement / ForOfStatement / ForStatement / FunctionDeclaration / FunctionExpression
     * ObjectMethod / Program / StaticBlock / SwitchStatement / TSModuleBlock / WhileStatement
     */
    Scopable: {
      enter(p) {
        /** 先创建作用域 */
        newScope();

        if (p.isFunction()) {
          /** 函数的话 需要把参数存入局部变量存入新的作用域 */
          const refs = p.node.params.reduce((ret, param) => {
            return ret.concat(getPatternNames(param as LVal));
          }, [] as Array<MemberRef>);
          addRefsToPrivates(refs);
        } else if (p.isCatchClause()) {
          /** try的catch也要把参数存入作用域 */
          addRefsToPrivates(getPatternNames(p.node.param as LVal));
        }
      },
      exit(p) {
        const { node, parent } = p;
        debug("EXIT-scopable scope", parentScopes, scope);

        const candidates = exitScopeHandler();
        if (parentScopes.length === 1) {
          /** 对候选名单去重 */
          const dedupCandidates = dedupliateCandidate(candidates);
          // @ts-ignore
          const id = node.id || (parent && parent.id);
          if (id) {
            /** @todo find more specific declaration affected */
            getPatternNames(id).forEach(({ alias }) => {
              relations[alias] = {
                dependencies: dedupCandidates,
                loc: node.loc,
              };
            });
          }
        }
      },
    },
    /**
     * 变量声明中的变量
     * 比如 const c = 1 中的c
     */
    VariableDeclarator({ node }) {
      addRefsToPrivates(getPatternNames((node as VariableDeclarator).id));
    },
    CallExpression({ node }) {
      const { callee, arguments: args } = node;
      /** @todo handle eval */
      // if (callee.name === 'eval') {
      //   args[0].value
      // }

      // dynamic import
      if (callee.type === "Import" && args[0].type === "StringLiteral") {
        /** @todo analyze details of what's dynamically imported */
        scope.candidates.push({
          source: (args[0] as StringLiteral).value,
          name: MODULE_DEFAULT,
          alias: "",
        });
      }
    },
    Identifier(p) {
      const { node, key } = p;
      const parentPath = p.parentPath;
      // exclude function/class identifier
      if (parentPath.isClass() || parentPath.isFunction()) {
        return;
      }
      if (
        // exclude property
        !p.isProperty() &&
        /** 不是property类型(a.b) 或者 作为计算属性(a[b]) */
        (key !== "property" ||
          (parentPath.isMemberExpression() && parentPath.node.computed)) &&
        !(parentPath.isProperty() && key === "key")
      ) {
        debug(">>>", node);

        let startNodePath: NodePath = p;
        while (startNodePath.parentPath?.node.start === node.start) {
          startNodePath = startNodePath.parentPath;
        }

        scope.candidates.push({ name: node.name, nodes: [startNodePath.node] });
      }
    },

    /* JSX */
    /** @todo make it a plugin */
    JSXOpeningElement({ node }) {
      let identifier = node.name;
      while (identifier.type === "JSXMemberExpression") {
        identifier = identifier.object;
      }
      if (identifier.type === "JSXIdentifier") {
        scope.candidates.push({ name: identifier.name, nodes: [identifier] });
      }
    },
  };
}
