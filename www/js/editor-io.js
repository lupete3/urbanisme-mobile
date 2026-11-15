// Branche l'éditeur de planches du site (js/editor.js, copié depuis le dépôt du site) sur l'API et l'appareil photo natif.
// Doit être chargé APRÈS api.js et AVANT editor.js.
(() => {
  // Boîtes de dialogue utilisées par l'éditeur (sur le site, elles viennent de ui.js)
  if (!window.dlg) window.dlg = {
    alert: (m) => Promise.resolve(alert(m)),
    confirm: (m) => Promise.resolve(confirm(m)),
    prompt: (m, v = '') => Promise.resolve(prompt(m, v)),
  };
  const Cam = api.plugin('Camera');
  const shot = async (source) => (await Cam.getPhoto({ source, resultType: 'dataUrl', quality: 85, width: 2400, correctOrientation: true })).dataUrl;
  const piece = (id, c) => 'dossiers/' + id + '/pieces/' + encodeURIComponent(c);
  const res = async (f) => { try { await f(); return { ok: 1 }; } catch (e) { return { ok: 0, err: e.message }; } };
  window.EDITOR_IO = {
    libImg: (id) => api.image('library/' + id + '/image'),
    libList: async () => (await api.get('library')).items,
    libSave: (fd) => res(() => api.post('library', fd)),
    libDel: (id) => api.del('library/' + id),
    save: (fd) => res(() => api.post(piece(fd.get('id'), fd.get('c')), fd)),
    saved: (cfg) => window.appNav && window.appNav.saved(cfg),
    backHref: () => '#',
    back: () => window.appNav && window.appNav.back(),
    base: (cfg) => api.image(piece(cfg.id, cfg.c) + '/base'),
    camera: Cam ? () => shot('CAMERA') : null,
    gallery: Cam ? () => shot('PHOTOS') : null,
  };
})();
