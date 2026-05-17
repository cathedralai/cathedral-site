import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PUBLIC_WALL_SCORE_MIN,
  hasAnyScore,
  isQualifiedScore,
} from '../src/lib/qualification.js'

test('public wall qualification hides low scores', () => {
  assert.equal(PUBLIC_WALL_SCORE_MIN, 0.5)
  assert.equal(isQualifiedScore(0.31), false)
  assert.equal(isQualifiedScore(0), false)
  assert.equal(isQualifiedScore(null), false)
  assert.equal(isQualifiedScore(undefined), false)
})

test('public wall qualification accepts threshold and above', () => {
  assert.equal(isQualifiedScore(0.5), true)
  assert.equal(isQualifiedScore(0.94), true)
  assert.equal(isQualifiedScore(1), true)
})

test('any scored row is still tracked separately from pending discovery', () => {
  assert.equal(hasAnyScore(0.31), true)
  assert.equal(hasAnyScore(0), true)
  assert.equal(hasAnyScore(null), false)
})
