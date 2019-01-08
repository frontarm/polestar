import { valid, validRange, satisfies } from 'semver'
import { Resolver, ResolutionType } from './Resolver'

const NPMURLPattern = /^(?:npm:\/\/)?((?:@[\w\.\-]+\/)?\w[\w\.\-]+)(@[^\/]+)?(\/.*)?$/

export function splitNPMURL(url: string) {
  let loaders = extractLoaders(url)
  let requestWithoutLoaders = removeLoaders(url)
  let match = requestWithoutLoaders.match(NPMURLPattern)
  if (match) {
    let [_, name, version, pathname] = match
    return {
      loaders,
      name,
      version,
      pathname,
    }
  }
}

export class DefaultResolver implements Resolver {
  // Maps known URLs to their module id.
  knownURLs: { [url: string]: string } = {}

  // Records redirects due to extensions, checking index.js, the package.json's
  // `main` field, etc.
  npmPathRedirects: { [nameVersionPath: string]: string } = {}

  // For each package, store a list of versions that we have any ids for.
  npmKnownPackageVersions: { [packageName: string]: string[] } = {}

  // Keep track of version aliases of each package, so that if an alias is
  // referenced in multiple places, it can be immediately resolved to the
  // appropriate actual version.
  npmVersionAliases: { [versionAlias: string]: string } = {}

  // Keep track of the first used version for each package, and use that for all
  // subsequent bare references to the same package.
  npmDefaultVersions: { [packageName: string]: string } = {}

  registerId(id) {
    this.knownURLs[id] = id
  }

  // Register an id along with the URL that requested it, to speed up future
  // resolutions.
  registerResolvedURL(url, id) {
    this.knownURLs[url] = id

    let idNPMMatch = removeLoaders(id).match(NPMURLPattern)
    if (idNPMMatch) {
      let [_, name, version, path = ''] = idNPMMatch

      let urlNPMMatch = removeLoaders(url).match(NPMURLPattern)
      if (urlNPMMatch) {
        let urlNPMVersion = urlNPMMatch[2] || ''
        if (urlNPMVersion !== version) {
          // We've received an actual version in response to an alias or range.
          this.npmVersionAliases[urlNPMVersion] = version
        }

        let urlNPMPath = urlNPMMatch[3] || ''
        if (urlNPMPath !== path) {
          this.npmPathRedirects[name+version+urlNPMPath] = path
        }
      }

      // For each package, store a list of versions that we have any ids for,
      // so that we can match ranges against known versions.
      if (!this.npmKnownPackageVersions[name]) {
        this.npmKnownPackageVersions[name] = [version]
      }
      else {
        this.npmKnownPackageVersions[name].push(version)
      }
    }
  }

  // Either returns an { id } object containing a registered module id, or a
  // { url } object containing a URL that can be resolved to a module id/source
  // by the breadboard host.
  //
  // ids are all urls, but urls aren't necessarily ids.
  resolve(request, parentId, packageDependencies) {
    let url
    let loaders = extractLoaders(request)
    let requestWithoutLoaders = removeLoaders(request)

    let npmMatch = requestWithoutLoaders.match(NPMURLPattern)
    if (!npmMatch) {
      // It's not bare, so resolve the URL relative to the parent
      // and then try to match it against our npm pattern again.
      url = resolveIfNotPlainOrUrl(requestWithoutLoaders, parentId)
      npmMatch = url.match(NPMURLPattern)
    }
    
    let name, version, path
    if (npmMatch) {
      name = npmMatch[1]
      version = npmMatch[2]
      path = npmMatch[3] || ''
      
      // If we got no version or a version alias, try and match it to a
      // real version.
      if (!version) {
        let packageVersion = packageDependencies[name]
        if (packageVersion) {
          packageVersion = '@' + packageDependencies[name]
        }
        version = packageVersion || this.npmDefaultVersions[name] || '@latest'
      }
      if (this.npmVersionAliases[name+version]) {
        version = this.npmVersionAliases[name+version]
      }
      else if (!valid(version.slice(1))) {
        version = this.getKnownMatchingVersion(name, version) || version
      }

      // If this is the first time we've seen this package, store the version
      // we're using for future versionless references.
      if (!this.npmDefaultVersions[name]) {
        this.npmDefaultVersions[name] = version
      }

      path = this.npmPathRedirects[name+version+path] || path
      url = 'npm://'+name+version+path
    }

    // If we've seen this URL before, immediately return the corresponding id.
    let id = this.knownURLs[url]
    if (id) {
      return { type: ResolutionType.Available as ResolutionType.Available, id: loaders+id }
    }

    return { type: ResolutionType.LoadFrom as ResolutionType.LoadFrom, url: loaders+url }
  }

  private getKnownMatchingVersion(name, range) {
    let rangeWithoutSymbol = range.slice(1)
    if (validRange(rangeWithoutSymbol)) {
      let versions = this.npmKnownPackageVersions[name] || []
      for (let i = 0; i < versions.length; i++) {
        let version = versions[i]
        if (satisfies(version.slice(1), rangeWithoutSymbol)) {
          return version
        }
      }
    }
  }
}

/**
 * From system.js
 * Copyright (C) 2013-2018 Guy Bedford
 * https://github.com/systemjs/systemjs
 */
const backslashRegEx = /\\/g;
function resolveIfNotPlainOrUrl(relUrl, parentUrl) {
  if (relUrl.indexOf('://') >= 0) {
    return relUrl
  }
  if (relUrl.indexOf('\\') !== -1)
    relUrl = relUrl.replace(backslashRegEx, '/');
  // protocol-relative
  if (relUrl[0] === '/' && relUrl[1] === '/') {
    return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
  }
  // relative-url
  else if (relUrl[0] === '.' && (relUrl[1] === '/' || relUrl[1] === '.' && (relUrl[2] === '/' || relUrl.length === 2 && (relUrl += '/')) ||
      relUrl.length === 1  && (relUrl += '/')) ||
      relUrl[0] === '/') {
    const parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
    // Disabled, but these cases will give inconsistent results for deep backtracking
    //if (parentUrl[parentProtocol.length] !== '/')
    //  throw new Error('Cannot resolve');
    // read pathname from parent URL
    // pathname taken to be part after leading "/"
    let pathname;
    if (parentUrl[parentProtocol.length + 1] === '/') {
      // resolving to a :// so we need to read out the auth and host
      if (parentProtocol !== 'file:') {
        pathname = parentUrl.slice(parentProtocol.length + 2);
        pathname = pathname.slice(pathname.indexOf('/') + 1);
      }
      else {
        pathname = parentUrl.slice(8);
      }
    }
    else {
      // resolving to :/ so pathname is the /... part
      pathname = parentUrl.slice(parentProtocol.length + (parentUrl[parentProtocol.length] === '/'));
    }

    if (relUrl[0] === '/')
      return parentUrl.slice(0, parentUrl.length - pathname.length - 1) + relUrl;

    // join together and split for removal of .. and . segments
    // looping the string instead of anything fancy for perf reasons
    // '../../../../../z' resolved to 'x/y' is just 'z'
    const segmented = pathname.slice(0, pathname.lastIndexOf('/') + 1) + relUrl;

    const output = [];
    let segmentIndex = -1;
    for (let i = 0; i < segmented.length; i++) {
      // busy reading a segment - only terminate on '/'
      if (segmentIndex !== -1) {
        if (segmented[i] === '/') {
          output.push(segmented.slice(segmentIndex, i + 1));
          segmentIndex = -1;
        }
      }

      // new segment - check if it is relative
      else if (segmented[i] === '.') {
        // ../ segment
        if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
          output.pop();
          i += 2;
        }
        // ./ segment
        else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
          i += 1;
        }
        else {
          // the start of a new segment as below
          segmentIndex = i;
        }
      }
      // it is the start of a new segment
      else {
        segmentIndex = i;
      }
    }
    // finish reading out the last segment
    if (segmentIndex !== -1)
      output.push(segmented.slice(segmentIndex));
    return parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('');
  }
}

function extractLoaders(url) {
  let match = url.match(/^(.*!)*/)
  return match ? match[0] : ''
}

function removeLoaders(url) {
  return url.replace(/^(.*!)*/, '')
}