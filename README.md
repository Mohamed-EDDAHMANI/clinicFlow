# ClinicFlow

## Introduction

ClinicFlow est une application web (PERN) qui permet à une petite clinique de gérer ses patients, ses rendez-vous et ses utilisateurs (admin / staff).
Elle propose aussi un dashboard simple avec les statistiques du jour : total patients, rendez-vous du jour, nombre de rendez-vous pending et confirmed.

## Démarrage rapide (Docker)

**Prérequis :** Docker et Docker Compose.

1. Copier le fichier d'environnement :
   ```bash
   cp .env.example .env
   ```
2. Remplir dans `.env` : `POSTGRES_PASSWORD`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` et `ADMIN_PASSWORD`.
   Pour générer un secret JWT :
   ```bash
   openssl rand -hex 32
   ```
3. Lancer le projet :
   ```bash
   docker compose up --build
   ```
4. Ouvrir http://localhost:5173 et se connecter avec un des comptes ci-dessous.

Au démarrage, le backend lance les migrations puis le seed. Le seed peut être relancé sans créer de doublons.

| Service | URL |
|---|---|
| Front (React, servi par nginx) | http://localhost:5173 |
| Backend (API) | http://localhost:3000/api |
| PostgreSQL | interne au réseau Docker |

Les ports se changent avec `BACKEND_PORT` et `FRONT_PORT` dans `.env`.

**Mode développement** (rechargement automatique du front et du backend) :
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Repartir d'une base vide** (supprime toutes les données) :
```bash
docker compose down -v
```

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | valeur de `ADMIN_EMAIL` (par défaut `admin@example.com`) | valeur de `ADMIN_PASSWORD` |
| Staff | `sara.benali@clinicflow.ma` | `staff123` |
| Staff | `youssef.elamrani@clinicflow.ma` | `staff123` |

Le seed crée aussi 5 patients et 10 rendez-vous répartis autour de la date du jour.

## Lancer sans Docker

**Prérequis :** Node.js 24 (la version utilisée par Docker et la CI) et PostgreSQL 15+ (avec les extensions `pgcrypto`, `pg_trgm` et `btree_gist`, incluses dans une installation standard).

**Backend**
```bash
cd backend
npm install
cp .env.example .env    # remplir DATABASE_URL, les secrets JWT et ADMIN_PASSWORD
npm run migrate:up      # crée les tables
npm run seed            # admin, staff, patients et rendez-vous de démo
npm run dev             # API sur http://localhost:3000/api
```

**Front**
```bash
cd front
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:3000/api
npm run dev             # http://localhost:5173
```

## Tests

```bash
cd backend
npm test
```

Les tests d'intégration (node:test + Supertest) utilisent la base de `DATABASE_URL`. Ils créent leurs propres données puis les suppriment.
La CI GitHub Actions lance les tests backend, le lint et le build du front, puis publie les images Docker sur Docker Hub à chaque push sur `main`.

Une collection Postman est disponible dans [docs/postman](docs/postman/ClinicFlow.postman_collection.json).

## Fonctionnalités

| Module | Ce qu'on peut faire |
|---|---|
| Auth | Connexion, access token JWT et refresh token en cookie `httpOnly`, déconnexion |
| Patients | Créer, modifier, rechercher par nom ou CIN avec pagination. Suppression réservée à l'admin |
| Rendez-vous | Créer, lister par date et par statut, confirmer ou annuler |
| Dashboard | Total patients, rendez-vous du jour, en attente, confirmés |
| Audit | Chaque création, modification ou suppression est enregistrée (`/api/audit-logs`, admin) |

## Choix techniques

- **Règle des 30 minutes** : une contrainte `EXCLUDE` dans PostgreSQL empêche deux rendez-vous confirmés d'un même patient à moins de 30 minutes. La base garantit la règle, même en cas de requêtes simultanées.
- **Fuseau horaire** : les dates sont stockées en UTC. Le backend calcule la date et l'heure locales dans le fuseau de la clinique (`Africa/Casablanca`), et le front affiche ces valeurs telles quelles.
- **Soft delete** : un patient supprimé (et ses rendez-vous) est marqué `deleted_at` au lieu d'être effacé, pour garder l'historique.
- **Rate limit** : 20 requêtes par seconde par IP sur l'API et 3 tentatives de connexion par seconde, pour bloquer les bots.

## Installation du projet (scaffolding)

Le projet a été généré avec deux CLI de scaffolding que j'ai créés et publiés sur npm :

- [`create-simo-app`](https://www.npmjs.com/package/create-simo-app) : starter React pour le frontend
- [`create-simo-api`](https://www.npmjs.com/package/create-simo-api) : starter Express + PostgreSQL pour le backend

```bash
mkdir clinicFlow && cd clinicFlow
npm create simo-app@latest front
npm create simo-api@latest backend
```

Chaque commande copie un template prêt à l'emploi, installe les dépendances et, pour le backend, génère un `.env` avec des secrets JWT aléatoires.

### Librairies

| | Librairies |
|---|---|
| **Front** | React 19, Vite, Tailwind CSS v4, Redux Toolkit + redux-persist, React Router, React Hook Form + Zod |
| **Backend** | Express 5, pg, JWT (jsonwebtoken) + bcrypt, Zod, cookie-parser, cors, express-rate-limit, morgan |
| **Outils** | node-pg-migrate (migrations), nodemon, Supertest (tests), ESLint |

## Base de données

Le schéma de la base de données (ERD) et la justification des relations sont dans [docs/ERD.md](docs/ERD.md).
