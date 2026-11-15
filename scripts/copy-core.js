// Copie le module de base de Capacitor (registerPlugin, Plugins…) dans www/js/.
// Nécessaire car l'appli n'utilise pas d'outil de build : sans lui, les plugins natifs sont inaccessibles.
const fs = require('fs'), path = require('path');
fs.copyFileSync(path.join(__dirname, '..', 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js'), path.join(__dirname, '..', 'www', 'js', 'capacitor.js'));
console.log('capacitor.js copié dans www/js/');
