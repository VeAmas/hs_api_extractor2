import "./polyfills";
// import fileStats from "./fileStats/index";
import apiProcessor from "./apiProcessor";
import urlResolve from "./apiProcessor/urlResolve";
import store from "./apiProcessor/store";

import fs from "fs";
import path from "path";

// var {
//   imports,
//   exports: ex,
//   relations,
// } = fileStats(fs.readFileSync("D:/Git/ast/test/customized.js", "utf-8"));

// const ex = apiProcessor("D:/Git/ast/test/template.vue");
// const ex =

const filename =
  // "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/views/fais-indexcenter/indexDoc/index.vue";
  // "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/views/fais-indexcenter/viewList/index.vue";
"D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/views/fais-standardize/components/QueryComponents/FaisAggregationTree/index.vue";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/node_modules/@fais/tzjc-comps/FaisRuleSet/index.vue";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/views/fais-indexcenter/viewList/part/viewOperate/index.vue";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/components/PortTree/part/search.vue";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/views/fais-personalize/portTrial/staticPortTrial/test.vue";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/api/httpFetch.js";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/api/index.js"
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/api/modules/indexcenter/index.js";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/api/modules/indexcenter/main.js";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/api/modules/customized/index.js"
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/router/modules/indexcenter.js";
// "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/index.js";

apiProcessor(
  urlResolve(
    // store.base,
    filename
    // "/src/hsfundFuncanal/views/fais-indexcenter/templateManage"
    // "/src/hsfundFuncanal/api/modules/personalize/index.js"
  )
);

// console.log(ex);

// console.log("Imports:", imports);
// console.log("Exports:", ex);
// console.log("Relations:", relations);

// const api = {
//   imports,
//   ex,
//   relations,
// };

// console.log(
//   urlResolve(
//     "D:/Git/rpas/FAIS2-0-RISK-RPAS/risk-rpas-basic/risk-rpas-basic-ui/src/hsfundFuncanal/views/fais-indexcenter/templateManage",
//     "@hsfundFuncanal/api/index"
//   )
// );

console.log(store.exports.get(filename));

if (false) {
  let outputString = "menuId,url\r\n";

  store.result.forEach((v, menuId) => {
    v.forEach((api) =>
      api.urls.forEach((url) => {
        outputString += menuId + "," + url + "\r\n";
      })
    );
  });

  fs.writeFileSync(path.resolve(__dirname, "./output.csv"), outputString);
}
