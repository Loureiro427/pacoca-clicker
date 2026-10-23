const ADSTERRA_LOAD_TIMEOUT = 10_000;
const GOOGLE_LOAD_TIMEOUT = 10_000;

let adsterraScriptQueue = Promise.resolve();
let googleScriptPromise = null;

const text = value => typeof value === 'string' ? value.trim() : '';

export function normalizeHttpsUrl(value) {
  try {
    const url = new URL(text(value));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function createAdsConfig(env = import.meta.env || {}) {
  const provider = text(env.VITE_FEED_AD_PROVIDER || env.VITE_AD_PROVIDER).toLowerCase() === 'google'
    ? 'google'
    : 'adsterra';

  return {
    provider,
    adsterra: {
      key: text(env.VITE_ADSTERRA_FEED_ZONE_KEY || env.VITE_ADSTERRA_ZONE_KEY),
      scriptUrl: normalizeHttpsUrl(
        env.VITE_ADSTERRA_FEED_SCRIPT_URL || env.VITE_ADSTERRA_SCRIPT_URL,
      ),
      width: parsePositiveInteger(
        env.VITE_ADSTERRA_FEED_WIDTH || env.VITE_ADSTERRA_WIDTH,
        300,
      ),
      height: parsePositiveInteger(
        env.VITE_ADSTERRA_FEED_HEIGHT || env.VITE_ADSTERRA_HEIGHT,
        250,
      ),
    },
    google: {
      client: text(env.VITE_GOOGLE_ADSENSE_CLIENT),
      slot: text(env.VITE_GOOGLE_ADSENSE_FEED_SLOT || env.VITE_GOOGLE_ADSENSE_SLOT),
    },
  };
}

export function isAdsterraConfigured(configuration) {
  return Boolean(
    configuration.key &&
    configuration.scriptUrl &&
    configuration.width > 0 &&
    configuration.height > 0,
  );
}

export function isGoogleConfigured(configuration) {
  return /^ca-pub-\d+$/.test(configuration.client) && /^\d+$/.test(configuration.slot);
}

function loadGoogleScript(client) {
  if (window.adsbygoogle) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const selector = 'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';
    const existing = document.querySelector(selector);
    const script = existing || document.createElement('script');
    const finish = error => {
      window.clearTimeout(timer);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      if (error) {
        googleScriptPromise = null;
        reject(error);
      } else {
        resolve();
      }
    };
    const handleLoad = () => finish();
    const handleError = () => finish(new Error('Não foi possível carregar o Google AdSense.'));
    const timer = window.setTimeout(handleError, GOOGLE_LOAD_TIMEOUT);

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    }
  });

  return googleScriptPromise;
}

function loadAdsterraScript(unit, configuration) {
  const load = () => new Promise((resolve, reject) => {
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };

    window.atOptions = {
      key: configuration.key,
      format: 'iframe',
      height: configuration.height,
      width: configuration.width,
      params: {},
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = configuration.scriptUrl;
    script.async = false;
    script.dataset.adsterraScript = 'true';
    script.addEventListener('load', () => finish(), { once: true });
    script.addEventListener('error', () => finish(new Error('Não foi possível carregar o banner do Adsterra.')), { once: true });
    const timer = window.setTimeout(
      () => finish(new Error('Tempo esgotado ao carregar o banner do Adsterra.')),
      ADSTERRA_LOAD_TIMEOUT,
    );
    unit.replaceChildren(script);
  });

  const request = adsterraScriptQueue.then(load, load);
  adsterraScriptQueue = request.catch(() => undefined);
  return request;
}

function createSlotContent(slot, height) {
  slot.hidden = false;
  slot.classList.add('game-ad--loading');
  slot.style.setProperty('--game-ad-height', `${height}px`);
  slot.replaceChildren();

  const label = document.createElement('span');
  label.className = 'game-ad__label';
  label.textContent = 'Publicidade';

  const loading = document.createElement('div');
  loading.className = 'game-ad__loading';
  loading.setAttribute('aria-hidden', 'true');
  loading.innerHTML = '<span></span><span></span>';

  const unit = document.createElement('div');
  unit.className = 'game-ad__unit';
  slot.append(label, loading, unit);
  return unit;
}

function markSlotAsFailed(slot, error) {
  console.warn('[Ads] Não foi possível solicitar o anúncio.', error);
  slot.hidden = true;
  slot.replaceChildren();
}

async function requestGoogleAd(slot, configuration) {
  const unit = createSlotContent(slot, 250);
  const ad = document.createElement('ins');
  ad.className = 'adsbygoogle';
  ad.style.display = 'block';
  ad.dataset.adClient = configuration.client;
  ad.dataset.adSlot = configuration.slot;
  ad.dataset.adFormat = 'auto';
  ad.dataset.fullWidthResponsive = 'true';
  unit.appendChild(ad);

  await loadGoogleScript(configuration.client);
  (window.adsbygoogle = window.adsbygoogle || []).push({});
  slot.classList.remove('game-ad--loading');
}

async function requestAdsterraAd(slot, configuration) {
  const unit = createSlotContent(slot, configuration.height);
  await loadAdsterraScript(unit, configuration);
  slot.classList.remove('game-ad--loading');
}

function observeSlot(slot, request) {
  const load = () => request().catch(error => markSlotAsFailed(slot, error));
  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    load();
  }, { rootMargin: '600px 0px' });
  observer.observe(slot);
}

export function initAds(root = document, configuration = createAdsConfig()) {
  const isConfigured = configuration.provider === 'google'
    ? isGoogleConfigured(configuration.google)
    : isAdsterraConfigured(configuration.adsterra);

  if (!isConfigured) return 0;

  const slots = root.querySelectorAll('[data-ad-slot]:not([data-ad-requested])');
  slots.forEach(slot => {
    // Um elemento com `hidden` não participa do layout e nunca seria
    // observado pelo IntersectionObserver. Só o exibimos após validar a configuração.
    slot.hidden = false;
    slot.dataset.adRequested = 'true';
    const request = configuration.provider === 'google'
      ? () => requestGoogleAd(slot, configuration.google)
      : () => requestAdsterraAd(slot, configuration.adsterra);
    observeSlot(slot, request);
  });

  return slots.length;
}
