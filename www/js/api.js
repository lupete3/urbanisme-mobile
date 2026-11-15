// Client de l'API DOSSIERUrba et stockage local.
// Dans l'appli Android, le jeton est gardé par le plugin Preferences (stockage privé de l'application).
// Dans un navigateur (tests), on utilise localStorage.
(() => {
  const C = window.Capacitor;
  const native = !!(C && C.isNativePlatform && C.isNativePlatform());
  const Prefs = native ? C.registerPlugin('Preferences') : null;

  // Adresse de l'API : le site en ligne. Pour les tests dans un navigateur, on peut la changer
  // avec localStorage.setItem('api', 'http://localhost:8098/api.php?r=').
  const PROD = 'https://travaux.pftecho.com/api/';
  let base = PROD;
  if (!native) { try { base = localStorage.getItem('api') || PROD; } catch (e) {} }

  const store = {
    async get(k) { if (Prefs) return (await Prefs.get({ key: k })).value; try { return localStorage.getItem(k); } catch (e) { return null; } },
    async set(k, v) { if (Prefs) return Prefs.set({ key: k, value: v }); try { localStorage.setItem(k, v); } catch (e) {} },
    async remove(k) { if (Prefs) return Prefs.remove({ key: k }); try { localStorage.removeItem(k); } catch (e) {} },
  };

  let token = null;
  async function call(method, path, body) {
    if (token === null) token = (await store.get('token')) || '';
    const h = {};
    if (token) h.Authorization = 'Bearer ' + token;
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    let r;
    try { r = await fetch(base + path, { method, headers: h, body: payload }); }
    catch (e) { throw Object.assign(new Error('Pas de connexion au serveur. Vérifiez votre accès à Internet.'), { status: 0, code: 'offline' }); }
    let j = null;
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j || j.ok === false) {
      throw Object.assign(new Error((j && j.error) || 'Erreur du serveur (' + r.status + ').'), { status: r.status, code: j && j.code });
    }
    return j;
  }

  window.api = {
    native,
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b === undefined ? {} : b),
    put: (p, b) => call('PUT', p, b),
    del: (p, b) => call('DELETE', p, b),
    async setToken(t) { token = t || ''; if (t) await store.set('token', t); else await store.remove('token'); },
    async hasToken() { if (token === null) token = (await store.get('token')) || ''; return !!token; },
    store,
  };
})();
