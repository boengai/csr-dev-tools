import { describe, expect, it } from 'vitest'

import { generateSampleJson, parseProtobufSchema } from '@/utils/protobuf-to-json'

const SAMPLE_PROTO = `
syntax = "proto3";

package example;

message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
  repeated string tags = 4;
  Address address = 5;
  Status status = 6;
  map<string, string> metadata = 7;

  enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    INACTIVE = 2;
  }
}

message Address {
  string street = 1;
  string city = 2;
  string zip_code = 3;
  string country = 4;
}

message Order {
  string order_id = 1;
  Person customer = 2;
  repeated OrderItem items = 3;
  double total = 4;
  int64 created_at = 5;
}

message OrderItem {
  string product_name = 1;
  int32 quantity = 2;
  float price = 3;
}

enum PaymentMethod {
  CREDIT_CARD = 0;
  DEBIT_CARD = 1;
  PAYPAL = 2;
  CRYPTO = 3;
}
`

describe('protobuf-to-json', () => {
  describe('parseProtobufSchema', () => {
    it('parses valid proto3 schema with messages, enums, and nested types', () => {
      const result = parseProtobufSchema(SAMPLE_PROTO)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.schema.package).toBe('example')
      expect(result.schema.syntax).toBe('proto3')
      expect(result.schema.messages).toHaveLength(4)
      expect(result.schema.enums).toHaveLength(1)
    })

    it('returns error for invalid proto syntax', () => {
      const result = parseProtobufSchema('message { invalid }')

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error).toBeTruthy()
    })

    it('returns error with line number for syntax errors', () => {
      const invalidProto = `syntax = "proto3";

message Test {
  string name = 1;
  invalid_syntax here;
}`
      const result = parseProtobufSchema(invalidProto)

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error).toBeTruthy()
      expect(result.line).toBeTypeOf('number')
    })

    it('returns error for empty string', () => {
      const result = parseProtobufSchema('')

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error).toContain('Empty input')
      expect(result.line).toBeNull()
    })

    it('returns error for whitespace-only string', () => {
      const result = parseProtobufSchema('   \n\n  ')

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error).toContain('Empty input')
    })

    it('extracts fields with correct types, rules, and ids', () => {
      const result = parseProtobufSchema(SAMPLE_PROTO)

      expect(result.success).toBe(true)
      if (!result.success) return

      const person = result.schema.messages.find((m) => m.name === 'Person')
      expect(person).toBeDefined()
      if (!person) return

      const nameField = person.fields.find((f) => f.name === 'name')
      expect(nameField).toMatchObject({
        id: 1,
        isMap: false,
        name: 'name',
        resolvedKind: 'scalar',
        type: 'string',
      })

      const tagsField = person.fields.find((f) => f.name === 'tags')
      expect(tagsField).toMatchObject({
        id: 4,
        name: 'tags',
        rule: 'repeated',
        type: 'string',
      })

      const metadataField = person.fields.find((f) => f.name === 'metadata')
      expect(metadataField).toMatchObject({
        isMap: true,
        name: 'metadata',
      })
    })

    it('extracts enum values correctly', () => {
      const result = parseProtobufSchema(SAMPLE_PROTO)

      expect(result.success).toBe(true)
      if (!result.success) return

      const paymentMethod = result.schema.enums.find((e) => e.name === 'PaymentMethod')
      expect(paymentMethod).toBeDefined()
      if (!paymentMethod) return

      expect(paymentMethod.values).toEqual({
        CREDIT_CARD: 0,
        CRYPTO: 3,
        DEBIT_CARD: 1,
        PAYPAL: 2,
      })
    })

    it('handles nested messages within messages', () => {
      const result = parseProtobufSchema(SAMPLE_PROTO)

      expect(result.success).toBe(true)
      if (!result.success) return

      const person = result.schema.messages.find((m) => m.name === 'Person')
      expect(person).toBeDefined()
      if (!person) return

      expect(person.nestedEnums).toHaveLength(1)
      expect(person.nestedEnums[0].name).toBe('Status')
    })

    it('handles oneof groups', () => {
      const protoWithOneof = `
syntax = "proto3";
message TestMessage {
  oneof test_oneof {
    string name = 1;
    int32 id = 2;
  }
  string other = 3;
}
`
      const result = parseProtobufSchema(protoWithOneof)

      expect(result.success).toBe(true)
      if (!result.success) return

      const msg = result.schema.messages[0]
      expect(msg.oneofs).toHaveLength(1)
      expect(msg.oneofs[0].name).toBe('testOneof')
      expect(msg.oneofs[0].fieldNames).toContain('name')
      expect(msg.oneofs[0].fieldNames).toContain('id')
    })

    it('handles map fields', () => {
      const protoWithMap = `
syntax = "proto3";
message TestMessage {
  map<string, int32> scores = 1;
  map<int32, string> labels = 2;
}
`
      const result = parseProtobufSchema(protoWithMap)

      expect(result.success).toBe(true)
      if (!result.success) return

      const msg = result.schema.messages[0]
      const scoresField = msg.fields.find((f) => f.name === 'scores')
      expect(scoresField?.isMap).toBe(true)

      const labelsField = msg.fields.find((f) => f.name === 'labels')
      expect(labelsField?.isMap).toBe(true)
    })

    it('parses proto2 syntax correctly', () => {
      const proto2 = `
syntax = "proto2";
message LegacyMessage {
  required string name = 1;
  optional int32 age = 2;
  repeated string tags = 3;
}
`
      const result = parseProtobufSchema(proto2)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.schema.syntax).toBe('proto2')
      expect(result.schema.messages).toHaveLength(1)

      const msg = result.schema.messages[0]
      const nameField = msg.fields.find((f) => f.name === 'name')
      expect(nameField?.rule).toBe('required')

      const ageField = msg.fields.find((f) => f.name === 'age')
      expect(ageField?.rule).toBe('optional')
    })

    it('extracts package name', () => {
      const result = parseProtobufSchema(SAMPLE_PROTO)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.schema.package).toBe('example')
    })

    it('handles proto without package', () => {
      const noPackage = `
syntax = "proto3";
message Simple {
  string value = 1;
}
`
      const result = parseProtobufSchema(noPackage)

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.schema.package).toBeNull()
    })
  })

  describe('generateSampleJson', () => {
    function getParsedSchema() {
      const result = parseProtobufSchema(SAMPLE_PROTO)
      if (!result.success) throw new Error('Failed to parse sample proto')
      return result.schema
    }

    it('generates correct defaults for all scalar types', () => {
      const allScalars = `
syntax = "proto3";
message AllScalars {
  string s = 1;
  bool b = 2;
  int32 i32 = 3;
  int64 i64 = 4;
  uint32 u32 = 5;
  uint64 u64 = 6;
  sint32 si32 = 7;
  sint64 si64 = 8;
  fixed32 f32 = 9;
  fixed64 f64 = 10;
  sfixed32 sf32 = 11;
  sfixed64 sf64 = 12;
  float fl = 13;
  double db = 14;
  bytes bt = 15;
}
`
      const result = parseProtobufSchema(allScalars)
      if (!result.success) throw new Error('Parse failed')

      const msg = result.schema.messages[0]
      const json = generateSampleJson(msg, result.schema.messages, result.schema.enums)

      expect(json).toEqual({
        b: false,
        bt: '',
        db: 0,
        f32: 0,
        f64: '0',
        fl: 0,
        i32: 0,
        i64: '0',
        s: '',
        sf32: 0,
        sf64: '0',
        si32: 0,
        si64: '0',
        u32: 0,
        u64: '0',
      })
    })

    it('generates nested object for message field', () => {
      const schema = getParsedSchema()
      const order = schema.messages.find((m) => m.name === 'Order')!
      const json = generateSampleJson(order, schema.messages, schema.enums)

      expect(json.customer).toEqual(
        expect.objectContaining({
          active: false,
          age: 0,
          name: '',
        }),
      )
      expect((json.customer as Record<string, unknown>).address).toEqual(
        expect.objectContaining({
          city: '',
          country: '',
          street: '',
        }),
      )
    })

    it('generates array for repeated field', () => {
      const schema = getParsedSchema()
      const person = schema.messages.find((m) => m.name === 'Person')!
      const json = generateSampleJson(person, schema.messages, schema.enums)

      expect(json.tags).toEqual([''])
    })

    it('generates array of objects for repeated message field', () => {
      const schema = getParsedSchema()
      const order = schema.messages.find((m) => m.name === 'Order')!
      const json = generateSampleJson(order, schema.messages, schema.enums)

      expect(json.items).toEqual([
        {
          price: 0,
          productName: '',
          quantity: 0,
        },
      ])
    })

    it('uses first enum value name for enum fields', () => {
      const schema = getParsedSchema()
      const person = schema.messages.find((m) => m.name === 'Person')!
      const json = generateSampleJson(person, schema.messages, schema.enums)

      expect(json.status).toBe('UNKNOWN')
    })

    it('handles self-referencing message with cycle detection', () => {
      const selfRef = `
syntax = "proto3";
message TreeNode {
  string value = 1;
  TreeNode left = 2;
  TreeNode right = 3;
}
`
      const result = parseProtobufSchema(selfRef)
      if (!result.success) throw new Error('Parse failed')

      const msg = result.schema.messages[0]
      const json = generateSampleJson(msg, result.schema.messages, result.schema.enums)

      expect(json.value).toBe('')
      expect(json.left).toEqual({})
      expect(json.right).toEqual({})
    })

    it('generates empty object for map fields', () => {
      const schema = getParsedSchema()
      const person = schema.messages.find((m) => m.name === 'Person')!
      const json = generateSampleJson(person, schema.messages, schema.enums)

      expect(json.metadata).toEqual({})
    })

    it('generates correct JSON for Person message', () => {
      const schema = getParsedSchema()
      const person = schema.messages.find((m) => m.name === 'Person')!
      const json = generateSampleJson(person, schema.messages, schema.enums)

      expect(json).toEqual({
        active: false,
        address: {
          city: '',
          country: '',
          street: '',
          zipCode: '',
        },
        age: 0,
        metadata: {},
        name: '',
        status: 'UNKNOWN',
        tags: [''],
      })
    })

    it('generates correct JSON for Order message', () => {
      const schema = getParsedSchema()
      const order = schema.messages.find((m) => m.name === 'Order')!
      const json = generateSampleJson(order, schema.messages, schema.enums)

      expect(json).toEqual({
        createdAt: '0',
        customer: {
          active: false,
          address: {
            city: '',
            country: '',
            street: '',
            zipCode: '',
          },
          age: 0,
          metadata: {},
          name: '',
          status: 'UNKNOWN',
          tags: [''],
        },
        items: [
          {
            price: 0,
            productName: '',
            quantity: 0,
          },
        ],
        orderId: '',
        total: 0,
      })
    })
  })
})
