'use strict';

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require(exports, 'umd-no-deps')) :
	typeof define === 'function' && define.amd ? define(['exports', 'umd-no-deps'], factory) :
	(factory((global.UMDWithDepsAndExports = {}),global.UMDNoDeps));
}(this, (function (exports, UMDNoDeps) { 'use strict';

exports.name = 'umd-with-deps-and-exports'
exports.areDependenciesAvailable =
	UMDNoDeps.areDependenciesAvailable &&
	UMDNoDeps.name === 'umd-no-deps'

})))