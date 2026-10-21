import test from 'node:test';
import assert from 'node:assert/strict';
import { ManualClickGuard } from './ManualClickGuard.js';

test('rejeita eventos sintéticos sem consumir a cota de cliques', () => {
  const guard = new ManualClickGuard(() => 0);
  for (let i = 0; i < 100; i++) assert.equal(guard.check({ isTrusted: false }).allowed, false);
  assert.equal(guard.check().allowed, false);
  assert.equal(guard.check({ isTrusted: true }).allowed, true);
});

test('aceita rajadas humanas e descarta excesso sem bloquear permanentemente', () => {
  let time = 0;
  const guard = new ManualClickGuard(() => time);
  for (let i = 0; i < 20; i++) assert.equal(guard.check({ isTrusted: true }).allowed, true);
  assert.equal(guard.check({ isTrusted: true }).reason, 'rate');
  time = 1000;
  assert.equal(guard.check({ isTrusted: true }).allowed, true);
});

test('limita cadência sustentada e libera a cota conforme o tempo passa', () => {
  let time = 0;
  const guard = new ManualClickGuard(() => time);
  for (let second = 0; second < 6; second++) {
    time = second * 1000;
    for (let i = 0; i < 20; i++) assert.equal(guard.check({ isTrusted: true }).allowed, true);
  }
  time = 6000;
  assert.equal(guard.check({ isTrusted: true }).reason, 'rate');
  time = 10000;
  assert.equal(guard.check({ isTrusted: true }).allowed, true);
  assert.ok(guard.accepted.length <= 120);
});
