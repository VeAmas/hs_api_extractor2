import { API, HasLoc, MemberRef } from "../types";

export default {
  base: "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/",
  exports: new Map() as Map<string, (MemberRef & HasLoc & API)[]>,
  sysconfig: {
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
  },
  exportMemberCallbacks: new Map() as Map<
    string,
    { source: string; fn: Function }[]
  >,
  /** 定义哪些入口的的文件可以当做API源 */
  apiEntries: [
    {
      source:
        "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/node_modules/@fais/tzjc-comps/index.js",
      name: "httpCamel",
    },
    {
      source:
        "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/node_modules/@fais/tzjc-comps/index.js",
      name: "httpUnderline",
    },
  ],
  result: new Map() as Map<string, (MemberRef & HasLoc & API)[]>,
};
