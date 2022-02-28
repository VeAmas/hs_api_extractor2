import "./polyfills";
// import fileStats from "./fileStats/index";
import apiProcessor from "./apiProcessor";
import urlResolve from "./apiProcessor/urlResolve";
import store from "./apiProcessor/store";

// var {
//   imports,
//   exports: ex,
//   relations,
// } = fileStats(fs.readFileSync("D:/Git/ast/test/customized.js", "utf-8"));

// const ex = apiProcessor("D:/Git/ast/test/template.vue");
const ex = apiProcessor(
  urlResolve(
    store.base,
    "/src/hsfundFuncanal/views/fais-indexcenter/templateManage"
  )
);

console.log(ex);

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

store.exports.forEach((v) => {
  console.log(v);
});
