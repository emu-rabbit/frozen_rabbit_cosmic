import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const policy = read('native/craft-kernel/src/generic_solver.rs')
  .match(/pub const GENERIC_EXTERNAL_REFERENCE_POLICY_VERSION: &str =\s*"([^"]+)";/)?.[1]
if (!policy) throw new Error('Missing adopted policy')
const version = policy.split('-v').at(-1)
if (version !== '2.3.0') throw new Error('Review the migration contract before packaging another solver version')
const out = path.join(root, 'dist', `main-solver-v${version}`)
if (fs.existsSync(out)) throw new Error(`Package already exists: ${out}`)
const wasm = fs.readFileSync(path.join(root, 'apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm'))
if (!wasm.includes(Buffer.from(policy))) throw new Error('Build the current production WASM first')
fs.mkdirSync(out, { recursive: true })
const copy = p => fs.cpSync(path.join(root, p), path.join(out, p), { recursive: true })
for (const name of ['craft-kernel', 'craft-kernel-web']) {
  for (const entry of ['src', 'Cargo.toml', 'Cargo.lock', 'build.rs', 'README.md', 'examples', 'tests']) {
    const p = `native/${name}/${entry}`
    if (fs.existsSync(path.join(root, p))) copy(p)
  }
}
for (const p of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) copy(p)
fs.writeFileSync(path.join(out, 'frozen_rabbit_craft_kernel_web.wasm'), wasm)
fs.writeFileSync(path.join(out, 'INTEGRATION.md'), read('native/craft-kernel/README.md')
  .replaceAll('(examples/main_solver.rs)', '(native/craft-kernel/examples/main_solver.rs)')
  .replaceAll('(../../LICENSE)', '(LICENSE)')
  .replaceAll('(../../THIRD_PARTY_NOTICES.md)', '(THIRD_PARTY_NOTICES.md)'))
const files = {}
function inventory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const p = path.join(directory, entry.name)
    if (entry.isDirectory()) inventory(p)
    else files[path.relative(out, p).replaceAll('\\', '/')] = createHash('sha256').update(fs.readFileSync(p)).digest('hex')
  }
}
inventory(out)
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({
  policyVersion: policy,
  rustApiVersion: 'frozen-rabbit-main-solver-api-v1',
  wasmAbiVersion: 'rust-web-planner-abi-v1',
  packageVersion: '0.1.0',
  interfaceChanges: false,
  integrationGuide: 'native/craft-kernel/README.md',
  migration: 'Update Rust library and rebuild. Existing WASM callers must replace the module AND expected/request policy string. Start a new session. No DTO or export changes.',
  publication: 'Local source snapshot and production WASM, not a published tag or registry release.',
  sha256: files,
}, null, 2) + '\n')
console.log(`Prepared ${out} (${Object.keys(files).length} files)`)
