// DOSSIERUrba Mobile : navigation et écrans (compte, consentement, dossiers).
(() => {
  const APP_VERSION = '1.0.5';
  const C = window.Capacitor;
  const App = api.plugin('App');
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

  /* ---------- Dossiers (étape 2.3) ---------- */
  // Erreur d'API pendant l'utilisation : session expirée -> connexion ; conditions à accepter -> consentement
  async function guard(e, box) {
    if (e.status === 401) { await api.setToken(null); state.user = null; reset(loginScreen); return true; }
    if (e.code === 'consent_required') { try { state.user = (await api.get('me')).user; } catch (x) {} reset(consentScreen); return true; }
    if (box) fill(box, el('div', { class: 'card' }, el('p', { class: 'err' }, e.message), el('button', { onclick: () => { const [s, a] = stack[stack.length - 1]; show(s, a, false); } }, 'Réessayer')));
    return false;
  }
  // Zone qui se remplit quand les données arrivent
  function later(fn) { const box = el('div', {}, el('p', { class: 'mu', style: 'text-align:center;margin:24px 0' }, 'Chargement…')); fn(box).catch((e) => guard(e, box)); return box; }
  const back$ = () => el('div', { class: 'bar' }, el('button', { type: 'button', class: 'ghost', onclick: back }, '← Retour'));
  const chip = (t) => el('span', { class: 'chip' }, t);
  const badge = (status, label) => el('span', { class: 'badge b-' + status }, label);
  const progress = (p) => [el('div', { class: 'prog' }, el('i', { style: 'width:' + (p.required ? Math.round(p.done / p.required * 100) : 0) + '%' })), el('small', { class: 'mu' }, p.done + ' / ' + p.required + ' pièces obligatoires')];
  // Retire l'écran courant de l'historique avant d'en ouvrir un autre (ex. : création -> dossier)
  function replace(screen, arg) { stack.pop(); show(screen, arg); }

  function homeScreen() {
    const u = state.user, msg = state.config && state.config.message;
    return el('div', {},
      el('h1', {}, 'Bonjour ' + u.name.split(' ')[0]),
      msg ? el('div', { class: 'card note' }, msg) : null,
      zoneLink(),
      el('div', { class: 'row', style: 'margin-top:18px' }, el('h2', { style: 'margin:0' }, 'Mes dossiers'), el('button', { class: 'small', onclick: () => show(newDossierScreen) }, '＋ Nouveau')),
      later(async (box) => {
        const j = await api.get('dossiers');
        state.user.access = j.access;
        fill(box, el('div', { class: 'card acc' }, j.access.text),
          j.dossiers.length ? j.dossiers.map((d) => el('a', { class: 'card dc', href: '#', onclick: (e) => { e.preventDefault(); show(dossierScreen, d.id); } },
            el('div', { class: 'row' }, el('b', {}, d.titre), badge(d.status, d.status_label)),
            el('p', { class: 'mu', style: 'margin:4px 0 8px' }, chip(d.type), ' ', d.adresse),
            progress(d.progress)))
            : el('div', { class: 'card empty' }, el('p', {}, 'Aucun dossier pour le moment.'), el('button', { onclick: () => show(newDossierScreen) }, 'Créer mon premier dossier')));
      }),
      el('button', { class: 'ghost', onclick: logout }, 'Se déconnecter'),
      el('p', { class: 'links mu' }, 'Version ' + APP_VERSION));
  }

  function newDossierScreen() {
    const types = state.config.types;
    let chosen = (types.find((t) => t.available) || {}).code;
    const pick = el('div', { class: 'types' }, types.map((t) => el('label', { class: 'type' + (t.available ? '' : ' off') },
      el('input', { type: 'radio', name: 'type', value: t.code, checked: t.code === chosen, disabled: !t.available, onchange: () => { chosen = t.code; } }),
      el('span', { class: 'chip' }, t.code), el('span', {}, t.label, t.available ? null : el('small', {}, ' · ' + (t.note || 'À venir'))))));
    const f = el('form', { class: 'card', onsubmit: (e) => { e.preventDefault(); submitting(f, async () => {
      try { const j = await api.post('dossiers', { type: chosen, titre: f.titre.value, adresse: f.adresse.value, parcelle: f.parcelle.value }); replace(dossierScreen, j.dossier.id); }
      catch (x) { if (!(await guard(x))) throw x; }
    }); } },
      el('h2', {}, 'Nouveau dossier'),
      el('label', {}, 'Type de dossier'), pick,
      field('Intitulé du projet', { name: 'titre', type: 'text', required: true, placeholder: 'Ex : Aménagement des combles' }),
      field('Adresse du projet', { name: 'adresse', type: 'text', required: true, autocomplete: 'street-address' }),
      field('Numéro de parcelle', { name: 'parcelle', type: 'text', required: true, placeholder: 'Ex : AB 123' }),
      el('p', { class: 'err' }),
      el('button', { type: 'submit' }, 'Créer le dossier'));
    return el('div', {}, back$(), f);
  }

  function dossierScreen(id) {
    return el('div', {}, back$(), later(async (box) => {
      const { dossier: d, access } = await api.get('dossiers/' + id);
      const edit = d.status === 'brouillon';
      // La planche d'une notice n'est générée qu'à l'envoi : elle est « faite » dès que le texte est rempli
      d.pieces.forEach((p) => { if (p.kind === 'txt') p.done = !!String(d.description || '').trim(); });
      const pieces = d.pieces.map((p) => {
        const card = el('div', { class: 'card piece' },
          el('div', { class: 'row' }, el('b', {}, p.code + ' – ' + p.title), p.done ? el('span', { class: 'ok' }, '✔') : p.optional ? el('span', { class: 'badge b-opt' }, 'Facultatif') : el('span', { class: 'todo' }, 'à compléter')),
          el('p', { class: 'mu' }, p.help));
        if (p.kind === 'img') {
          if (p.done) { const img = el('img', { class: 'thumb', alt: p.code }); card.append(img); api.image('dossiers/' + d.id + '/pieces/' + encodeURIComponent(p.code) + '/sheet').then((u) => { img.src = u; }).catch(() => img.remove()); }
          if (edit) card.append(el('button', { class: p.done ? 'ghost' : '', onclick: () => show(editorScreen, { d, p }) }, p.done ? 'Modifier la planche' : 'Ouvrir l’éditeur'));
        } else {
          if (edit) {
            const f = el('form', { onsubmit: (e) => { e.preventDefault(); submitting(f, async () => {
              try { await api.put('dossiers/' + d.id + '/description', { description: f.description.value }); show(dossierScreen, d.id, false); }
              catch (x) { if (!(await guard(x))) throw x; }
            }); } }, el('textarea', { name: 'description', rows: 6, placeholder: d.type === 'PD' ? 'Décrivez les précautions prises pendant la démolition…' : 'Décrivez vos travaux : matériaux, couleurs, dimensions…' }), el('p', { class: 'err' }), el('button', { type: 'submit' }, 'Enregistrer le texte'));
            f.description.value = d.description; card.append(f);
          } else card.append(el('p', { class: 'pre' }, d.description || '—'));
        }
        return card;
      });
      const actions = [];
      if (d.status === 'en_attente') actions.push(el('button', { class: 'ghost', onclick: async () => { if (!confirm('Le dossier repasse en brouillon pour être modifié. Vous devrez le soumettre à nouveau.')) return; try { await api.post('dossiers/' + d.id + '/reopen'); show(dossierScreen, d.id, false); } catch (x) { if (!(await guard(x))) alert(x.message); } } }, 'Modifier le dossier'));
      if (d.status !== 'paye') actions.push(el('button', { class: 'danger', onclick: async () => { if (!confirm('Supprimer définitivement ce dossier et toutes ses pièces ? Cette action est irréversible.')) return; try { await api.del('dossiers/' + d.id); back(); } catch (x) { if (!(await guard(x))) alert(x.message); } } }, 'Supprimer le dossier'));
      fill(box,
        el('div', { class: 'row', style: 'align-items:flex-start' }, el('h1', { style: 'margin-top:0' }, d.titre), badge(d.status, d.status_label)),
        el('p', { class: 'mu' }, chip(d.type), ' ', d.type_label, ' · ', d.adresse, ' – parcelle ', d.parcelle),
        progress(d.progress),
        el('div', { class: 'card cerfa', style: 'margin-top:14px' }, el('b', {}, 'Cerfa n°' + d.cerfa.numero + ' – Formulaire officiel'),
          el('p', { class: 'mu' }, 'Téléchargez le formulaire, imprimez-le et remplissez-le au stylo. Il se dépose en mairie avec les pièces ci-dessous.'),
          el('a', { class: 'btn', href: d.cerfa.url, target: '_blank', rel: 'noopener' }, 'Accéder au Cerfa ↗')),
        pieces,
        sendBlock(d, access),
        actions);
    }));
  }

  /* ---------- Envoi du dossier et PDF (étape 2.5) ---------- */
  // Bouton occupé pendant une action ; les erreurs s'affichent dans une boîte de dialogue
  async function busy(b, fn) { const label = b.innerHTML; b.disabled = true; fill(b, el('span', { class: 'spin' })); try { await fn(); } catch (e) { if (!(await guard(e))) alert(e.message); } finally { if (b.isConnected) { b.disabled = false; b.innerHTML = label; } } }
  // Page de garde et notice dessinées sur le téléphone (mêmes fonctions que le site), puis envoyées
  async function prepSheets(d) {
    const E = window.DPEditor; E.setHead(d.head);
    const cv = document.createElement('canvas'); cv.width = E.W; cv.height = E.H; const c = cv.getContext('2d');
    const meta = { titre: d.titre, adresse: d.adresse, parcelle: d.parcelle, owner: state.user.name };
    const list = d.pieces.filter((p) => !p.optional || p.done).map((p) => p.code + ' : ' + p.title);
    const txt = d.pieces.find((p) => p.kind === 'txt');
    const up = async (code, title, draw, desc) => {
      E.frame(c, meta, code, title); draw();
      const fd = new FormData(); fd.append('data', '{}'); fd.append('sheet', await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.88)), 's.jpg');
      if (desc !== undefined) fd.append('desc', desc);
      await api.post('dossiers/' + d.id + '/pieces/' + encodeURIComponent(code), fd);
    };
    await up(d.type + '0', 'PAGE DE GARDE', () => E.cover(c, meta, list));
    if (txt) await up(txt.code, txt.title.toUpperCase(), () => { c.fillStyle = '#14213d'; c.textBaseline = 'top'; c.font = '28px Arial'; E.wrap(c, d.description || '(à compléter)', 80, 80, E.W - 160, 40); }, d.description);
  }
  const toBase64 = (blob) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(r.error); r.readAsDataURL(blob); });
  // PDF : enregistré dans le cache de l'appli puis proposé au partage (mail, WhatsApp, Drive, lecteur PDF…)
  async function openPdf(d) {
    const r = await api.raw('dossiers/' + d.id + '/pdf'), blob = await r.blob();
    const m = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || ''), name = m ? m[1] : 'DOSSIERUrba-' + d.type + '-' + d.id + '.pdf';
    const FS = api.plugin('Filesystem'), Share = api.plugin('Share');
    if (FS && Share) {
      const w = await FS.writeFile({ path: name, data: await toBase64(blob), directory: 'CACHE' });
      try { await Share.share({ title: name, text: 'Dossier ' + d.type + ' – ' + d.titre, files: [w.uri], dialogTitle: 'Ouvrir ou partager le PDF' }); }
      catch (e) { if (!/cancel|annul/i.test(e && e.message || '')) throw e; }
    } else { const u = URL.createObjectURL(blob), a = el('a', { href: u, download: name }); document.body.append(a); a.click(); a.remove(); }
  }
  function sendBlock(d, access) {
    const edit = d.status === 'brouillon', hasSheet = d.pieces.some((p) => p.done);
    const pdfBtn = (edit && !hasSheet) ? null : el('button', { class: d.status === 'paye' ? '' : 'ghost', onclick: (e) => busy(e.currentTarget, async () => { if (edit) await prepSheets(d); await openPdf(d); }) },
      d.status === 'paye' ? 'Télécharger / partager le PDF complet' : 'Aperçu du PDF (filigrané)');
    if (!edit) return [el('div', { class: 'card ' + (d.status === 'paye' ? 'acc' : 'note') }, d.status === 'paye' ? 'Dossier débloqué : le PDF complet est disponible, sans filigrane.' : 'Dossier envoyé : il sera débloqué dès la validation de votre paiement' + (d.price ? ' (' + d.price + ')' : '') + '.'), pdfBtn];
    if (d.missing.length) return [el('div', { class: 'card note' }, 'Pièces obligatoires à compléter avant l’envoi : ', el('b', {}, d.missing.join(', ')), '.'), pdfBtn];
    const free = access && access.ok;
    return [el('div', { class: 'card ' + (free ? 'acc' : 'note') }, el('p', { style: 'margin:0' }, access ? access.text : ''), !free && d.price ? el('p', { style: 'margin:6px 0 0' }, 'Prix : ', el('b', {}, d.price)) : null),
      el('button', { onclick: (e) => busy(e.currentTarget, async () => {
        if (!confirm(free ? 'Finaliser le dossier ? Il ne sera plus modifiable et le PDF complet sera disponible.' : 'Envoyer le dossier pour validation ? Il ne sera plus modifiable en attendant.')) return;
        await prepSheets(d); const j = await api.post('dossiers/' + d.id + '/submit'); alert(j.message); show(dossierScreen, d.id, false);
      }) }, free ? 'Finaliser le dossier et obtenir le PDF' : 'Envoyer le dossier pour validation'),
      pdfBtn];
  }

  // Éditeur de planches : celui du site (js/editor.js), branché sur l'API par js/editor-io.js
  function editorScreen({ d, p }) {
    return el('div', {}, back$(), el('h2', {}, p.code + ' – ' + p.title), el('p', { class: 'mu' }, p.help),
      later(async (box) => {
        const j = await api.get('dossiers/' + d.id + '/pieces/' + encodeURIComponent(p.code));
        const u = state.user, root = el('div', { class: 'ed' });
        fill(box, root);
        window.DPEditor.open(root, { id: d.id, c: p.code, t: '', admin: u.role === 'admin', title: p.title.toUpperCase(), head: d.head, wm: true,
          emojis: state.config.emojis || [], base: j.has_base, data: j.data, meta: { titre: d.titre, adresse: d.adresse, parcelle: d.parcelle, owner: u.name } });
      }));
  }
  // Appelé par l'éditeur après l'enregistrement ou sur « Retour au dossier » : on revient à la fiche, rechargée
  window.appNav = { saved: () => back(), back: () => back() };

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
