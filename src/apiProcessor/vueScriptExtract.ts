import xmldom from "xmldom";

/**
 * 现在用xmldom提取script标签里的内容
 * 这个好像比较慢
 * 如果可以用正则的话 最好能用正则吧
 */
const DOMParser = new xmldom.DOMParser({
  errorHandler() {
    /** */
  },
});

export default (code: string) => {
  const document = DOMParser.parseFromString(code);

  const script = document.getElementsByTagName("script")[0];
  return script.textContent || "";
};
