// Copie dans www/js/ les scripts qui viennent d'ailleurs (l'appli n'utilise pas d'outil de build) :
// - capacitor.js : module de base de Capacitor (registerPlugin…), sans lui les plugins natifs sont inaccessibles ;
// - editor.js : éditeur de planches du site (dépôt « urbanisme »), source unique pour le site et l'appli.
//   Chemin du site : variable SITE_DIR, sinon ../dp. Si le site est absent, la copie déjà versionnée est conservée.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), js = path.join(root, 'www', 'js');
fs.copyFileSync(path.join(root, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js'), path.join(js, 'capacitor.js'));
console.log('capacitor.js copié');
const site = process.env.SITE_DIR || path.join(root, '..', 'dp');
const ed = path.join(site, 'assets', 'editor.js');
if (fs.existsSync(ed)) { fs.copyFileSync(ed, path.join(js, 'editor.js')); console.log('editor.js copié depuis ' + ed); }
else console.warn('Site introuvable (' + ed + ') : editor.js non mis à jour');

// build.js : options connues seulement au moment de la compilation
const push = fs.existsSync(path.join(root, 'android', 'app', 'google-services.json'));
fs.writeFileSync(path.join(js, 'build.js'), ['// Généré par scripts/copy-core.js : ne pas modifier', 'window.BUILD = ' + JSON.stringify({ push, date: new Date().toISOString().slice(0, 10) }) + ';', ''].join('\n'));
console.log('build.js : notifications push ' + (push ? 'activées' : 'désactivées (pas de android/app/google-services.json)'));
