import apiProcessor from ".";
import { Import } from "../types";
import store from "./store";
import urlResolve from "./urlResolve";

export default function ({
  filename,
  imports,
}: {
  filename: string;
  imports: Import[];
}) {
  imports.forEach((v) => {
    const url = urlResolve(filename, v.name.replace("#default", ""));
    apiProcessor(url);
    const exports = store.exports.get(url ?? "");
    exports && store.result.set(v.alias, exports);
  });
}
