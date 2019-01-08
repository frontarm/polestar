import { VersionRanges } from './VersionRanges'

export type Fetcher = (url: string, meta: FetchMeta) => Promise<FetchResult>

export interface FetchMeta {
  requiredById: string,
  originalRequest: string
}

export interface FetchResult {
  id: string,
  url: string,

  // Should already include any source map / source url
  code: string, 

  // Things that can be required by the module (as specified in require() statements)
  // If the string 'umd' is specified, the module will be treated as a umd module,
  // and it's dependencies will be loaded.
  // If undefined, a `require` function will not be made available.
  dependencies?: 'umd' | string[], 

  // Hints for what versions required dependencies should resolve to
  dependencyVersionRanges?: VersionRanges,

  // If provided, these styles will be added along with the module.
  css?: string
}