// Filet de sécurité du démarrage (écrit en JavaScript ancien pour tous les WebView Android).
// - toute erreur JavaScript est affichée à l'écran au lieu de bloquer sur le logo ;
// - si l'appli n'a pas démarré après 10 secondes, le logo disparaît et un message s'affiche.
(function () {
  var errors = [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hideSplash() { var s = document.getElementById('splash'); if (s && s.parentNode) s.parentNode.removeChild(s); }
  function panel(title, detail) {
    hideSplash();
    var v = document.getElementById('view'); if (!v) return;
    v.innerHTML = '<div class="card"><h2>' + esc(title) + '</h2><p>Vérifiez votre connexion à Internet, puis réessayez. Si le problème continue, envoyez une capture de cet écran à l’équipe DOSSIERUrba.</p>' +
      (detail ? '<p class="err" style="word-break:break-word">' + esc(detail) + '</p>' : '') +
      '<button type="button" onclick="location.reload()">Réessayer</button></div>';
  }
  window.bootError = function (msg) { errors.push(msg); };
  window.addEventListener('error', function (e) { errors.push((e.message || 'Erreur') + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '')); if (!window.appStarted) panel('Erreur au démarrage', errors.join(' | ')); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; errors.push('Promesse : ' + (r && r.message ? r.message : String(r))); });
  setTimeout(function () { if (!window.appStarted) panel('Le démarrage prend trop de temps', errors.join(' | ') || 'Aucune réponse du serveur DOSSIERUrba.'); }, 10000);
})();
