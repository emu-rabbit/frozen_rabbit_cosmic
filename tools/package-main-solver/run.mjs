import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const mainSource = read('native/craft-kernel/src/main_solver.rs')
const policyConstant = mainSource.match(/pub const MAIN_SOLVER_POLICY_VERSION: &str = (\w+);/)?.[1]
if (!policyConstant) throw new Error('Missing public policy binding')
const policy = read('native/craft-kernel/src/generic_solver.rs')
  .match(new RegExp(`pub const ${policyConstant}: &str =\\s*"([^"]+)";`))?.[1]
if (!policy) throw new Error('Missing adopted policy')
const version = policy.split('-v').at(-1)
if (version !== '2.4.0') throw new Error('Review the migration contract before packaging another solver version')
const rustApiVersion = mainSource.match(/pub const MAIN_SOLVER_API_VERSION: &str = "([^"]+)";/)?.[1]
const wasmAbiVersion = read('native/craft-kernel/src/web_bridge.rs')
  .match(/pub const WEB_PLANNER_ABI_VERSION: &str = "([^"]+)";/)?.[1]
if (!rustApiVersion || !wasmAbiVersion) throw new Error('Missing public interface identity')
const out = path.join(root, 'dist', `main-solver-v${version}`)
if (fs.existsSync(out)) throw new Error(`Package already exists: ${out}`)
const wasm = fs.readFileSync(path.join(root, 'apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm'))
if (!wasm.includes(Buffer.from(policy))) throw new Error('Build the current production WASM first')
if (!wasm.includes(Buffer.from(wasmAbiVersion))) throw new Error('WASM ABI does not match the public interface')
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
  rustApiVersion,
  wasmAbiVersion,
  packageVersion: '0.1.0',
  interfaceChanges: true,
  integrationGuide: 'native/craft-kernel/README.md',
  migration: 'Update the Rust library and rebuild. Existing recommend(state) calls remain valid; recommend_with_options accepts an optional per-craft time budget. Replace WASM together with the expected ABI and request policy. Session exports add optional timing metadata. Start a new session.',
  publication: 'Local source snapshot and production WASM, not a published tag or registry release.',
  sha256: files,
}, null, 2) + '\n')
console.log(`Prepared ${out} (${Object.keys(files).length} files)`)
