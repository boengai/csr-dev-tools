import { describe, expect, it } from 'vitest'

import {
  toCamelCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toLowerCase,
  toPathCase,
  toPascalCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toUpperCase,
} from '@/utils/text-case'

describe('text case utilities', () => {
  const input = 'hello world test'

  describe('toCamelCase', () => {
    it('should convert space-separated words', () => {
      expect(toCamelCase(input)).toBe('helloWorldTest')
    })

    it('should convert snake_case', () => {
      expect(toCamelCase('hello_world_test')).toBe('helloWorldTest')
    })

    it('should convert kebab-case', () => {
      expect(toCamelCase('hello-world-test')).toBe('helloWorldTest')
    })

    it('should convert PascalCase', () => {
      expect(toCamelCase('HelloWorldTest')).toBe('helloWorldTest')
    })

    it('should return empty string for empty input', () => {
      expect(toCamelCase('')).toBe('')
    })
  })

  describe('toPascalCase', () => {
    it('should convert space-separated words', () => {
      expect(toPascalCase(input)).toBe('HelloWorldTest')
    })

    it('should convert camelCase', () => {
      expect(toPascalCase('helloWorldTest')).toBe('HelloWorldTest')
    })
  })

  describe('toSnakeCase', () => {
    it('should convert space-separated words', () => {
      expect(toSnakeCase(input)).toBe('hello_world_test')
    })

    it('should convert camelCase', () => {
      expect(toSnakeCase('helloWorldTest')).toBe('hello_world_test')
    })
  })

  describe('toKebabCase', () => {
    it('should convert space-separated words', () => {
      expect(toKebabCase(input)).toBe('hello-world-test')
    })
  })

  describe('toConstantCase', () => {
    it('should convert space-separated words', () => {
      expect(toConstantCase(input)).toBe('HELLO_WORLD_TEST')
    })
  })

  describe('toTitleCase', () => {
    it('should convert space-separated words', () => {
      expect(toTitleCase(input)).toBe('Hello World Test')
    })
  })

  describe('toUpperCase', () => {
    it('should convert to uppercase', () => {
      expect(toUpperCase(input)).toBe('HELLO WORLD TEST')
    })
  })

  describe('toLowerCase', () => {
    it('should convert to lowercase', () => {
      expect(toLowerCase('HELLO WORLD')).toBe('hello world')
    })
  })

  describe('toSentenceCase', () => {
    it('should capitalize first word only', () => {
      expect(toSentenceCase(input)).toBe('Hello world test')
    })

    it('should return empty string for empty input', () => {
      expect(toSentenceCase('')).toBe('')
    })
  })

  describe('toDotCase', () => {
    it('should convert space-separated words', () => {
      expect(toDotCase(input)).toBe('hello.world.test')
    })
  })

  describe('toPathCase', () => {
    it('should convert space-separated words', () => {
      expect(toPathCase(input)).toBe('hello/world/test')
    })

    it('should convert from dot.case', () => {
      expect(toPathCase('hello.world.test')).toBe('hello/world/test')
    })
  })
})
