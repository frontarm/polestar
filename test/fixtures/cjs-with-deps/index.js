let a = require('cjs-no-deps')
let b = require('umd-with-deps-and-exports')

module.exports = {
  name: 'cjs-with-deps',
  areDependenciesAvailable:
    a.name === 'cjs-no-deps' &&
    a.areDependenciesAvailable &&
    b.name === 'umd-with-deps-and-exports' &&
    b.areDependenciesAvailable
}