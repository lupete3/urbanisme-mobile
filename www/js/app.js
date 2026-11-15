// DOSSIERUrba Mobile : navigation et écrans (étape 2.2 : compte et consentement).
(() => {
  const APP_VERSION = '1.0.1';
  const C = window.Capacitor;
  const App = api.native ? C.registerPlugin('App') : null;
  const view = document.getElementById('view');
  const state = { config: null, user: null };
  const stack = []; // historique des écrans, pour le bouton Retour d'Android

  /* ---------- Outils ---------- */
  const el = (t, a = {}, ...kids) => { const e = document.createElement(t); for (const [k, v] of Object.entries(a)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } e.append(...flat(kids)); return e; };
  const flat = (a) => a.reduce((r, x) => x == null || x === false ? r : r.concat(Array.isArray(x) ? flat(x) : [x]), []);
  const fill = (node, ...kids) => { node.innerHTML = ''; node.append(...flat(kids)); };
  const field = (label, attrs) => [el('label', { for: attrs.name }, label), el('input', { id: attrs.name, ...attrs })];
  function show(screen, arg, push = true) { if (push) stack.push([screen, arg]); fill(view, screen(arg)); window.scrollTo(0, 0); window.appStarted = true; hideSplash(); }
  function reset(screen, arg) { stack.length = 0; show(screen, arg); }
  function back() { if (document.querySelector('.sheet')) { document.querySelector('.sheet').remove(); return; } if (stack.length > 1) { stack.pop(); const [s, a] = stack[stack.length - 1]; show(s, a, false); } else if (App) App.exitApp(); }
  // Bouton d'envoi : état « chargement » et message d'erreur sous le formulaire
  async function submitting(form, fn) {
    const b = form.querySelector('button[type=submit]'), err = form.querySelector('.err'), label = b.innerHTML;
    err.textContent = ''; b.disabled = true; fill(b, el('span', { class: 'spin' }));
    try { await fn(); } catch (e) { err.textContent = e.message; } finally { if (b.isConnected) { b.disabled = false; b.innerHTML = label; } }
  }
  const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };

  // Texte légal dans une fenêtre (contenu HTML échappé par le serveur)
  async function legal(kind) {
    const box = el('div', {}, el('p', { class: 'mu' }, 'Chargement…'));
    const sheet = el('div', { class: 'sheet', onclick: (e) => { if (e.target === sheet) sheet.remove(); } }, box);
    document.body.append(sheet);
    try {
      const j = await api.get('legal/' + kind);
      const body = el('div'); body.innerHTML = j.html;
      fill(box, el('h2', {}, j.title), el('p', { class: 'mu' }, 'Version ' + j.version), body, el('button', { onclick: () => sheet.remove() }, 'Fermer'));
    } catch (e) { fill(box, el('p', { class: 'err' }, e.message), el('button', { onclick: () => sheet.remove() }, 'Fermer')); }
  }
  const legalLink = (kind, text) => el('a', { href: '#', onclick: (e) => { e.preventDefault(); legal(kind); } }, text);
  function consentBoxes(an = false, mk = false) {
    return [
      el('label', { class: 'ck' }, el('input', { type: 'checkbox', name: 'cgu', required: true }), el('span', {}, 'J’accepte les ', legalLink('cgu', 'conditions d’utilisation'), ' et la ', legalLink('privacy', 'politique de confidentialité'), ' ', el('b', {}, '(obligatoire)'))),
      el('label', { class: 'ck' }, el('input', { type: 'checkbox', name: 'analytics', checked: an }), el('span', {}, 'J’accepte la mesure d’audience anonyme (facultatif)')),
      el('label', { class: 'ck' }, el('input', { type: 'checkbox', name: 'marketing', checked: mk }), el('span', {}, 'J’accepte de recevoir des informations par e-mail (facultatif)')),
    ];
  }

  /* ---------- Après connexion ---------- */
  async function signedIn(user) { state.user = user; reset(user.consent.required ? consentScreen : homeScreen); }
  async function logout() { try { await api.post('auth/logout'); } catch (e) {} await api.setToken(null); state.user = null; reset(loginScreen); }

  /* ---------- Écrans ---------- */
  function loginScreen() {
    const f = el('form', { class: 'card', onsubmit: (e) => { e.preventDefault(); submitting(f, async () => {
      const j = await api.post('auth/login', { email: f.email.value, password: f.password.value, device: 'Android' });
      await api.setToken(j.token); await signedIn(j.user);
    }); } },
      el('h2', {}, 'Connexion'),
      field('Adresse e-mail', { name: 'email', type: 'email', required: true, autocomplete: 'email', inputmode: 'email' }),
      field('Mot de passe', { name: 'password', type: 'password', required: true, autocomplete: 'current-password' }),
      el('p', { class: 'err' }),
      el('button', { type: 'submit' }, 'Se connecter'),
      el('button', { type: 'button', class: 'link', onclick: () => show(forgotScreen) }, 'Mot de passe oublié ?'));
    return el('div', {}, el('img', { class: 'logo', src: 'assets/logo.png', alt: 'DOSSIERUrba' }), f,
      el('button', { class: 'ghost', onclick: () => show(registerScreen) }, 'Créer un compte'),
      zoneLink(), el('p', { class: 'links' }, legalLink('cgu', 'Conditions d’utilisation'), ' · ', legalLink('privacy', 'Confidentialité')));
  }
  const zoneLink = () => state.config ? el('a', { class: 'btn green', href: state.config.zone_url, target: '_blank', rel: 'noopener' }, 'Voir dans quelle zone se trouve votre parcelle ↗') : null;

  function registerScreen() {
    const f = el('form', { class: 'card', onsubmit: (e) => { e.preventDefault(); submitting(f, async () => {
      if (f.password.value.length < 10) throw new Error('Mot de passe : 10 caractères minimum.');
      if (f.password.value !== f.password2.value) throw new Error('Les deux mots de passe sont différents.');
      if (!f.cgu.checked) throw new Error('Vous devez accepter les conditions d’utilisation et la politique de confidentialité.');
      const j = await api.post('auth/register', { name: f.name.value, email: f.email.value, password: f.password.value, cgu: true, analytics: f.analytics.checked, marketing: f.marketing.checked, device: 'Android' });
      await api.setToken(j.token); await signedIn(j.user);
    }); } },
      el('div', { class: 'bar' }, el('button', { type: 'button', class: 'ghost', onclick: back }, '← Retour')),
      el('h2', {}, 'Créer un compte'),
      field('Nom complet', { name: 'name', type: 'text', required: true, autocomplete: 'name' }),
      field('Adresse e-mail', { name: 'email', type: 'email', required: true, autocomplete: 'email', inputmode: 'email' }),
      field('Mot de passe (10 caractères minimum)', { name: 'password', type: 'password', required: true, minlength: 10, autocomplete: 'new-password' }),
      field('Confirmer le mot de passe', { name: 'password2', type: 'password', required: true, minlength: 10, autocomplete: 'new-password' }),
      consentBoxes(),
      el('p', { class: 'err' }),
      el('button', { type: 'submit' }, 'Créer mon compte'));
    return el('div', {}, f);
  }

  function forgotScreen() {
    const done = el('p', { class: 'ok' });
    const f = el('form', { class: 'card', onsubmit: (e) => { e.preventDefault(); submitting(f, async () => {
      const j = await api.post('auth/forgot', { email: f.email.value }); done.textContent = j.message;
    }); } },
      el('div', { class: 'bar' }, el('button', { type: 'button', class: 'ghost', onclick: back }, '← Retour')),
      el('h2', {}, 'Mot de passe oublié'),
      el('p', { class: 'mu' }, 'Indiquez l’adresse e-mail de votre compte. Vous recevrez un lien pour choisir un nouveau mot de passe, puis vous pourrez vous reconnecter ici.'),
      field('Adresse e-mail', { name: 'email', type: 'email', required: true, autocomplete: 'email', inputmode: 'email' }),
      el('p', { class: 'err' }), done,
      el('button', { type: 'submit' }, 'Envoyer le lien'));
    return el('div', {}, f);
  }

  function consentScreen() {
    const u = state.user;
    const f = el('form', { class: 'card', onsubmit: (e) => { e.preventDefault(); submitting(f, async () => {
      if (!f.cgu.checked) throw new Error('Vous devez accepter les conditions pour utiliser DOSSIERUrba.');
      const j = await api.post('me/consent', { cgu: true, analytics: f.analytics.checked, marketing: f.marketing.checked });
      await signedIn(j.user);
    }); } },
      el('h2', {}, 'Avant de continuer'),
      el('p', {}, 'DOSSIERUrba a besoin de votre accord pour traiter vos données personnelles :'),
      el('ul', {},
        el('li', {}, el('b', {}, 'Données utilisées'), ' : nom, e-mail, téléphone (facultatif), adresse et parcelle du projet, photos et plans importés.'),
        el('li', {}, el('b', {}, 'Pourquoi'), ' : créer vos dossiers d’urbanisme et générer le PDF, gérer votre compte et votre accès.'),
        el('li', {}, el('b', {}, 'Vos droits'), ' : accès, rectification, suppression, portabilité, retrait du consentement, depuis votre profil.')),
      consentBoxes(u.consent.analytics, u.consent.marketing),
      el('p', { class: 'err' }),
      el('button', { type: 'submit' }, 'Continuer'),
      el('button', { type: 'button', class: 'link', onclick: logout }, 'Se déconnecter'));
    return el('div', {}, el('img', { class: 'logo', src: 'assets/logo.png', alt: 'DOSSIERUrba' }), f);
  }

  // Accueil provisoire : les dossiers arrivent à l'étape 2.3
  function homeScreen() {
    const u = state.user, msg = state.config && state.config.message;
    return el('div', {},
      el('h1', {}, 'Bonjour ' + u.name.split(' ')[0]),
      msg ? el('div', { class: 'card note' }, msg) : null,
      el('div', { class: 'card acc' }, u.access.text),
      zoneLink(),
      el('div', { class: 'card', style: 'margin-top:14px' }, el('h2', {}, 'Mes dossiers'), el('p', { class: 'mu' }, 'La constitution des dossiers DP, AP et PD arrive dans la prochaine version de l’application.')),
      el('button', { class: 'ghost', onclick: logout }, 'Se déconnecter'),
      el('p', { class: 'links mu' }, 'Version ' + APP_VERSION));
  }

  function updateScreen() {
    return el('div', {}, el('img', { class: 'logo', src: 'assets/logo.png', alt: 'DOSSIERUrba' }),
      el('div', { class: 'card' }, el('h2', {}, 'Mise à jour nécessaire'), el('p', {}, 'Une nouvelle version de DOSSIERUrba est disponible. Mettez l’application à jour pour continuer.'),
        el('a', { class: 'btn', href: 'https://play.google.com/store/apps/details?id=com.dossierurba.app', target: '_blank', rel: 'noopener' }, 'Ouvrir le Play Store')));
  }

  function offlineScreen(message) {
    return el('div', {}, el('img', { class: 'logo', src: 'assets/logo.png', alt: 'DOSSIERUrba' }),
      el('div', { class: 'card' }, el('h2', {}, 'Connexion impossible'), el('p', { class: 'err' }, message), el('button', { onclick: start }, 'Réessayer')));
  }

  /* ---------- Démarrage ---------- */
  async function start() {
    try { state.config = await api.get('config'); }
    catch (e) { return reset(offlineScreen, e.message); }
    if (state.config.app_min && state.config.app_min.android && newer(state.config.app_min.android, APP_VERSION)) return reset(updateScreen);
    if (!(await api.hasToken())) return reset(loginScreen);
    try { const j = await api.get('me'); await signedIn(j.user); }
    catch (e) { if (e.status === 401) { await api.setToken(null); reset(loginScreen); } else reset(offlineScreen, e.message); }
  }

  // Le logo reste au moins 1,2 s, puis disparaît dès que le premier écran est prêt
  const t0 = Date.now();
  function hideSplash() { const s = document.getElementById('splash'); if (!s || s.classList.contains('out')) return; setTimeout(() => { s.classList.add('out'); setTimeout(() => s.remove(), 400); }, Math.max(0, 1200 - (Date.now() - t0))); }
  try { if (App) App.addListener('backButton', back); } catch (e) { window.bootError && window.bootError('Bouton Retour : ' + e.message); }
  start().catch((e) => reset(offlineScreen, e.message));
})();
