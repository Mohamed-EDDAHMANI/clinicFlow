# ClinicFlow — Front

React 19 + Vite + Tailwind CSS v4. Installation et lancement : voir le [README principal](../README.md).

## En plus du cahier des charges

- **Session silencieuse** : refresh automatique du token sur 401, une seule requête même si plusieurs appels échouent.
- **Thème clair / sombre**, mémorisé dans le navigateur.
- **Recherche globale** de patients dans la barre du haut (raccourci `/`).
- **Fiche patient en panneau latéral** : rendez-vous à venir et historique.
- **Planning hebdomadaire** : créneaux cliquables, ligne de l'heure actuelle, chevauchements côte à côte.
- **Graphique de la semaine** sur le dashboard.
- **Fenêtres déplaçables** (glisser le titre, double-clic pour recentrer).
- **Export CSV** des patients.
- **État dans l'URL** : filtres, pages, fenêtres et fiche ouverte se partagent par lien.
- **Écran sans scroll** sur ordinateur, zones longues défilant en interne.
- **Responsive** : menu latéral rétractable, fenêtres en bas d'écran sur mobile.
- **Animations** : apparition en cascade, compteurs animés, barres, ECG sur la page de connexion (désactivées si « réduire les animations »).
- **Fuseau de la clinique** pour « aujourd'hui » et les heures.
- **Validation Zod côté client** identique au backend, erreurs de l'API affichées sous le bon champ.
- **Confirmations et notifications** (toasts) pour chaque action.
- **Connexion** : afficher le mot de passe, alerte Verr. Maj.
