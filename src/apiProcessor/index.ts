import fileStats from "../fileStats/index";
import fs from "fs";
import { API, HasLoc, MemberRef } from "../types";
import { Node } from "@babel/types";
import vueScriptExtract from "./vueScriptExtract";
import store from "./store";
import urlResolve from "./urlResolve";
import _debug from "debug";
import routeDistribute from "./routeDistribute";
import { extractUrlFromAPI } from "./extractUrlFromAPI";

const debug = _debug("api-processor");

type APIEntity = MemberRef & HasLoc & API;

function dedupArray<T>(arr: T[]) {
  return [...new Set(arr)];
}

/**
 * 判断某个AST节点时候和某个变量等价
 */
const isEquivalent = (nodes: Node[], name: string) => {
  /**
   * TODO: 目前只能通过变量是否是单个Identifier来判断, 需要加上其他的等价判断
   */
  return (
    nodes.length === 1 &&
    nodes[0].type === "Identifier" &&
    nodes[0].name === name
  );
};

export default function apiProcessor(filename?: string) {
  if (!filename || !["js", "vue"].includes(filename.split(".").pop() || "")) {
    return;
  }

  debug("start process file: " + filename);

  let fileContent = "";

  try {
    fileContent = fs.readFileSync(filename, "utf-8");
  } catch {
    console.warn("node_modules: " + filename);
  }

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
    constants,
  } = fileStats(fileContent, {
    plugins: ["jsx"],
  });

  if (imports.some((v) => v.name.includes("#default"))) {
    /** FIXME: 这样判断文件是否是路由文件 不太准确 带 */
    if (filename.includes("router")) {
      routeDistribute({
        filename,
        imports,
      });
      return;
    } else {
      imports
        .filter((v) => v.name.includes("#default"))
        .forEach((v) => {
          v.alias = "";
        });
    }
  }

  // console.log("Imports:", imports);
  // console.log("Exports:", ex);
  // console.log("Relations:", relations);

  /** 引入的API相关的变量列表 */
  const importedApi: APIEntity[] = [];

  const equivalentVariable: Set<string> = new Set();

  /** API强相关的引入(直接定义接口用的, 例如fetch之类的) */
  const apiAlis: string[] = [];

  imports.forEach((v) => {
    v.source = urlResolve(filename, v.source) || "";
    if (
      store.apiEntries.find((ae) => ae.source === v.source && ae.name == v.name)
    ) {
      apiAlis.push(v.alias);
    } else {
      if (v && v.name && v.alias) {
        const existApi = store.exports
          .get(v.source)
          ?.find((api) => api.alias === v.name);
        if (existApi) {
          importedApi.push({ ...existApi, alias: v.alias });
        } else {
          importedApi.push({
            ...v,
            source: v.source,
            isApi: "unknown",
            urls: [],
            unknownApi: [],
          });
        }
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
      source: filename,
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

              if (isEquivalent(nodes, v.name)) {
                equivalentVariable.add(name);
                equivalentVariable.add(v.name);
                api.isApi = true;
                return [];
              }

              api.urls = api.urls.concat(
                nodes.flatMap((v) => {
                  if (v.type === "Identifier") {
                    api.isApi = true;
                  }
                  return extractUrlFromAPI(
                    v,
                    relations,
                    fileContent,
                    constants
                  );
                })
              );

              /** TODO:  如果是ImportBase */
            } else {
              /** */
            }
          } else {
            /** 递归获取子变量的api */
            const subApi = loop(v.name);
            if ("nodes" in v) {
              const nodes = v.nodes;
              if (isEquivalent(nodes, v.name)) {
                equivalentVariable.add(name);
                equivalentVariable.add(v.name);
              }
            }
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

    const subApi = loop(exportInstance.name);
    res.urls = res.urls.concat(subApi.urls);
    res.unknownApi = [...new Set(res.unknownApi.concat(subApi.unknownApi))];

    if (
      equivalentVariable.has(exportInstance.name) &&
      apiAlis.some((aa) => equivalentVariable.has(aa))
    ) {
      store.apiEntries.push({ source: filename, name: exportInstance.alias });
      res.isApi = true;
    }

    if (res.isApi) {
      exportApi.push(res);
    }
  });

  store.exports.set(filename, exportApi);

  if (ex.extends) {
    /** TODO: 处理Extends的部分 */
    // console.log(ex.extends);
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
    exportApi.forEach((v) => {
      if (v.urls.length === 0 && v.unknownApi.length === 0) {
        v.isApi = false;
      }
    });
    const cbList = store.exportMemberCallbacks.get(filename);
    if (cbList?.length) {
      cbList.forEach((cb) => {
        debug("recurse-export form: " + filename);
        cb.fn();
      });
    }
  };

  nextProcessUrls.forEach((url) => {
    let cbs = store.exportMemberCallbacks.get(url);
    if (!cbs) {
      cbs = [];
      store.exportMemberCallbacks.set(url, cbs);
    }

    let cb = {
      source: filename,
      fn: () => {
        let needRecurse = false;
        /** url对应导出的成员 */
        const apis = store.exports.get(url);
        if (!apis) {
          return;
        }

        debug("recurse-to: " + filename);

        apis.forEach((/** 导出的单个成员 */ api) => {
          /** 如果已经知道当前api是否为api (不为未知) */
          if (api.isApi === "unknown") {
            return;
          }

          /** 使用到该「导出成员」的本地变量列表 */
          const list = unknownApiReferMap.get(api.alias);

          if (!list?.length) {
            return;
          }

          /** api的别名 */
          const apiAlias = imports.find((v) => v.name === api.name)?.alias;

          debug("recurse-api: " + api.alias);

          /** api是否是强相关api */
          const isStronglyRelativeApi = store.apiEntries.find(
            (ae) => ae.source === api.source && ae.name === api.name
          );

          list?.forEach(
            (/** 使用到该「导出成员」的本地变量 */ localVariable) => {
              const unknownApiCountBefore = localVariable.unknownApi.length;
              /** 如果是强相关API 则重新提取api的信息 */
              if (isStronglyRelativeApi) {
                const relation = (relations[localVariable.name] || []).find(
                  (r) => r.name === apiAlias
                );
                if (relation) {
                  /** 如果是局部变量(Member) */
                  if ("nodes" in relation) {
                    const nodes = relation.nodes;
                    localVariable.urls = localVariable.urls.concat(
                      nodes.flatMap((v) =>
                        extractUrlFromAPI(v, relations, fileContent, constants)
                      )
                    );

                    /** TODO:  如果是ImportBase */
                  } else {
                    /** */
                  }
                }
              }

              localVariable.urls = dedupArray(
                localVariable.urls.concat(api.urls)
              );
              /** 将传入的api从未知api中删除 */
              localVariable.unknownApi.splice(
                localVariable.unknownApi.findIndex(
                  (ua) => ua.name === api.alias
                ),
                1
              );

              /**
               * 如果本地变量关联的API已经为0
               * 即不存在未知api 则通过url长度判断本地变量是否为api
               */
              if (localVariable.unknownApi.length === 0) {
                if (localVariable.urls.length > 0) {
                  localVariable.isApi = true;
                } else {
                  localVariable.isApi = false;
                }
              }

              /**
               * 如果未知api数量减少 则回溯
               * NOTE: 这样回溯次数会很多 但是如果改为
               * 「localVariable.unknownApi.length === 0」
               * 的话 不知道会不会有问题
               */
              if (unknownApiCountBefore > localVariable.unknownApi.length) {
                needRecurse = true;

                // for (let i = localVariable.unknownApi.length - 1; i >= 0; i--) {
                //   const ua = localVariable.unknownApi[i];
                //   if (ua.unknownApi.length === 0) {
                //     localVariable.unknownApi.splice(i, 1);
                //   }
                // }
              }
            }
          );
        });

        if (needRecurse) {
          recurseExport();
        }
      },
    };

    cbs.push(cb);
  });

  /**
   * 如果某个文件没有导出 这循环每个import
   * TODO: 此时该文件的api应该整合到引用他的文件里
   */
  if (exportApi.length === 0) {
    importedApi.forEach((v) => {
      apiProcessor(v.source);
    });
  }

  /** 需要添加好所有的回调之后再开始处理新文件 */
  nextProcessUrls.forEach((url) => {
    if (!store.exports.get(url)) {
      apiProcessor(url);
    }
  });

  recurseExport();
}
