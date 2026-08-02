const mod = require('./dist/cjs/index.js');
module.exports = mod.default;
// Attach named exports (enums, errors, etc.) as properties so TypeScript
// interop (__importStar) and destructured require() can access them.
Object.keys(mod).forEach((key) => {
  if (key !== 'default' && key !== '__esModule') {
    module.exports[key] = mod[key];
  }
});
