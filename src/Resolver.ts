import { VersionRanges } from './VersionRanges'

export enum ResolutionType {
  Available = 'available',
  LoadFrom = 'load-from',
}

export type Resolution =
  | {
      type: ResolutionType.Available,
      id: string
    }
  | {
      type: ResolutionType.LoadFrom,
      url: string
    }

export interface Resolver {
  registerId(id: string): void;
  registerResolvedURL(url: string, id: string): void;
  resolve(request: string, parentId?: string, defaultPackageVersionRanges?: VersionRanges): Resolution;
}