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

### Variables d'environnement (`.env` à la racine)

| Variable | Rôle | Défaut |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_DB` | Utilisateur et base PostgreSQL | `clinicflow` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | **obligatoire** |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | Secrets JWT (32 caractères minimum) | **obligatoires** |
| `ADMIN_NAME` / `ADMIN_EMAIL` | Compte admin créé par le seed | `Admin` / `admin@example.com` |
| `ADMIN_PASSWORD` | Mot de passe de l'admin | **obligatoire** |
| `BACKEND_PORT` / `FRONT_PORT` | Ports exposés sur la machine | `3000` / `5173` |

Les variables du backend seul (`DATABASE_URL`, `CORS_ORIGIN`, durée des tokens…) sont dans `backend/.env.example`, celle du front (`VITE_API_URL`) dans `front/.env.example`.

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

Une collection Postman est disponible dans [docs/postman](docs/postman/ClinicFlow.postman_collection.json). **Run collection** la lance en entier ; le dossier **Rules & errors** vérifie la règle des 30 minutes et les codes 400 / 401 / 403 / 404 / 409.

## Images Docker (Docker Hub)

**Automatique (CI)** : à chaque push sur `main`, si les tests, le lint et le build passent, GitHub Actions construit et publie deux images :

| Image | Tags |
|---|---|
| `<DOCKERHUB_USERNAME>/clinicflow-backend` | `latest` et le SHA du commit |
| `<DOCKERHUB_USERNAME>/clinicflow-front` | `latest` et le SHA du commit |

À configurer dans le dépôt GitHub (**Settings → Secrets and variables → Actions**) :

| Nom | Type | Rôle |
|---|---|---|
| `DOCKERHUB_USERNAME` | secret | Compte Docker Hub |
| `DOCKERHUB_TOKEN` | secret | Access token Docker Hub (Account settings → Personal access tokens) |
| `VITE_API_URL` | variable | URL de l'API intégrée au front (défaut `http://localhost:3000/api`) |

**Manuel** :
```bash
docker login
docker build -t <user>/clinicflow-backend:latest ./backend
docker build -t <user>/clinicflow-front:latest --build-arg VITE_API_URL=http://localhost:3000/api ./front
docker push <user>/clinicflow-backend:latest
docker push <user>/clinicflow-front:latest
```

**Récupérer les images** :
```bash
docker pull <user>/clinicflow-backend:latest
docker pull <user>/clinicflow-front:latest
```

> `VITE_API_URL` est intégrée au front **au moment du build** : pour un autre domaine, il faut reconstruire l'image du front avec la bonne URL.

## Fonctionnalités

| Module | Ce qu'on peut faire |
|---|---|
| Auth | Connexion, access token JWT et refresh token en cookie `httpOnly`, déconnexion |
| Patients | Créer, modifier, rechercher par nom ou CIN avec pagination. Suppression réservée à l'admin |
| Rendez-vous | Créer, lister par date et par statut, confirmer ou annuler |
| Dashboard | Total patients, rendez-vous du jour, en attente, confirmés |
| Audit | Chaque création, modification ou suppression est enregistrée (`/api/audit-logs`, admin) |

Les fonctionnalités ajoutées en plus du cahier des charges sont listées dans [front/README.md](front/README.md) et [backend/README.md](backend/README.md).

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
| **Front** | React 19, Vite, Tailwind CSS v4, Redux Toolkit + redux-persist, React Router, React Hook Form + Zod, lucide-react |
| **Backend** | Express 5, pg, JWT (jsonwebtoken) + bcrypt, Zod, cookie-parser, cors, express-rate-limit, morgan |
| **Outils** | node-pg-migrate (migrations), nodemon, Supertest (tests), ESLint |

## Base de données

Le schéma de la base de données (ERD) et la justification des relations sont dans [docs/ERD.md](docs/ERD.md).
