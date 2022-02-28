import store from "./store";
import path from "path";
import fs from "fs";

const alis = {
  "@biz": path.resolve(store.base, "src"),
  "@hsfundFuncanal": path.resolve(store.base, "src/hsfundFuncanal"),
};

// export default (url: string, baseUrl: string) => {
//   for (const key in alis) {
//     url = url.replace(new RegExp("^" + key), alis[key]);
//   }

//   return path.join(baseUrl, url);
// };

/**
 * 处理引用文件的路径
 */
export default function handleUrl(baseFileUrl: string, offset: string) {
  baseFileUrl = baseFileUrl.replace(/\\/g, "/").trim();
  offset = offset.trim();
  const baseDir = (baseFileUrl.match(/(^.*\/)[^/]*$/) || ["", ""])[1] || "";

  const alias = Object.keys(alis).find((key) =>
    new RegExp("^" + key).test(offset)
  );
  const perfix = (offset.match(/([^/]*)\//) || [])[1] || "";
  // const rest = offset.substring(alias.length + 1);

  let dir = "";

  if (
    /** 有alias */
    alias
  ) {
    dir = offset.replace(new RegExp("^" + alias), alis[alias]);

    /** 根目录 */
  } else if (offset[0] === "/") {
    dir = path.resolve(store.base, offset.substring(1));

    /** 相对定位 */
  } else if (perfix === "." || perfix === "..") {
    dir = path.resolve(baseDir, offset);

    /** node_modules */
  } else {
    /** TODO: node_modules */
  }

  dir = dir.replace(/\\/g, "/");

  let dirMatched = false;
  const dirVue = dir + ".vue";
  const dirJs = dir + ".js";

  const state = fs.existsSync(dir) && fs.statSync(dir);
  if (state && state.isFile()) {
    return dir;
  } else if (state && state.isDirectory()) {
    dirMatched = true;
  }
  const stateJs = fs.existsSync(dirJs) && fs.statSync(dirJs);
  const stateVue = fs.existsSync(dirVue) && fs.statSync(dirVue);

  if (stateJs && stateJs.isFile()) {
    return dirJs;
  }
  if (stateVue && stateVue.isFile()) {
    return dirVue;
  }

  if (dirMatched) {
    const dirIndexJs = dir + "/index.js";
    const dirIndexVue = dir + "/index.vue";

    const stateIndexJs = fs.existsSync(dirIndexJs) && fs.statSync(dirIndexJs);
    const stateIndexVue =
      fs.existsSync(dirIndexVue) && fs.statSync(dirIndexVue);

    if (stateIndexJs && stateIndexJs.isFile()) {
      return dirIndexJs;
    }
    if (stateIndexVue && stateIndexVue.isFile()) {
      return dirIndexVue;
    }
  }
}
