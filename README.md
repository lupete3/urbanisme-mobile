# DOSSIERUrba Mobile

Application mobile **Android** (puis iPhone) de DOSSIERUrba, construite avec **Capacitor 8**. Elle utilise l'API du site : `https://travaux.pftecho.com/api/` (documentation : `docs/api.md` du dépôt du site).

- Identifiant : `com.dossierurba.app`
- Nom affiché : DOSSIERUrba
- Code de l'interface : `www/` (HTML / CSS / JavaScript, sans bundler)
- Projet Android natif : `android/` (généré par Capacitor, à ouvrir dans Android Studio)

## Prérequis

- Node.js 22 ou plus
- Android Studio récent, avec le SDK Android 36
- Java 21 (celui fourni avec Android Studio : `C:\Program Files\Android\Android Studio\jbr`)

## Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe les dépendances |
| `npm run sync` | Copie `www/` dans le projet Android et met à jour les plugins |
| `npm run open` | Ouvre le projet dans Android Studio |
| `npm run apk` | Compile une version de test (APK debug) dans `android/app/build/outputs/apk/debug/` |

Après chaque modification de `www/`, lancer `npm run sync`, puis relancer l'appli depuis Android Studio (bouton ▶).

## Tester sur un appareil

- **Émulateur** : Android Studio → Device Manager → créer un appareil (ex. Pixel, Android 15 ou plus récent) → ▶.
- **Téléphone** : activer les « Options pour les développeurs » et le « Débogage USB », brancher le téléphone, accepter l'autorisation, puis ▶ dans Android Studio.

## Documentation

- [docs/plan.md](docs/plan.md) : étapes de la phase 2 et avancement
