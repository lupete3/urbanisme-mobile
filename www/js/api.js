// Client de l'API DOSSIERUrba et stockage local.
// Dans l'appli Android, le jeton est gardé par le plugin Preferences (stockage privé de l'application).
// Dans un navigateur (tests), on utilise localStorage.
(() => {
  const C = window.Capacitor;
  const native = !!(C && C.isNativePlatform && C.isNativePlatform());
  // Les plugins natifs passent par registerPlugin, fourni par js/capacitor.js (module de base de Capacitor,
  // copié par « npm run sync » car l'appli n'utilise pas d'outil de build).
  const reg = (window.capacitorExports && window.capacitorExports.registerPlugin) || (C && C.registerPlugin);
  const plugin = (name) => { if (!native) return null; try { return typeof reg === 'function' ? reg(name) : null; } catch (e) { window.bootError && window.bootError('Plugin ' + name + ' : ' + e.message); return null; } };
  const Prefs = plugin('Preferences');

  // Adresse de l'API : le site en ligne. Pour les tests dans un navigateur, on peut la changer
  // avec localStorage.setItem('api', 'http://localhost:8098/api.php?r=').
  const PROD = 'https://travaux.pftecho.com/api/';
  let base = PROD;
  if (!native) { try { base = localStorage.getItem('api') || PROD; } catch (e) {} }

  // Appel natif avec délai de 4 s : si le plugin ne répond pas, on se rabat sur localStorage et on le signale
  let prefsOk = !!Prefs;
  const native4s = (p) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('Stockage natif sans réponse')), 4000))]);
  async function nat(fn, fallback) {
    if (prefsOk) { try { return await native4s(fn()); } catch (e) { prefsOk = false; window.bootError && window.bootError('Preferences : ' + e.message); } }
    try { return fallback(); } catch (e) { return null; }
  }
  const store = {
    get: (k) => nat(async () => (await Prefs.get({ key: k })).value, () => localStorage.getItem(k)),
    set: (k, v) => nat(() => Prefs.set({ key: k, value: v }), () => localStorage.setItem(k, v)),
    remove: (k) => nat(() => Prefs.remove({ key: k }), () => localStorage.removeItem(k)),
  };

  let token = null;
  // raw = true : renvoie la réponse brute (images, PDF) au lieu du JSON
  async function call(method, path, body, raw) {
    if (token === null) token = (await store.get('token')) || '';
    const h = {};
    if (token) h.Authorization = 'Bearer ' + token;
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    let r;
    // Délai maximum de 20 s : sans réponse, on affiche une erreur au lieu d'attendre indéfiniment
    const ctl = window.AbortController ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 20000);
    try { r = await fetch(base + path, { method, headers: h, body: payload, signal: ctl ? ctl.signal : undefined }); }
    catch (e) { throw Object.assign(new Error(e && e.name === 'AbortError' ? 'Le serveur ne répond pas (délai dépassé). Vérifiez votre connexion.' : 'Pas de connexion au serveur. Vérifiez votre accès à Internet. (' + (e && e.message || e) + ')'), { status: 0, code: 'offline' }); }
    finally { clearTimeout(timer); }
    if (raw && r.ok) return r;
    let j = null;
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j || j.ok === false) {
      throw Object.assign(new Error((j && j.error) || 'Erreur du serveur (' + r.status + ').'), { status: r.status, code: j && j.code });
    }
    return j;
  }

  window.api = {
    native,
    plugin,
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b === undefined ? {} : b),
    put: (p, b) => call('PUT', p, b),
    del: (p, b) => call('DELETE', p, b),
    raw: (p) => call('GET', p, undefined, true),
    // Image protégée par le jeton -> adresse locale utilisable dans <img src>
    async image(p) { const r = await call('GET', p, undefined, true); return URL.createObjectURL(await r.blob()); },
    async setToken(t) { token = t || ''; if (t) await store.set('token', t); else await store.remove('token'); },
    async hasToken() { if (token === null) token = (await store.get('token')) || ''; return !!token; },
    store,
  };
})();
