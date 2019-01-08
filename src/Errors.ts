export class PolestarError extends Error {
  constructor(...args) {
    super(...args)

    Object.setPrototypeOf(this, new.target.prototype)

    this.name = new.target.name

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

export class UnresolvableError extends PolestarError {
  request: string;
  fromModuleId: string;

  constructor(request: string, fromModuleId: string) {
    super(`Module "${request}" could not be resolved by require.resolve from module "${fromModuleId}".`)
    Object.setPrototypeOf(this, new.target.prototype)
    this.request = request
    this.fromModuleId = fromModuleId
  }
}

export class CyclicDependencyError extends PolestarError {
  request: string

  constructor(request: string) {
    super(`Module "${request}" can not be required from itself.`)
    this.request = request
  }
}
