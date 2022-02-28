import fileStats from "../fileStats/index";
import fs from "fs";
import { API, HasLoc, MemberRef, MemberRelation } from "../types";
import { Node } from "@babel/types";
import vueScriptExtract from "./vueScriptExtract";
import store from "./store";
import urlResolve from "./urlResolve";
import _debug from "debug";
const debug = _debug("api-processor");

const SYSCONFIG = {
  HSFUNDRISK_CONFIG: {
    // 公共产品服务
    API_HOME_CPBASIC_SERVER: "/fais2/fais2.0.cp-basic-server/v",
    API_HOME_CPBASIC_HTTP: "/fais2/fais2.0.cp-basic-http/v",
    APP_CODE: "hsfundFuncanal",
    // 风控5.0公共服务
    API_HOME_RISKPUBDATA_SERVER: "/fais2/fais2.0.cp-basic-server/v",
    API_HOME_RISKPUBDATA_HTTP: "/fais2/fais2.0.cp-basic-http/v",
    // 附件服务
    API_HOME_ATTACHMENT_HTTP: "/fais2/fais2.0.cp-basic-http/v",
    // 公共服务
    API_HOME_ATTACHMENT_SERVER: "/fais2/fais2.0.cp-basic-server/v",
    API_HOME_USERCFG_SERVER: "/fais2/fais2.0.cp-basic-server/v",
    // 参数服务
    API_HOME_PARAMSCFG_SERVER: "/fais2/fais2.0.cp-basic-server/v",
    // 邮件服务
    API_HOME_MSG: "/fais2/fais2.0.cp-basic-server/v",
    // 研报查询
    API_HOME_HREPORT_SERVER: "/hreport/HReport/v",
    // 指标中心
    API_HOME_INDEXCENTER_SERVER: "/fais2/fais2.0.risk-rpas-basic/v",
    API_HOME_INDEXCENTER_SERVER_HTTP: "/fais2/fais2.0.risk-rpas-basic-http/v",

    // 本地用户管理
    API_HOME_LOCALUSERMGT: "/fais2/fais2.0.cp-basic-server/v",
    // 帆软报表
    API_HOME_FINNERREPORT_SERVER: "/webroot/decision/url",
    // 数据维护
    API_HOME_DATAMANAGE_SERVER: "/fais2/fais-datamanage-server/v",
    API_DATAMANAGE_HTTP: "/fais2/fais-datamanage-http/v",
    // 文档中心
    API_HOME_DOCUMENTCONTER_SERVER: "/fais2/fais-documentcenter-server/v",
    // 限额监控
    API_HOME_RISKMONITOR_SERVER: "/fais2/fais-riskmonitor-server/v",
    API_HOME_RISKMONITOR_HTTP: "/fais2/fais-riskmonitor-http/v",
    // 工作台
    API_HOME_RISKMANAGE_SERVER: "/fais2/fais2.0.risk-rpas-basic/v",
    API_HOME_RISKMANAGE_HTTP: "/fais2/fais2.0.risk-rpas-basic-http/v",
    // MC计算服务
    API_HOME_MC_SERVER: "/fais2/fais-monitorcalc-server/v",
    // 自定义视图
    API_HOME_CUSTOMIZED_SERVER: "/fais2/fais2.0.risk-rpas-basic/v",
    API_HOME_CUSTOMIZED_HTTP: "/fais2/fais2.0.risk-rpas-basic-http/v",

    /** 标准功能 */
    API_HOME_STANDARD_SERVER: "/fais2/fais2.0.risk-rpas-basic/v",
    API_HOME_STANDARD_HTTP: "/fais2/fais2.0.risk-rpas-basic-http/v",

    // 数据校验
    API_HOME_DATAVALID_SERVER: "/fais2/fais-risk3-datacheck/v",

    // 保监会报表服务
    API_HOME_CIRCREPORT_SERVER: "/fais2/fais-circreport-server/v",
    API_HOME_CIRCREPORT_HTTP: "/fais2/fais-circreport-http/v",

    // 公共服务
    API_HOME_PUB_SERVER: "/fais2/fais2.0.cp-basic-server/v",
    API_HOME_PUB_HTTP: "/fais2/fais2.0.cp-basic-http/v",
    USERCFG_HOME: "/fais2/fais2.0.cp-basic-server/v",

    // 个性化功能
    API_HOME_FIXINTRIAL_SERVER: "/fais2/fais2.0.risk-rpas-basic/v",

    // 本地用户管理
    API_HOME_LOCALUSERMGT_HTTP: "/fais2/fais2.0.cp-basic-http/v",

    // this.$tabs.addNewTab
    APP_CODE_PREFIX: "/hsfundFuncanal",
    ROUTER_APP_CODE_PREFIX: "hsfundFuncanal",

    DATAMANAGE_PREFIX: "/hsfundDatamanage",
    CP_PREFIX: "/hsfundCp",
    REPORT_PREFIX: "/hsfundReport",
    MONITOR_PREFIX: "/hsfundMonitor",

    // 数据维护公共常量
    APPRAISE_DATAMANAGE_CONST: {
      APP_CODE: "fais-datamanage",
      HS_VALUATION_HISTORY: "risk-datamanage_hs_search_history",
      APPR_SEARCH_HISTORY: "risk-datamanage_appr_search_history",
      EXT_SEARCH_HISTORY: "risk-riskpubdata_ext_search_history",
    },
  },
};

/** 定义哪些入口的的文件可以当做API源 */
const API_ENTRIES = ["@fais/tzjc-comps"];

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
                let n: any = SYSCONFIG;
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

  const { imports, exports: ex, relations } = fileStats(fileContent);

  // console.log("Imports:", imports);
  // console.log("Exports:", ex);
  // console.log("Relations:", relations);

  /** 引入的API相关的变量列表 */
  const importedApi: (MemberRef & HasLoc & API)[] = [];

  /** API强相关的引入(直接定义接口用的, 例如fetch之类的) */
  const apiAlis: string[] = [];

  imports.forEach((v) => {
    if (API_ENTRIES.includes(v.source)) {
      apiAlis.push(v.alias);
    } else {
      if (v && v.name && v.alias) {
        importedApi.push({
          ...v,
          isApi: "unknown",
          urls: [],
        });
      }
    }
  });

  /** TODO: 判断API相关变量是否立即执行过 */

  if (ex.extends) {
    /** TODO: 处理Extends的部分 */
  }

  /** 用于记录计算过的APIurl列表 */
  const apiUrlMap: Map<string, string[]> = new Map();

  /** 最后导出给别的文件使用的 所有带有API的exports */
  const exportApi: (MemberRef & HasLoc & API)[] = [];

  ex.members.forEach((exportInstance) => {
    debug("start process export member: " + exportInstance.name);
    const res: MemberRef & HasLoc & API = {
      ...exportInstance,
      isApi: "unknown",
      urls: [],
    };

    const loop = (name: string) => {
      debug("start process export member-loop: " + name);
      const isVisited = apiUrlMap.get(name);
      let urls = apiUrlMap.get(name) || [];
      if (isVisited) {
        if (urls.length) {
          res.isApi = true;
          res.urls = res.urls.concat(urls);
        }
        return urls;
      }

      apiUrlMap.set(name, urls);

      /** 直接导出了Fetch之类的方法 不做处理(正常应该不会这样才对...) */
      if (apiAlis.includes(name)) {
        apiUrlMap.set(name, urls);
        return [];
      }

      /** 如果用到了从其他文件引入的「带API的属性」,记录下来 */
      const ipt = importedApi.find((v) => v.name === name);
      if (ipt) {
        urls = urls.concat(ipt.urls);
        apiUrlMap.set(name, urls);
        return urls;
      }

      /** 查找对应关系 */
      if (relations[name]) {
        relations[name].forEach((v) => {
          /** 如果对应关系里是fetch之类的 */
          if (apiAlis.includes(v.name)) {
            /** 如果是局部变量(Member) */
            if ("nodes" in v) {
              const nodes = v.nodes;
              urls = urls.concat(
                nodes.flatMap((v) =>
                  extractUrlFromAPI(v, relations, fileContent)
                )
              );

              /** TODO:  如果是ImportBase */
            } else {
              /** */
            }
          } else {
            /** 不然则递归 */
            urls = urls.concat(loop(v.name));
          }
        });
      }

      if (urls.length) {
        res.isApi = true;
        res.urls = res.urls.concat(urls);
      }

      apiUrlMap.set(name, urls);
      return urls;
    };

    loop(exportInstance.name);

    if (res.isApi) {
      exportApi.push(res);
    }
  });

  store.exports.set(filename, exportApi);

  imports.forEach((v) => {
    const url = urlResolve(filename, v.source);

    if (url) {
      let singleImportedList = store.exports.get(url);
      if (!singleImportedList) {
        apiProcessor(url);
        singleImportedList = store.exports.get(url) || [];
      }

      const importedApi = singleImportedList.find((v) => v.alias === v.name);
      if (importedApi) {
        // importedList.push(importedApi);
      }
    }
  });
}
