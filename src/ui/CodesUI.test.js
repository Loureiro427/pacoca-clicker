import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignValuesFromForm } from './CodesUI.js';

test('campanha lê diretamente os valores visíveis dos controles do formulário', () => {
  const form = {
    elements: {
      code: { value: 'pacoca' },
      reward_type: { value: 'coins' },
      amount: { value: '100000000' },
      expires_at: { value: '' },
      max_redemptions: { value: '1' },
      active: { checked: true },
    },
  };

  assert.deepEqual(campaignValuesFromForm(form), {
    code: 'pacoca',
    reward_type: 'coins',
    amount: '100000000',
    expires_at: '',
    max_redemptions: '1',
    active: true,
  });
});
