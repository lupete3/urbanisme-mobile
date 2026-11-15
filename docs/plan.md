# Phase 2 : application Android

Cahier des charges complet : `docs/plan-mobile.md` dans le dépôt du site.

| Étape | Contenu | État |
|---|---|---|
| 2.1 Projet | Capacitor 8 + Android, identifiant `com.dossierurba.app`, écran provisoire qui vérifie l'API | ✅ 15/11/2026 |
| 2.2 Compte | Écran d'ouverture, consentement, inscription, connexion, mot de passe oublié (à ajouter côté serveur), jeton stocké de façon sécurisée | ⏳ |
| 2.3 Dossiers | Accueil (formule d'accès, zone de la parcelle), liste, création, détail des pièces, lien Cerfa | — |
| 2.4 Éditeur | Reprise de `editor.js` du site, appareil photo natif, galerie, émojis, bibliothèque, Annuler / Rétablir | — |
| 2.5 Envoi et PDF | Page de garde et notice générées sur le téléphone, envoi, téléchargement et partage du PDF | — |
| 2.6 Profil | Modifier ses informations et ses choix, export des données, suppression du compte | — |
| 2.7 Finitions | Icône, écran de démarrage, notifications (Firebase), version minimale, tests sur appareil | — |

## Choix techniques

- **Interface** : HTML / CSS / JavaScript simples dans `www/`, comme le site. On réutilise directement le code de l'éditeur, sans framework ni étape de build.
- **API** : appels `fetch` vers `https://travaux.pftecho.com/api/` avec `Authorization: Bearer <jeton>`. Le serveur autorise déjà l'origine `https://localhost` de l'appli Android (CORS).
- **Plugins Capacitor prévus** : Camera, Filesystem, Share, Preferences, SplashScreen, StatusBar, Push Notifications.
