# Phase 2 : application Android

Cahier des charges complet : `docs/plan-mobile.md` dans le dépôt du site.

| Étape | Contenu | État |
|---|---|---|
| 2.1 Projet | Capacitor 8 + Android, identifiant `com.dossierurba.app`, écran provisoire qui vérifie l'API | ✅ 15/11/2026 |
| 2.2 Compte | Écran d'ouverture, consentement, inscription, connexion, mot de passe oublié, jeton conservé dans le stockage privé de l'appli (Preferences), bouton Retour Android, écran « mise à jour nécessaire », écran hors connexion | ✅ 15/11/2026 |
| 2.3 Dossiers | Accueil (formule d'accès, zone de la parcelle), liste, création, détail des pièces, lien Cerfa | ⏳ |
| 2.4 Éditeur | Reprise de `editor.js` du site, appareil photo natif, galerie, émojis, bibliothèque, Annuler / Rétablir | — |
| 2.5 Envoi et PDF | Page de garde et notice générées sur le téléphone, envoi, téléchargement et partage du PDF | — |
| 2.6 Profil | Modifier ses informations et ses choix, export des données, suppression du compte | — |
| 2.7 Finitions | Icône, écran de démarrage, notifications (Firebase), version minimale, tests sur appareil | — |

## Choix techniques

- **Interface** : HTML / CSS / JavaScript simples dans `www/`, comme le site. On réutilise directement le code de l'éditeur, sans framework ni étape de build.
- **API** : appels `fetch` vers `https://travaux.pftecho.com/api/` avec `Authorization: Bearer <jeton>`. Le serveur autorise déjà l'origine `https://localhost` de l'appli Android (CORS).
- **Plugins Capacitor prévus** : Camera, Filesystem, Share, Preferences, SplashScreen, StatusBar, Push Notifications.

## Notes de mise en place (15/11/2026)

- **Gradle 8.13** (`android/gradle/wrapper/gradle-wrapper.properties`) au lieu du 8.14.3 proposé par Capacitor : il était déjà installé sur le poste, et le téléchargement du 8.14.3 échouait (délai dépassé). Il est compatible avec l'Android Gradle Plugin 8.13.0 du projet. Délai réseau du wrapper porté à 180 s.
- `android/local.properties` (non versionné) : `sdk.dir=C:/Users/Placide/AppData/Local/Android/Sdk`, avec des barres obliques normales. Les barres inverses non doublées provoquent l'erreur « Invalid file path ».
- La compilation demande **Java 21** : `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`. Android Studio l'utilise automatiquement.
- Premier APK de test compilé : `android/app/build/outputs/apk/debug/app-debug.apk`. L'API en ligne répond, et l'origine `https://localhost` est autorisée.

## Organisation du code (`www/`)

| Fichier | Rôle |
|---|---|
| `index.html` | Coquille : écran d'ouverture, zone d'affichage, chargement des scripts |
| `css/app.css` | Styles (couleurs du logo, mode sombre, zones sûres de l'écran) |
| `js/api.js` | Client de l'API (`window.api`) et stockage du jeton (Preferences dans l'appli, localStorage dans un navigateur) |
| `js/app.js` | Navigation (historique et bouton Retour) et écrans |

**Tester dans un navigateur** : servir `www/` à côté d'une copie du site (même origine), puis dans la console : `localStorage.setItem('api','/api.php?r=')`. Sinon, l'appli appelle l'API en ligne.

**Logo** : l'icône (`mipmap-*`) et l'écran de démarrage natif (`drawable*/splash.png`) sont générés à partir du logo DOSSIERUrba.

**Testé le 15/11/2026** (navigateur, format mobile, copie locale du site) : écran d'ouverture, connexion, inscription refusée sans la case obligatoire, fenêtre des textes légaux, inscription et accueil, reconnexion automatique au redémarrage, déconnexion, compte existant renvoyé vers le consentement puis accueil, mot de passe oublié (demande, lien, nouveau mot de passe accepté par l'API, lien à usage unique). APK debug compilé.
