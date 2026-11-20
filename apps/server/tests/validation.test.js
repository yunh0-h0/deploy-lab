import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RULES, validate } from '../rules.js'
test('입력 검증: 문자열·공백·경계·trim', () => {
  for (const x of [null,42,{},[], '   ']) assert.ok(validate(x).error)
  assert.equal(validate(' 가나 ').text,'가나')
  assert.ok(validate('a'.repeat(RULES.maxLength+1)).error)
  assert.equal(validate('a'.repeat(RULES.maxLength)).text.length,RULES.maxLength)
  assert.ok(validate('a'.repeat(RULES.minLength-1)).error)
})
