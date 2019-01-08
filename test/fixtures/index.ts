import * as fs from 'fs-extra'
import { join } from 'path'
import { Fetcher, FetchMeta, FetchResult, splitNPMURL } from '../../src'

export async function testFetcher(url: string, meta: FetchMeta): Promise<FetchResult> {
  let { name, version, pathname } = splitNPMURL(url)

  if (version === '@latest' || version === '@^1.0.0') {
    version = '@1.0.0'
  }
  if (!pathname) {
    pathname = '/index.js'
  }

  let id = 'npm://'+name+version+pathname

  let pkg = require(join(__dirname, name, 'package.json'))
  let sourcePathname = require.resolve(join(__dirname, name, pathname))
  let code = await fs.readFile(sourcePathname, 'utf8')

  let dependencies
  if (sourcePathname.indexOf('umd') >= 0) {
    dependencies = 'umd'
  }
  else {
    dependencies = pkg.pathDependencies[pathname]
  }

  return {
    id,
    url,
    code,
    dependencies,
    dependencyVersionRanges: pkg.dependencies,
  }
}
