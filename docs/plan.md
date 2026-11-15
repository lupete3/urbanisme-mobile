# Phase 2 : application Android

Cahier des charges complet : `docs/plan-mobile.md` dans le dépôt du site.

| Étape | Contenu | État |
|---|---|---|
| 2.1 Projet | Capacitor 8 + Android, identifiant `com.dossierurba.app`, écran provisoire qui vérifie l'API | ✅ 15/11/2026 |
| 2.2 Compte | Écran d'ouverture, consentement, inscription, connexion, mot de passe oublié, jeton conservé dans le stockage privé de l'appli (Preferences), bouton Retour Android, écran « mise à jour nécessaire », écran hors connexion | ✅ 15/11/2026 |
| 2.3 Dossiers | Accueil (formule d'accès, zone de la parcelle, liste avec avancement), création DP / AP / PD (PC / PL / AT « pas encore disponible »), fiche du dossier (Cerfa, pièces avec aides, planches avec filigrane, notice DP11 / PD9), modifier un dossier en attente, supprimer un dossier | ✅ 15/11/2026 |
| 2.4 Éditeur | Éditeur du site réutilisé (`www/js/editor.js`, copié par `npm run sync`), branché sur l'API par `www/js/editor-io.js` : appareil photo et galerie natifs (plugin Camera), annotations, émojis, bibliothèque (y compris objets partagés), Annuler / Rétablir, filigrane BROUILLON, enregistrement puis retour à la fiche | ✅ 15/11/2026 |
| 2.5 Envoi et PDF | Page de garde et notice dessinées sur le téléphone (fonctions partagées de `editor.js`), envoi selon la formule d'accès (finalisé tout de suite si gratuit, sinon en attente de paiement avec le prix), aperçu filigrané, PDF complet enregistré dans le cache puis partagé (plugins Filesystem et Share) | ✅ 15/11/2026 |
| 2.6 Profil | Bouton « Mon profil » sur l'accueil ; informations (nom, e-mail, téléphone), mot de passe (déconnecte les autres appareils), consentements facultatifs et textes légaux, export des données (JSON partagé), suppression du compte avec mot de passe (exigence Google Play), déconnexion | ✅ 15/11/2026 |
| 2.7 Finitions | Écran Notifications (compteur de non lues, ouverture du dossier concerné), actualisation au retour dans l'appli, notifications push prêtes (activées dès que `android/app/google-services.json` est présent, voir `docs/notifications.md` du site), écran de démarrage unique (plugin SplashScreen, masqué dès que l'appli est prête, 4 s au plus) | ✅ 15/11/2026 |

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
| `js/editor-io.js` | Branche l'éditeur sur l'API et l'appareil photo ; boîtes de dialogue |
| `js/editor.js` | Éditeur de planches du site (copie, ne pas modifier ici : modifier `assets/editor.js` du site puis `npm run sync`) |
| `js/build.js` | Généré par `npm run sync` : options de compilation (notifications push actives ou non) |
| `js/app.js` | Navigation (historique et bouton Retour) et écrans |

**Tester dans un navigateur** : servir `www/` à côté d'une copie du site (même origine), puis dans la console : `localStorage.setItem('api','/api.php?r=')`. Sinon, l'appli appelle l'API en ligne.

**Logo** : l'icône (`mipmap-*`) et l'écran de démarrage natif (`drawable*/splash.png`) sont générés à partir du logo DOSSIERUrba.

**Testé le 15/11/2026** (navigateur, format mobile, copie locale du site) : écran d'ouverture, connexion, inscription refusée sans la case obligatoire, fenêtre des textes légaux, inscription et accueil, reconnexion automatique au redémarrage, déconnexion, compte existant renvoyé vers le consentement puis accueil, mot de passe oublié (demande, lien, nouveau mot de passe accepté par l'API, lien à usage unique). APK debug compilé.

## Leçons de la mise au point (15/11/2026)

- **Plugins natifs sans outil de build** : `Capacitor.registerPlugin` n'existe pas dans le seul pont natif d'Android. Il faut charger le module de base `www/js/capacitor.js`, copié depuis `node_modules/@capacitor/core/dist/` par `npm run sync` (`scripts/copy-core.js`). Toujours utiliser `npm run sync`, et non `npx cap sync` seul. Symptôme observé en 1.0.0 : appli bloquée sur le logo. En 1.0.1 : message « C.registerPlugin is not a function ».
- **Filet de sécurité** (`www/js/boot.js`) : toute erreur au démarrage s'affiche à l'écran. Après 10 s sans démarrage, un message remplace le logo. Les appels réseau ont un délai de 20 s, et le stockage natif un délai de 4 s, avec repli sur localStorage.
- **Versions de test** : 1.0.0 (bloquée), 1.0.1 (diagnostic), 1.0.2 (correction des plugins), validée sur le téléphone du client le 15/11/2026.

**Testé le 15/11/2026, étape 2.3** (navigateur, format mobile, copie locale du site) : liste et avancement, ouverture d'un dossier, planche protégée affichée (filigrane BROUILLON), notice enregistrée (pièces manquantes mises à jour), choix du type (PC / PL / AT désactivés), création d'un AP (7 pièces), retour à l'accueil, suppression d'un dossier. APK 1.0.3 compilé, lancé sur un émulateur Android 15 relié au site en ligne (écran de démarrage puis connexion). Icône adaptative réduite pour ne plus être rognée sur l’écran de démarrage d’Android 12 et plus.

**Testé le 15/11/2026, étape 2.4** (navigateur, format mobile, copie locale du site) : éditeur du site sans régression (photo collée, objet de bibliothèque, enregistrement) ; dans l'appli : ouverture de l'éditeur AP5, objet partagé par l'admin chargé via l'API, émoji, enregistrement, retour à la fiche (pièce cochée, avancement 1 / 7), réouverture avec photo et annotations rechargées. APK 1.0.4 compilé. Appareil photo natif : à vérifier sur téléphone.

**Testé le 15/11/2026, étape 2.5** (navigateur, copie locale du site) : notice PD9 cochée dès que le texte est rempli, aperçu PDF filigrané téléchargé, finalisation en mode gratuit (dossier « Débloqué »), PDF complet sans filigrane, page de garde et notice générées correctement. APK 1.0.5 compilé. Partage du PDF : validé sur le téléphone du client.

**Testé le 15/11/2026, étape 2.6** (navigateur, copie locale du site) : infos enregistrées côté serveur, mauvais mot de passe refusé puis changement réussi, choix de consentement enregistrés, export JSON, suppression du compte (retour à la connexion, connexion ensuite refusée). APK 1.0.6 compilé.

**Testé le 15/11/2026, étape 2.7** (navigateur, copie locale du site) : compteur de notifications sur l'accueil, écran Notifications (non lue mise en avant, marquée lue), enregistrement d'un téléphone (`me/device`), chaîne d'envoi Firebase avec une clé factice (jeton signé, refus de Google noté au journal sans bloquer). APK 1.0.7 compilé (notifications push désactivées tant que `google-services.json` est absent).

**Firebase (15/11/2026)** : projet `dossierurba-f9a48`, appli `com.dossierurba.app`. `android/app/google-services.json` placé sur le poste de développement (non versionné, à conserver aussi en lieu sûr). APK 1.0.8 compilé avec les notifications push actives : notification de test reçue sur le téléphone du client. Clé du compte de service : à coller dans Admin → Accès et tarifs (jamais dans Git).
