const { build } = require('esbuild')

build({
  tsconfig: './tsconfig.extension.json',
  bundle: true,
  sourcemap: true,
  format: 'esm',
  target: 'esnext',
  external: ['__STATIC_CONTENT_MANIFEST'],
  conditions: ['worker', 'browser'],
  entryPoints: ['./src/background.ts'],
  outdir: './dist',
  outExtension: { '.js': '.mjs' },
  loader: {
    '.inject': 'text',
  },
})
.then(() => console.log('ESBuild done'))
.catch(err => {
  console.error(err)
  process.exitCode = 1
})
