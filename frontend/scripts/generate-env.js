// Runs at container start (prestart) — writes runtime env vars into dist/env.js
// so the built SPA can read them without needing build-time variables.
const fs = require('fs')
const path = require('path')

const env = {
  VITE_API_URL: process.env.VITE_API_URL || '',
}

const contents = `window.__env = ${JSON.stringify(env)};`

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'env.js'), contents)
console.log('Generated dist/env.js:', env)
