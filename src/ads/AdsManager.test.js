import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdsConfig,
  isAdsterraConfigured,
  isGoogleConfigured,
  normalizeHttpsUrl,
  parsePositiveInteger,
} from './AdsManager.js';

test('configuração de anúncios aceita apenas URLs HTTPS e tamanhos positivos', () => {
  assert.equal(normalizeHttpsUrl('https://ads.example/banner'), 'https://ads.example/banner');
  assert.equal(normalizeHttpsUrl('http://ads.example/banner'), '');
  assert.equal(normalizeHttpsUrl('inválida'), '');
  assert.equal(parsePositiveInteger('320', 300), 320);
  assert.equal(parsePositiveInteger('0', 300), 300);
});

test('configuração do Adsterra usa as variáveis Vite do feed', () => {
  const config = createAdsConfig({
    VITE_FEED_AD_PROVIDER: 'adsterra',
    VITE_ADSTERRA_FEED_ZONE_KEY: 'zone-key',
    VITE_ADSTERRA_FEED_SCRIPT_URL: 'https://ads.example/zone-key',
    VITE_ADSTERRA_FEED_WIDTH: '320',
    VITE_ADSTERRA_FEED_HEIGHT: '50',
  });

  assert.equal(config.provider, 'adsterra');
  assert.deepEqual(config.adsterra, {
    key: 'zone-key',
    scriptUrl: 'https://ads.example/zone-key',
    width: 320,
    height: 50,
  });
  assert.equal(isAdsterraConfigured(config.adsterra), true);
});

test('Google Ads exige client AdSense e slot numérico', () => {
  const config = createAdsConfig({
    VITE_FEED_AD_PROVIDER: 'google',
    VITE_GOOGLE_ADSENSE_CLIENT: 'ca-pub-1234567890',
    VITE_GOOGLE_ADSENSE_FEED_SLOT: '9876543210',
  });

  assert.equal(config.provider, 'google');
  assert.equal(isGoogleConfigured(config.google), true);
  assert.equal(isGoogleConfigured({ client: 'ca-app-pub-123', slot: '12' }), false);
});
