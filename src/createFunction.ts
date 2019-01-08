let nextScriptId = 1
let scriptIdPrefix = Math.random().toString(36).slice(2)

const __polestar_script__: any = (id: string, fn: Function) => {
  __polestar_script__[id] = fn
}

if (!window['__polestar_script__']) {
  window['__polestar_script__'] = __polestar_script__
}
else {
  throw new Error("Cannot load multiple copies of Polestar.")
}

// Running code with `eval` will cause some errors messages to be hidden from
// the script due to Chrome treating them as originating from another origin.
// Evaluating code by running it in script tags is supposedly slower, but
// allows errors to be properly forwarded to non-native consoles.
export function createFunction(argNames, source) {
  let scriptId = scriptIdPrefix + '/' + nextScriptId++
  let script = document.createElement('script')
  script.innerHTML =
    `(function(){__polestar_script__(${JSON.stringify(scriptId)}, function module(${argNames.join(',')}) {`+
      source+
    `\n})})()`;

  // Script tags with inline source are synchronously executed when appended
  // to the document body.
  document.body.appendChild(script)
  let result = __polestar_script__[scriptId]
  delete __polestar_script__[scriptId]
  document.body.removeChild(script)
  return result
}