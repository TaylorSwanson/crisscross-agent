// https://gist.github.com/NV/1396086

const extendObject = (base, object) => {
  let visited = [object];

  // http://en.wikipedia.org/wiki/Adjacency_list_model
  let set = [{
    value: base
  }];

  if (Array.isArray(object)) {
    base = [];
  }

  const _extend = (base, object) => {
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        let value = object[key];

        if (typeof value === 'object') {
          let index = visited.indexOf(value);

          if (index === -1) {
            visited.push(value);

            if (Array.isArray(value)) {
              let newBase = base[key] = [];
              set.push({
                up: base,
                value: newBase
              });
              _extend(newBase, value);
            } else {
              let newBase = base[key] = {};
              set.push({
                up: base,
                value: newBase
              });
              _extend(newBase, value);
            }
          } else {
            base[key] = set[index].value;
          }
        } else {
          if (Array.isArray(base)) {
            base.push(value);
          } else {
            base[key] = value;
          }
        }
      }
    }
  };

  _extend(base, object);

  return base;
};

const cloneObject = object => (Array.isArray(object))
                    ? extendObject([], object)
                    : extendObject({}, object);

module.exports = cloneObject;
