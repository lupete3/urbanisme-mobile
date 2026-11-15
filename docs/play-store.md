# Phase 3 : publication sur Google Play

## 1. Clé de signature (clé d'« upload »)

| Élément | Valeur |
|---|---|
| Fichier de la clé | `C:\Users\Placide\Documents\DOSSIERUrba-cles\dossierurba-upload.jks` (PKCS12, RSA 4096, valable ~27 ans) |
| Alias | `upload` |
| Mots de passe | dans `keystore.properties`, à côté de la clé et dans `android/keystore.properties` |
| Dans Git ? | **Jamais** (`*.jks`, `keystore.properties` sont ignorés) |

⚠️ **Sauvegarder le dossier `DOSSIERUrba-cles`** (clé + `keystore.properties`) hors de ce PC : clé USB, coffre-fort de mots de passe, cloud privé. Sans cette clé, impossible de publier une mise à jour sans passer par le support Google pour la réinitialiser.

On active **Play App Signing** (proposé par défaut à la première publication) : Google garde la clé finale de l'appli, notre clé ne sert qu'à prouver que l'envoi vient de nous. Si elle est perdue, Google peut en enregistrer une nouvelle.

Pour un autre PC : copier le dossier de la clé, puis créer `android/keystore.properties` en adaptant `storeFile`.

## 2. Compiler la version de publication

```bash
npm run aab
```

Résultat : `android/app/build/outputs/bundle/release/app-release.aab`, signé (vérifié par `jarsigner -verify`).

**À chaque nouvelle version** envoyée sur Google Play, augmenter dans `android/app/build.gradle` :
- `versionCode` : entier, +1 à chaque envoi (Google refuse deux fois le même) ;
- `versionName` : version affichée (ex. `1.0.9`) ; garder `APP_VERSION` de `www/js/app.js` identique.

Pour forcer une mise à jour : Admin → Accès et tarifs → versions minimales de l'appli.

## 3. Éléments graphiques (`store/`)

| Fichier | Usage Play Console |
|---|---|
| `store/icone-512.png` | Icône de l'application (512×512) |
| `store/banniere-1024x500.png` | Image de présentation (1024×500) |
| Captures d'écran | **À faire sur le téléphone** : 2 à 8 captures portrait (accueil, fiche du dossier, éditeur avec un plan annoté, PDF). Éviter les données personnelles réelles |

Régénérer les images : `python scripts/store-graphics.py .` (Pillow requis).

## 4. Fiche du Play Store (à recopier)

**Nom** (30 car. max) : `DOSSIERUrba`

**Description courte** (80 car. max) :
> Préparez vous-même votre dossier d'urbanisme : plans annotés et PDF prêt à déposer.

**Description complète** :
> DOSSIERUrba vous aide à constituer vous-même votre dossier de demande d'autorisation d'urbanisme, sans logiciel de dessin.
>
> TROIS TYPES DE DOSSIERS
> • Déclaration préalable (DP) : clôture, abri de jardin, piscine, ravalement, fenêtres…
> • Autorisation préalable d'enseigne (AP)
> • Permis de démolir (PD)
>
> PIÈCE PAR PIÈCE, GUIDÉ
> Pour chaque pièce demandée (plan de situation, plan de masse, photos, insertion…), une aide explique ce qu'il faut fournir. Vous voyez à tout moment ce qui reste à compléter.
>
> UN ÉDITEUR SIMPLE
> • Photo prise avec le téléphone ou image de la galerie
> • Cotes, flèches, textes, formes, émojis
> • Bibliothèque d'objets (arbres, clôtures, véhicules…) à placer à l'échelle
> • Annuler / Rétablir
>
> UN DOSSIER PRÊT À DÉPOSER
> Page de garde, notice et planches sont rassemblées dans un PDF complet, à imprimer ou à envoyer à votre mairie avec le formulaire Cerfa officiel (lien fourni dans l'appli).
>
> UN SEUL COMPTE
> Retrouvez vos dossiers sur le site travaux.pftecho.com et dans l'application.
>
> DOSSIERUrba n'est pas un service de l'administration. La décision appartient à la mairie compétente.

**Catégorie** : Productivité. **Tags** : maison, outils.
**Coordonnées** : e-mail de contact (obligatoire, affiché publiquement), site `https://travaux.pftecho.com`.
**Règles de confidentialité** : `https://travaux.pftecho.com/?a=privacy`

## 5. Questionnaires de la Play Console (réponses)

**Accès à l'appli** : « Certaines fonctionnalités sont limitées » → fournir un **compte de test** (e-mail + mot de passe d'un compte créé exprès, avec un dossier exemple). Sans cela, Google refuse l'appli.

**Annonces** : Non, l'appli ne contient pas d'annonces.

**Classification du contenu** : catégorie « Utilitaire, productivité, communication ou autre ». Réponses : pas de violence, pas de contenu sexuel, pas de langage grossier, pas de substances, pas de jeux d'argent. Interaction entre utilisateurs : **non** (aucun partage entre comptes). Résultat attendu : PEGI 3 / Tout public.

**Public cible** : **18 ans et plus** (démarche administrative). L'appli n'attire pas spécialement les enfants.

**Appli d'actualités** : non. **Appli de santé** : non. **Identifiant publicitaire** : non utilisé. **Applications gouvernementales** : non (préciser dans la description que ce n'est pas un service officiel, déjà fait).

**Sécurité des données** :

| Question | Réponse |
|---|---|
| Collecte ou partage de données ? | Oui, collecte |
| Données chiffrées en transit ? | Oui (HTTPS) |
| Moyen de demander la suppression ? | Oui, dans l'appli (Mon profil → Supprimer mon compte) et sur `https://travaux.pftecho.com/?a=suppression` |
| Partage avec des tiers ? | Non (Firebase et l'hébergeur agissent comme sous-traitants, ce n'est pas un « partage » au sens de Google) |

| Type de donnée | Collectée | Obligatoire | Finalité |
|---|---|---|---|
| Infos perso → Nom | Oui | Oui | Fonctionnement de l'appli, gestion du compte |
| Infos perso → Adresse e-mail | Oui | Oui | Fonctionnement de l'appli, gestion du compte, communications (lien de réinitialisation) |
| Infos perso → Numéro de téléphone | Oui | **Facultatif** | Gestion du compte |
| Infos perso → Adresse | Oui (adresse du terrain du dossier) | Oui | Fonctionnement de l'appli |
| Photos et vidéos → Photos | Oui | Oui pour faire un dossier | Fonctionnement de l'appli |
| Contenu généré par l'utilisateur (textes, plans annotés) | Oui | Oui | Fonctionnement de l'appli |
| Identifiants de l'appareil (jeton de notification) | Oui | Facultatif (refus des notifications possible) | Fonctionnement de l'appli (notifications) |
| Localisation, contacts, agenda, données financières, santé, historique web | Non | | |

Aucune donnée n'est traitée de façon éphémère seulement ; toutes sont conservées jusqu'à la suppression du compte. L'adresse IP est conservée dans le registre des consentements (preuve RGPD), elle n'est pas utilisée pour localiser.

**Autorisations déclarées** : `INTERNET`, `POST_NOTIFICATIONS`. Pas d'autorisation caméra ni stockage : l'appli passe par l'appareil photo et le sélecteur de photos du système.

## 6. Étapes dans la Play Console

1. Créer le compte développeur **personnel** (25 $), vérifier l'identité et le téléphone. Un compte personnel récent doit aussi prouver qu'il a accès à un appareil Android (appli Play Console sur le téléphone).
2. **Créer l'application** : nom DOSSIERUrba, langue par défaut Français (France), Application, Gratuite. Accepter les règles.
3. Remplir le **tableau de bord** : fiche (section 4), questionnaires (section 5), règles de confidentialité.
4. **Tests → Test fermé** : créer un canal, ajouter la liste des testeurs (adresses Gmail), envoyer `app-release.aab`, accepter Play App Signing, notes de version, puis **Envoyer pour examen** (quelques jours).
5. Envoyer aux testeurs le **lien d'inscription** au test. Ils doivent **accepter le test, installer l'appli et la garder 14 jours** (au moins **12 testeurs**).
6. Après 14 jours : **Demander l'accès en production** (questionnaire sur le test), puis publier en production.

## Historique

| Date | Version | Fait |
|---|---|---|
| 15/11/2026 | 1.0.8 (code 9) | Clé d'upload créée, signature configurée (`npm run aab`), premier AAB signé, icône et bannière, fiche et réponses aux questionnaires |
