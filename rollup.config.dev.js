//
//
//
// DEVELOPMENT BUILD //
//
//
//

import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import resolve from '@rollup/plugin-node-resolve'
import alias from '@rollup/plugin-alias'

import pkg from './package.json'

export default {
  input: pkg.source,
  treeshake: false,
  perf: true,
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
  ],
}
