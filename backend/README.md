# Simo API

API Express 5 + PostgreSQL.

## Démarrage

```bash
npm install
cp .env.example .env      # si .env n'existe pas, puis remplir DATABASE_URL
npm run migrate:up
npm run seed              # crée l'admin du .env
npm run dev
```

Générer un secret JWT :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Structure

```
app.js           app Express (middlewares, routes)
index.js         lance le serveur
config/          env (validé avec Zod), db, permissions
routes/          auth, user
controllers/     req/res seulement
services/        logique métier
models/          requêtes SQL
middlewares/     auth, authorize, validate, rateLimit, errors
validations/     schémas Zod
utils/           AppError, verifyToken
migrations/
seeds/
tests/
```

## Routes

| Route | Accès |
|---|---|
| `POST /api/auth/login` | public |
| `POST /api/auth/refresh` · `logout` | cookie `refreshToken` |
| `GET /api/auth/me` | connecté |
| `GET /api/user/getAll` | admin |
| `POST /api/user/create` | connecté (seul l'admin choisit le rôle) |

## Fonctionnement

- **Auth** : access token JWT (`ACCESS_TOKEN_EXPIRES_IN`, 15m par défaut) dans `Authorization: Bearer`, refresh token (`REFRESH_TOKEN_EXPIRES_DAYS`, 7 j par défaut) en cookie `httpOnly`, stocké hashé dans `refresh_tokens`. Rotation à chaque refresh ; un token réutilisé révoque toutes les sessions de l'utilisateur.
- **Permissions** : `authorize('PERMISSION')` sur la route, rôles autorisés dans `config/permissions.js`.
- **Validation** : `validate(schema)` pour le body, `validate(schema, 'params')` pour les paramètres.
- **Erreurs** : `throw new AppError(message, status)` dans les controllers (pas de try/catch). `errorHandler` renvoie du JSON, convertit les erreurs PostgreSQL (doublon → 409) et renvoie 404 pour les routes inconnues.
- **Env** : le serveur refuse de démarrer si une variable manque ou est invalide.
- **Logs** : morgan (`dev` en développement, `combined` en production).
- **Rate limit** : 100 requêtes / 15 min par IP sur `/api`.
