// @ts-nocheck

if (!Object.fromEntries) {
  Object.fromEntries = function fromEntries(iterable) {
    return [...iterable].reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {});
  };
}

if (!Array.prototype.flat) {
  Array.prototype.flat = function flat() {
    var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

    return depth
      ? Array.prototype.reduce.call(
          this,
          function (acc, cur) {
            if (Array.isArray(cur)) {
              acc.push.apply(acc, flat.call(cur, depth - 1));
            } else {
              acc.push(cur);
            }

            return acc;
          },
          []
        )
      : Array.prototype.slice.call(this);
  };
}

if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function flatMap(callback) {
    return Array.prototype.map.apply(this, arguments).flat();
  };
}
