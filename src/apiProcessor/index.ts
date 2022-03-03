import fileStats from "../fileStats/index";
import fs from "fs";
import { API, HasLoc, MemberRef, MemberRelation } from "../types";
import { Node } from "@babel/types";
import vueScriptExtract from "./vueScriptExtract";
import store from "./store";
import urlResolve from "./urlResolve";
import _debug from "debug";
const debug = _debug("api-processor");

type APIEntity = MemberRef & HasLoc & API;

function dedupArray<T>(arr: T[]) {
  return [...new Set(arr)];
}

// const API_ENTRIES = ["@fais/tzjc-comps"];

/** 从一个API强关联的node中提取API的url */
const extractUrlFromAPI = (
  node: Node,
  relations: MemberRelation,
  fileContent: string
) => {
  const res: string[] = [];

  if (node.type === "CallExpression") {
    const args = node.arguments;

    args.forEach((arg) => {
      /** 如果直接是一个字符串 */
      if (arg.type === "StringLiteral") {
        res.push(arg.value.split("?")[0]);

        /** 如果是一个加法运算 */
      } else if (arg.type === "BinaryExpression") {
        const exprssion: string[] = [];

        const loop = (n: Node) => {
          if (n.type === "BinaryExpression") {
            loop(n.left);
            loop(n.right);
          } else if (n.type === "StringLiteral") {
            exprssion.push(n.value);

            /** 如果是一个变量 */
          } else if (n.type === "Identifier") {
            /** 查找全局变量中是否存在该变量 */
            if (relations[n.name]) {
              const relation = relations[n.name][0];
              if ("nodes" in relation && relation.nodes[0]) {
                const node = relation.nodes[0];
                const expression = fileContent.substring(
                  node.start!,
                  node.end!
                );
                let n: any = store.sysconfig;
                expression
                  .split(".")
                  .slice(1)
                  .forEach((v) => {
                    n = n[v];
                  });

                exprssion.push(n);
              }
            } else {
              /** TODO: 如果是一个函数内部定义的局部变量的话怎么办? */
            }
          } else {
            /** 其他情况 (例如是个函数调用或者'MemberExpression') 暂时不用处理吧 */
          }
        };

        loop(arg);

        res.push(exprssion.join("").split("?")[0]);

        /** 其他情况 */
      } else {
        /** */
      }
    });

    return res;

    /** 其他情况 (TODO:待补充) */
  } else {
    /** 不是调用的话 就不管了 */
  }

  return [];
};

export default function apiProcessor(filename?: string) {
  if (!filename) {
    return;
  }

  debug("start process file: " + filename);

  let fileContent = fs.readFileSync(filename, "utf-8");

  if (filename.match(/.vue$/)) {
    fileContent = vueScriptExtract(fileContent);
  }

  if (!fileContent) {
    return;
  }

  const {
    imports,
    exports: ex,
    relations,
  } = fileStats(fileContent, {
    plugins: ["jsx"],
  });

  // console.log("Imports:", imports);
  // console.log("Exports:", ex);
  // console.log("Relations:", relations);

  /** 引入的API相关的变量列表 */
  const importedApi: APIEntity[] = [];

  /** API强相关的引入(直接定义接口用的, 例如fetch之类的) */
  const apiAlis: string[] = [];

  imports.forEach((v) => {
    if (
      store.apiEntries.find((ae) => ae.source === v.source && ae.name == v.name)
    ) {
      apiAlis.push(v.alias);
    } else {
      if (v && v.name && v.alias) {
        importedApi.push({
          ...v,
          source: urlResolve(filename, v.source),
          isApi: "unknown",
          urls: [],
          unknownApi: [],
        });
      }
    }
  });

  /** TODO: 判断API相关变量是否立即执行过 */

  /** 用于记录计算过的APIurl列表 */
  const visistedExportMemberMap: Map<string, APIEntity> = new Map();

  /** 最后导出给别的文件使用的 所有带有API的exports */
  const exportApi: APIEntity[] = [];

  ex.members.forEach((exportInstance) => {
    debug("start process export member: " + exportInstance.name);
    const res: APIEntity = {
      ...exportInstance,
      isApi: "unknown",
      urls: [],
      unknownApi: [],
    };

    const loop = (name: string) => {
      debug("start process export member-loop: " + name);
      const isVisited = visistedExportMemberMap.get(name);

      let api: APIEntity = {
        isApi: "unknown",
        urls: [],
        unknownApi: [],
        alias: name,
        loc: null,
        name: name,
      };

      if (isVisited) {
        api = visistedExportMemberMap.get(name)!;
        if (res.isApi === false) {
          res.isApi = api.isApi;
        } else if (res.isApi === "unknown") {
          res.isApi = api.isApi || "unknown";
        }
        res.urls = res.urls.concat(api.urls);
        res.unknownApi = res.unknownApi.concat(api.unknownApi);
        return api;
      }

      visistedExportMemberMap.set(name, api);

      /**
       * 直接导出了Fetch之类的方法
       * (因为这个判断只有第一层loop才可能为真, 其他的都在「查找对应关系」的时候阻隔掉了)
       * 将isApi改为true
       */
      if (apiAlis.includes(name)) {
        api.isApi = true;
        store.apiEntries.push({ source: filename, name: name });
        return api;
      }

      /** 如果用到了从其他文件引入的「带API的属性」,记录下来 */
      const ipt = importedApi.find((v) => v.alias === name);
      if (ipt) {
        api.urls = api.urls.concat(ipt.urls);
        api.unknownApi = api.unknownApi.concat(ipt.unknownApi);
        /** 执行到这里 ipt一定是一个unkonwn的API 所以放入unknownApi数组中 */
        api.unknownApi.push(ipt);
        visistedExportMemberMap.set(name, api);
        return api;
      }

      /** 查找对应关系 */
      if (relations[name]) {
        relations[name].forEach((v) => {
          /** 如果对应关系里是fetch之类的 */
          if (apiAlis.includes(v.name)) {
            /** 如果是局部变量(Member) */
            if ("nodes" in v) {
              const nodes = v.nodes;
              api.urls = api.urls.concat(
                nodes.flatMap((v) =>
                  extractUrlFromAPI(v, relations, fileContent)
                )
              );

              /** TODO:  如果是ImportBase */
            } else {
              /** */
            }
          } else {
            /** 递归获取子变量的api */
            const subApi = loop(v.name);
            api.urls = api.urls.concat(subApi.urls);
            api.unknownApi = api.unknownApi.concat(subApi.unknownApi);
          }
        });
      }

      if (api.urls.length) {
        res.isApi = true;
        res.urls = res.urls.concat(api.urls);
      }
      if (api.unknownApi) {
        if (!res.isApi) {
          res.isApi = true;
        }
        res.unknownApi = res.unknownApi.concat(api.unknownApi);
      }

      visistedExportMemberMap.set(name, api);
      return api;
    };

    loop(exportInstance.name);

    if (res.isApi) {
      exportApi.push(res);
    }
  });

  store.exports.set(filename, exportApi);

  if (ex.extends) {
    /** TODO: 处理Extends的部分 */
    console.log(ex.extends);
    ex.extends.forEach((v) => {
      const url = urlResolve(filename, v);
      if (url) {
        let exptList = store.exports.get(url);
        if (!exptList) {
          apiProcessor(url);
          exptList = store.exports.get(url);
        }

        if (exptList) {
          exportApi.splice(exportApi.length, 0, ...exptList);
        }
      }
    });
  }

  /** 对于某个api 哪些导出引用了它 */
  const unknownApiReferMap: Map<string, APIEntity[]> = new Map();

  const nextProcessUrls: Set<string> = new Set();
  exportApi.forEach((expt) =>
    expt.unknownApi.forEach((api) => {
      if (api.source) {
        nextProcessUrls.add(api.source);

        let refer = unknownApiReferMap.get(api.name);
        if (!refer) {
          refer = [];
          unknownApiReferMap.set(api.name, refer);
        }
        refer.push(expt);
      }
    })
  );

  const recurseExport = () => {
    debug("recurse-export form: " + filename);
    const cbList = store.exportMemberCallbacks.get(filename);
    if (cbList?.length) {
      cbList.forEach((cb) => cb());
    }
  };

  nextProcessUrls.forEach((url) => {
    let cbs = store.exportMemberCallbacks.get(url);
    if (!cbs) {
      cbs = [];
      store.exportMemberCallbacks.set(url, cbs);
    }

    cbs.push(() => {
      let needRecurse = false;
      const apis = store.exports.get(url);
      if (!apis) {
        return;
      }

      debug("recurse-to: " + filename);

      apis.forEach((api) => {
        if (api.isApi !== true) {
          return;
        }

        debug("recurse-api: " + api.alias);
        const list = unknownApiReferMap.get(api.alias);
        list?.forEach((v) => {
          v.urls = dedupArray(v.urls.concat(api.urls));
          v.unknownApi.splice(
            v.unknownApi.findIndex((ua) => ua.name === api.alias),
            1
          );
          if (v.unknownApi.length === 0) {
            v.isApi = true;
            needRecurse = true;
          }
        });
      });

      if (needRecurse) {
        recurseExport();
      }
    });

    if (!store.exports.get(url)) {
      apiProcessor(url);
    }
  });

  recurseExport();
}
