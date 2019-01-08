'use strict';

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.UMDNoDeps = factory());
}(this, (function () { 'use strict';

return {
	name: 'umd-no-deps',
	areDependenciesAvailable: true,
}

})))