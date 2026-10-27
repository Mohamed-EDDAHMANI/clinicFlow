# ClinicFlow

## Introduction

ClinicFlow est une application web (PERN) qui permet à une petite clinique de gérer ses patients, ses rendez-vous et ses utilisateurs (admin / staff).
Elle propose aussi un dashboard simple avec les statistiques du jour : total patients, rendez-vous du jour, nombre de rendez-vous pending et confirmed.

## Partie 1 : Installation du projet

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
