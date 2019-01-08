let nameA = require('./cjs-cyclical-a').name
let nameB = require('./cjs-cyclical-b').name

module.exports = {
  name: 'cjs-cyclical',
  areDependenciesAvailable:
    nameA === 'cjs-cyclical-a' &&
    nameB === 'cjs-cyclical-b'
}