//
//
//
// PRODUCTION BUILD //
//
//
//

import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import { terser } from 'rollup-plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import alias from '@rollup/plugin-alias'
import sizes from 'rollup-plugin-sizes'

import pkg from './package.json'

export default {
  input: pkg.source,
  treeshake: true,
  output: {
    inlineDynamicImports: true,
    dir: 'dist',
  },
  context: 'window',
  plugins: [
    postcss({
      minimize: true,
      extensions: ['.css'],
      inject: {
        insertAt: 'top',
      },
      config: {
        path: './postcss.config.cjs',
      },
    }),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    alias({
      entries: [
        { find: 'react-dom', replacement: 'preact/compat' },
        { find: 'react', replacement: 'preact/compat' },
      ]
    }),
    resolve({
      browser: true,
      mainFields: ['browser'],
    }),
    commonjs({
      strictRequires: true,
      transformMixedEsModules: true,
    }),
    terser({
      format: {
        comments: false,
        wrap_iife: true,
        ascii_only: true,
      },
      ecma: 6,
    }),
    sizes(),
  ],
}
