/**
 * This is based on the rollup config from Redux
 * Copyright (c) 2015-present Dan Abramov
 */

import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const env = process.env.NODE_ENV
const format = process.env.FORMAT

const config = {
  input: 'src/index.ts',
  output: {
    file:
      format === 'es' ? 'dist/es/polestar.js' : 
      env === 'production' ? 'dist/umd/polestar.min.js' :
      'dist/umd/polestar.js',
    format: format,
    name: 'Polestar',
    sourcemap: true,
  },
  external: format === 'umd' ? [] : ['semver'],
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs(),
    format === 'umd' && replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    typescript({
      abortOnError: env === 'production',
      module: 'ESNext',
    })
  ].filter(x => !!x),
}

if (env === 'production') {
  config.plugins.push(
    terser()
  )
}

export default config