export default (code: string) => {
  const script = code.match(/(\n|^)<script[\s\S]*\n<\/script>/g)?.[0] ?? "";
  return script.replace(/<script[^>]*>/, "").replace(/<\/script>$/, "");
};
