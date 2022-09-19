const path = require('path')
const { fileURLToPath } = require('url')
const { build } = require('esbuild')

//const filename = fileURLToPath(import.meta.url)
//const dirname = path.dirname(filename)


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
