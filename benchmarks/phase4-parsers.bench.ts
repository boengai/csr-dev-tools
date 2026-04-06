import { bench, describe } from 'vitest'

// ---------------------------------------------------------------------------
// XML Benchmarks
// ---------------------------------------------------------------------------

const smallXml = `<?xml version="1.0"?>
<users>
${Array.from({ length: 10 }, (_, i) => `  <user id="${i}"><name>user${i}</name><email>user${i}@test.com</email></user>`).join('\n')}
</users>`

const largeXml = `<?xml version="1.0"?>
<users>
${Array.from({ length: 5_000 }, (_, i) => `  <user id="${i}"><name>user${i}</name><email>user${i}@test.com</email><active>${i % 2 === 0}</active></user>`).join('\n')}
</users>`

describe('XML: xmlToJson (10 nodes)', () => {
  bench('WASM csr-parsers', async () => {
    const { xmlToJson } = await import('../src/wasm/csr-parsers')
    await xmlToJson(smallXml)
  })
})

describe('XML: xmlToJson (5,000 nodes)', () => {
  bench('WASM csr-parsers', async () => {
    const { xmlToJson } = await import('../src/wasm/csr-parsers')
    await xmlToJson(largeXml)
  })
})

const smallJsonForXml = JSON.stringify({
  users: {
    user: Array.from({ length: 10 }, (_, i) => ({ '@id': i, name: `user${i}`, email: `user${i}@test.com` })),
  },
})

describe('XML: jsonToXml (10 nodes)', () => {
  bench('WASM csr-parsers', async () => {
    const { jsonToXml } = await import('../src/wasm/csr-parsers')
    await jsonToXml(smallJsonForXml)
  })
})

// ---------------------------------------------------------------------------
// YAML Benchmarks
// ---------------------------------------------------------------------------

const smallYaml = Array.from(
  { length: 10 },
  (_, i) => `- id: ${i}\n  name: user${i}\n  email: user${i}@test.com`,
).join('\n')

const largeYaml = Array.from(
  { length: 5_000 },
  (_, i) => `- id: ${i}\n  name: user${i}\n  email: user${i}@test.com\n  active: ${i % 2 === 0}`,
).join('\n')

describe('YAML: yamlToJson (10 items)', () => {
  bench('WASM csr-parsers', async () => {
    const { yamlToJson } = await import('../src/wasm/csr-parsers')
    await yamlToJson(smallYaml)
  })
})

describe('YAML: yamlToJson (5,000 items)', () => {
  bench('WASM csr-parsers', async () => {
    const { yamlToJson } = await import('../src/wasm/csr-parsers')
    await yamlToJson(largeYaml)
  })
})

const smallJsonForYaml = JSON.stringify(
  Array.from({ length: 10 }, (_, i) => ({ id: i, name: `user${i}`, email: `user${i}@test.com` })),
)

describe('YAML: jsonToYaml (10 items)', () => {
  bench('WASM csr-parsers', async () => {
    const { jsonToYaml } = await import('../src/wasm/csr-parsers')
    await jsonToYaml(smallJsonForYaml)
  })
})

describe('YAML: formatYaml (5,000 items)', () => {
  bench('WASM csr-parsers', async () => {
    const { formatYaml } = await import('../src/wasm/csr-parsers')
    await formatYaml(largeYaml, { indent: 2, sortKeys: true })
  })
})

// ---------------------------------------------------------------------------
// TOML Benchmarks
// ---------------------------------------------------------------------------

const smallToml = `[package]
name = "test"
version = "1.0.0"

${Array.from({ length: 10 }, (_, i) => `[deps.dep${i}]\nversion = "${i}.0.0"\nfeatures = ["feat${i}"]`).join('\n\n')}`

const largeToml = `[package]
name = "test"
version = "1.0.0"

${Array.from({ length: 1_000 }, (_, i) => `[deps.dep${i}]\nversion = "${i}.0.0"\nfeatures = ["feat${i}"]`).join('\n\n')}`

describe('TOML: tomlToJson (small)', () => {
  bench('WASM csr-parsers', async () => {
    const { tomlToJson } = await import('../src/wasm/csr-parsers')
    await tomlToJson(smallToml)
  })
})

describe('TOML: tomlToJson (1,000 sections)', () => {
  bench('WASM csr-parsers', async () => {
    const { tomlToJson } = await import('../src/wasm/csr-parsers')
    await tomlToJson(largeToml)
  })
})

const smallJsonForToml = JSON.stringify({
  package: { name: 'test', version: '1.0.0' },
  deps: Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [`dep${i}`, { version: `${i}.0.0`, features: [`feat${i}`] }]),
  ),
})

describe('TOML: jsonToToml (small)', () => {
  bench('WASM csr-parsers', async () => {
    const { jsonToToml } = await import('../src/wasm/csr-parsers')
    await jsonToToml(smallJsonForToml)
  })
})

// ---------------------------------------------------------------------------
// Protobuf Schema Benchmarks
// ---------------------------------------------------------------------------

const smallProtoSchema = `syntax = "proto3";
message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
}`

const largeProtoSchema = `syntax = "proto3";
${Array.from({ length: 50 }, (_, i) => `message Message${i} {\n  int32 id = 1;\n  string name = 2;\n  string data = 3;\n  bool active = 4;\n  repeated string tags = 5;\n}`).join('\n\n')}`

describe('Protobuf: parseSchema (small)', () => {
  bench('WASM csr-parsers', async () => {
    const { parseProtobufSchema } = await import('../src/wasm/csr-parsers')
    await parseProtobufSchema(smallProtoSchema)
  })
})

describe('Protobuf: parseSchema (50 messages)', () => {
  bench('WASM csr-parsers', async () => {
    const { parseProtobufSchema } = await import('../src/wasm/csr-parsers')
    await parseProtobufSchema(largeProtoSchema)
  })
})
