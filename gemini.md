# GEMINI.md — Spécifications MVP : Plateforme Babysitting

## 1. Philosophie du MVP & Choix d'Architecture Uniques

Pas d'options multiples ni de sur-ingénierie. Chaque brique technique est figée pour livrer un MVP fonctionnel, maintenable et rapide à développer.

* **Stack Technique Figée :**
  * **Frontend :** React 18 + Vite + TypeScript + Tailwind CSS + React Router v6.
  * **Backend :** Python 3.12 + FastAPI + SQLAlchemy (Async) + Pydantic v2.
  * **Base de données :** PostgreSQL 16 (unique base de données pour tout : utilisateurs, profils, réservations, avis, messages — pas de Redis ni de MongoDB).
  * **Messagerie :** Polling court (toutes les 5 secondes via React Query / TanStack Query) sur l'API REST (pas de WebSockets pour le MVP).
  * **Stockage Fichiers :** Dossier local `/uploads` servi en statique par FastAPI (pas de S3).
  * **Authentification :** JWT stocké en `localStorage` via header `Authorization: Bearer <token>`, hachage `bcrypt`, 4 rôles stricts : `VISITOR`, `PARENT`, `BABYSITTER`, `ADMIN`.
  * **Déploiement Local / Prod :** Un seul `docker-compose.yml` avec 3 conteneurs (`frontend`, `backend`, `db`).

---

## 2. Architecture des Pages (8 Pages Fixes)

L'application entière tient sur **exactement 8 routes**. Aucune page supplémentaire ne doit être créée.

| Route | Nom de la Page | Accès | Responsabilités & Composants Clés |
| :--- | :--- | :--- | :--- |
| `/` | **Accueil** | Public (`VISITOR`) | Présentation du service, barre de recherche rapide (ville), aperçu de 3 babysitters vérifiés, CTA inscription. |
| `/auth` | **Connexion / Inscription** | Public (`VISITOR`) | Onglets `Connexion` / `Inscription` avec sélecteur de rôle (`Parent` ou `Babysitter`). |
| `/search` | **Recherche Babysitters** | Public & `PARENT` | Barre de filtres latérale/haute (**âge min/max**, **tarif horaire max**, **ville/code postal**) + grille de cartes babysitters. |
| `/babysitters/:id` | **Profil Babysitter & Réservation** | Public & `PARENT` | Détails complets (bio, âge, tarifs, badges de vérification, liste des avis) + **Formulaire de réservation intégré** (date, heures, nb enfants) + bouton "Contacter". |
| `/offers` | **Offres de Babysitting** | `BABYSITTER` & `PARENT` | Liste filtrable des annonces publiées par les parents. Bouton "Publier une offre" (modale pour les parents) et bouton "Postuler / Contacter" (pour les babysitters). |
| `/messages` | **Messagerie** | `PARENT` & `BABYSITTER` | Vue scindée (Split-view) : liste des conversations à gauche, fil de messages à droite avec envoi instantané et statut des réservations liées. |
| `/dashboard` | **Espace Personnel** | `PARENT` & `BABYSITTER` | **Si Parent :** Suivi des réservations (en attente, acceptées, à noter) + gestion de ses offres.<br>**Si Babysitter :** Formulaire d'édition de profil + upload pièce d'identité/diplôme + gestion des demandes de garde (Accepter/Refuser). |
| `/admin` | **Administration** | `ADMIN` uniquement | 2 onglets uniques : **1. Vérifications** (approuver/rejeter les justificatifs d'identité) et **2. Modération** (suspendre un compte ou supprimer un avis signalé). |

---

## 3. Modèle de Données (7 Tables PostgreSQL)

1. **`users`** : `id`, `email`, `password_hash`, `role` (`PARENT`, `BABYSITTER`, `ADMIN`), `is_active` (bool), `created_at`
2. **`profiles`** *(Table unique fusionnée pour simplifier)* : `user_id` (PK/FK), `first_name`, `last_name`, `city`, `postal_code`, `avatar_url`, `bio`, `birth_date` (nullable), `hourly_rate` (float, nullable), `experience_years` (int, nullable), `is_verified` (bool, default `False`), `verification_doc_url` (nullable), `verification_status` (`NONE`, `PENDING`, `APPROVED`, `REJECTED`)
3. **`offers`** : `id`, `parent_id` (FK), `title`, `description`, `date`, `start_time`, `end_time`, `hourly_rate`, `city`, `status` (`OPEN`, `CLOSED`)
4. **`bookings`** : `id`, `parent_id` (FK), `babysitter_id` (FK), `date`, `start_time`, `end_time`, `children_count`, `notes`, `total_price`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`)
5. **`conversations`** : `id`, `parent_id` (FK), `babysitter_id` (FK), `updated_at`
6. **`messages`** : `id`, `conversation_id` (FK), `sender_id` (FK), `content`, `created_at`
7. **`reviews`** : `id`, `booking_id` (FK unique), `parent_id` (FK), `babysitter_id` (FK), `rating` (1-5), `comment`, `created_at`

---

## 4. Structure des Dossiers du Projet

```text
babysitting-mvp/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py              # Point d'entrée FastAPI, CORS, montage /uploads
│   │   ├── database.py          # Connexion PostgreSQL & Session SQLAlchemy
│   │   ├── models.py            # Les 7 modèles SQLAlchemy
│   │   ├── schemas.py           # Schémas Pydantic (Request/Response)
│   │   ├── auth.py              # Hachage bcrypt, création/vérification JWT, dépendances RBAC
│   │   └── routers/
│   │       ├── auth.py          # /api/auth (register, login, me)
│   │       ├── profiles.py      # /api/profiles (search, detail, update, upload-doc)
│   │       ├── offers.py        # /api/offers (list, create, close)
│   │       ├── bookings.py      # /api/bookings (create, list, update-status)
│   │       ├── messages.py      # /api/conversations & /api/messages
│   │       ├── reviews.py       # /api/reviews (create, list by babysitter)
│   │       └── admin.py         # /api/admin (verify-user, toggle-active, delete-review)
│   ├── uploads/                 # Stockage local des avatars et justificatifs
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/                 # Client Axios + intercepteur JWT
    │   ├── context/             # AuthContext (user, role, login, logout)
    │   ├── components/          # Navbar, Footer, BabysitterCard, BookingModal, StarRating
    │   └── pages/               # Exactement les 8 fichiers de pages :
    │       ├── HomePage.tsx
    │       ├── AuthPage.tsx
    │       ├── SearchPage.tsx
    │       ├── BabysitterDetailPage.tsx
    │       ├── OffersPage.tsx
    │       ├── MessagesPage.tsx
    │       ├── DashboardPage.tsx
    │       └── AdminPage.tsx
    └── package.json




```text
# Spécifications du Design System & UI/UX — Plateforme Babysitting MVP

Ce document définit les choix graphiques, ergonomiques et visuels pour garantir une interface moderne, rassurante et 100 % responsive (mobile-first) pour notre MVP.

---

## 1. Identité Visuelle & Charte Graphique

L'objectif est d'inspirer **confiance**, **douceur** et **sécurité** (codes indispensables pour la garde d'enfants) tout en restant dynamique et épuré.

### 🎨 Palette de Couleurs
* **Couleur Primaire (Confiance / Confiance en soi) :** Bleu Nuit / Indigo doux (`#2563EB` — Tailwind `blue-600`) pour les boutons d'action principaux, les liens et la barre de navigation.
* **Couleur Secondaire (Chaleur / Bienveillance) :** Pêche / Corail pastel (`#F97316` ou `#FB923C` — Tailwind `orange-500` / `orange-400`) pour les badges, les mises en avant et le bouton CTA principal ("Réserver").
* **Couleurs de Fond & Neutres :**
  * Fond général : Blanc pur (`#FFFFFF`) et Gris très clair (`#F8FAFC` — Tailwind `slate-50`) pour structurer les cartes.
  * Texte principal : Gris anthracite (`#1E293B` — Tailwind `slate-800`) pour un confort de lecture optimal.
  * Texte secondaire : Gris moyen (`#64748B` — Tailwind `slate-500`).
* **Couleurs d'État :**
  * Succès / Vérifié : Vert émeraude (`#10B981`) pour les badges "Profil Vérifié" et statuts acceptés.
  * Alerte / En attente : Jaune ambre (`#F59E0B`) pour les réservations en attente ou documents en cours de modération.
  * Erreur / Refusé : Rouge doux (`#EF4444`).

### ✍️ Typographie
* **Police de caractères :** `Inter` ou `Plus Jakarta Sans` (via Google Fonts) pour un rendu moderne, géométrique et parfaitement lisible sur petits écrans (smartphones).
* **Hiérarchie :**
  * Titres (H1, H2) : `font-bold text-slate-900` (ex: H1 en `text-2xl md:text-4xl`).
  * Corps de texte : `text-sm md:text-base text-slate-700`.

---

## 2. Structure et Composants Clés (UI Kit)

### 🧭 Navigation (Navbar & Footer)
* **Desktop :** Barre fixe en haut avec logo à gauche, liens de navigation au centre (`Accueil`, `Rechercher`, `Offres`, `Messages`), et boutons de compte / déconnexion à droite.
* **Mobile :** Logo centré, menu hamburger à gauche ouvrant un panneau latéral coulissant (*drawer*), et icône de messagerie / profil rapide à droite.
* **Footer :** Épuré, liens de bas de page (Mentions légales, Contact, Aide) sur fond `slate-900` avec texte blanc/gris clair.

### 🎴 Les Cartes Babysitter (Grille de Recherche)
* **Design :** Carte blanche sur fond gris clair, coins arrondis (`rounded-2xl`), ombre légère (`shadow-sm hover:shadow-md transition-shadow`).
* **Contenu de la carte :**
  * Avatar rond avec bordure subtile et **badge de vérification vert** superposé si `is_verified == true`.
  * Prénom, **âge calculé automatiquement**, et ville.
  * Tarif horaire mis en avant en haut à droite (ex: "12 €/h").
  * Courte bio (tronquée à 2 lignes) et note moyenne (étoiles dorées + nombre d'avis).
  * Bouton "Voir le profil" sur toute la largeur de la carte.

### 📱 Formulaires & Modales
* **Champs de saisie :** Bordure grise fine (`border-slate-300`), focus bleu (`ring-2 ring-blue-500`), coins arrondis (`rounded-xl`), label explicite au-dessus du champ.
* **Boutons :** Hauteur confortable (`py-3`), coins arrondis, effet de survol subtil (assombrissement de 10%).
* **Modales (ex: Réservation) :** Fond semi-transparent assombri (`bg-black/50`), boîte blanche centrée avec croix de fermeture en haut à droite, optimisée en plein écran sur mobile.

---

## 3. Maquettes Structurelles (Wireframes Textuels)

# Wireframes Détaillés — Les 8 Pages du MVP Babysitting

Ce document présente un wireframe textuel et structuré pour chacune des **8 pages fixes** de l'application, optimisé en **Mobile-First** (avec indication de l'adaptation Desktop).

---

## Page 1 : Accueil (`/`)
* **Objectif :** Présenter la plateforme, rassurer, et inciter à la recherche ou à l'inscription.
* **Cible :** Visiteur (`VISITOR`)

```text
+-------------------------------------------------------------+
| [ Logo ]                              [ Connexion ] [Inscr] |
+-------------------------------------------------------------+
| HERO SECTION                                                |
| "Trouvez un babysitter de confiance près de chez vous"      |
|                                                             |
| [ Entrez votre ville ou code postal...        ] [ Rechercher|
+-------------------------------------------------------------+
| COMMENT ÇA MARCHE ?                                         |
| [ 1. Recherchez ]   [ 2. Réservez ]   [ 3. Profitez ]       |
+-------------------------------------------------------------+
| BABYSITTERS À LA UNE (Aperçu 3 profils)                     |
| +-----------------+ +-----------------+ +-----------------+ |
| | (Photo) Sophie  | | (Photo) Thomas  | | (Photo) Camille | |
| | 22 ans • Orléans| | 25 ans • Orléans| | 24 ans • Jargeau| |
| | ⭐ 4.9 (14 avis) | | ⭐ 4.7 (8 avis)   | | ⭐ 5.0 (21 avis)| |
| | 12 €/h [Vérifié]| | 14 €/h          | | 13 €/h [Vérifié]| |
| +-----------------+ +-----------------+ +-----------------+ |
+-------------------------------------------------------------+
| FOOTER : Mentions légales | Contact | Aide                  |
+-------------------------------------------------------------+
Page 2 : Connexion / Inscription (/auth)
Objectif : Authentifier ou enregistrer les utilisateurs en séparant les rôles Parent et Babysitter.

Cible : Visiteur (VISITOR)

Plaintext
+-------------------------------------------------------------+
| [ Logo / Retour Accueil ]                                   |
+-------------------------------------------------------------+
|                  [ Connexion ] | [ Inscription ]            |
|                                                             |
|  Sélectionnez votre profil (si inscription) :               |
|  ( o ) Parent (cherche un babysitter)                       |
|  (   ) Babysitter (propose ses services)                    |
|                                                             |
|  Adresse Email :                                            |
|  [                                                        ] |
|                                                             |
|  Mot de passe :                                             |
|  [                                                        ] |
|                                                             |
|  [                   SE CONNECTER                         ] |
+-------------------------------------------------------------+
Page 3 : Recherche de Babysitters (/search)
Objectif : Filtrer et comparer les profils disponibles.

Cible : Public & Parent (PARENT)

Plaintext
+-------------------------------------------------------------+
| [ Logo ]                          [ Offres ] [Msg] [Profil] |
+-------------------------------------------------------------+
| FILTRES DE RECHERCHE                                        |
| [ Ville / CP       v ] [ Tarif max: 15€/h v ] [ Âge min v ] |
+-------------------------------------------------------------+
| 12 babysitters trouvés                                      |
|                                                             |
| +---------------------------------------------------------+ |
| | (Photo) **Sophie Martin** (22 ans)    ⭐ 4.9 (14 avis)  | |
| | 📍 Orléans (45000) • 🛡️ Vérifié                         | |
| | "Étudiante en psycho, sérieuse et douce avec les..."    | |
| |                                     12 €/h | [Voir profil]|
| +---------------------------------------------------------+ |
| +---------------------------------------------------------+ |
| | (Photo) **Thomas Leroy** (25 ans)     ⭐ 4.7 (8 avis)   | |
| | 📍 Orléans (45000)                                      | |
| | "Bafa complet, expériences en centre de loisirs..."     | |
| |                                     14 €/h | [Voir profil]|
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
Page 4 : Profil Babysitter & Réservation (/babysitters/:id)
Objectif : Consulter le profil détaillé et effectuer une demande de garde.

Cible : Public & Parent (PARENT)

Plaintext
+-------------------------------------------------------------+
| < Retour aux résultats                                      |
+-------------------------------------------------------------+
| [PHOTO] Sophie Martin, 22 ans    ⭐ 4.9 (14 avis)           |
| 📍 Orléans (45000)  •  🛡️ Profil Vérifié                    |
| Tarif : 12 €/h                                              |
+-------------------------------------------------------------+
| À PROPOS                                                    |
| "Bonjour, j'ai 3 ans d'expérience auprès d'enfants de 3 à   |
| 10 ans. Titulaire du PSC1 et du BAFA."                      |
+-------------------------------------------------------------+
| AVIS (14)                                                   |
| - "Super avec les enfants, ponctuelle !" (Marie P.)         |
| - "Garde parfaite, je recommande les yeux fermés." (Marc D.)|
+-------------------------------------------------------------+
| RÉSERVER CE BABYSITTER                                      |
| Date : [ JJ/MM/AAAA ]       Nombre d'enfants : [ 2 ]        |
| Heure début : [ 19:00 ]     Heure fin : [ 22:30 ]           |
| Notes / Remarques :                                         |
| [ Prévoir un doudou pour la plus petite...                ] |
|                                                             |
| [              DEMANDER LA RÉSERVATION (42 €)             ] |
+-------------------------------------------------------------+
Page 5 : Offres de Babysitting (/offers)
Objectif : Permettre aux parents de publier des annonces et aux babysitters de les consulter.

Cible : Parent (PARENT) & Babysitter (BABYSITTER)

Plaintext
+-------------------------------------------------------------+
| [ Logo ]                                     [ + Publier ]  |
+-------------------------------------------------------------+
| ANNONCES DE GARDE DISPONIBLES                               |
| [ Filtrer par ville...                                    ] |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| | **Recherche babysitter pour soirée samedi**             | |
| | 📍 Orléans • 📅 15/06/2026 de 19h à 23h • 💰 13 €/h     | |
| | "Besoin d'une personne de confiance pour 2 enfants (3 et  | |
| | 6 ans). Jeux calmes et coucher à 21h."                  | |
| |                                     [ Postuler / Contacter] |
| +---------------------------------------------------------+ |
| +---------------------------------------------------------+ |
| | **Garde régulière les mardis soirs**                    | |
| | 📍 Saint-Jean-de-Braye • 💰 12 €/h                      | |
| |                                     [ Postuler / Contacter] |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
Page 6 : Messagerie (/messages)
Objectif : Permettre l'échange direct entre parents et babysitters.

Cible : Parent (PARENT) & Babysitter (BABYSITTER)
(Note : Vue adaptée desktop en double colonne. Sur mobile, bascule entre la liste et la conversation active).

Plaintext
+-------------------------------------------------------------+
| MESSAGERIE                                                  |
+-------------------------------------------------------------+
| CONVERSATIONS            | DISCUSSION ACTIVE : Sophie Martin|
|                          |                                  |
| 👤 Sophie Martin         | 💬 Sophie : "Bonjour, c'est ok   |
| "Bonjour, c'est ok pour.."| pour samedi 19h !"               |
|                          |                                  |
| 👤 Thomas Leroy          | 💬 Moi : "Parfait, merci à vous!"|
| "Merci pour la garde !"  |                                  |
|                          |                                  |
|                          | [ Écrire un message...       ] > |
+-------------------------------------------------------------+
Page 7 : Espace Personnel / Dashboard (/dashboard)
Objectif : Gérer ses réservations, son profil et ses documents justificatifs.

Cible : Parent (PARENT) & Babysitter (BABYSITTER)

Plaintext
+-------------------------------------------------------------+
| MON ESPACE PERSONNEL                                        |
+-------------------------------------------------------------+
| [ Onglet : Réservations ]  [ Onglet : Mon Profil / Justificatifs ]
+-------------------------------------------------------------+
| MES RÉSERVATIONS EN COURS :                                 |
| - Garde avec Sophie M. • Samedi 15/06 (19h-23h)             |
|   Statut : <span class="text-amber-500">EN ATTENTE</span>   |
| - Garde avec Thomas L. • Mercredi 10/05                     |
|   Statut : <span class="text-emerald-500">ACCEPTÉE</span>   |
|   [ Laisser un avis ] (si complétée)                        |
+-------------------------------------------------------------+
| MON PROFIL (Vue Babysitter) :                               |
| Bio : [ Étudiante en psycho...                          ]   |
| Tarif horaire (€/h) : [ 12 ]                                |
| Pièce d'identité / Diplôme : [ Fichier_ID.pdf ] [ Remplacer ] |
| Statut de vérification : ⏳ En attente de validation        |
|                                                             |
| [               ENREGISTRER LES MODIFICATIONS               ] |
+-------------------------------------------------------------+
Page 8 : Administration (/admin)
Objectif : Modérer les comptes, valider les pièces d'identité et supprimer les contenus signalés.

Cible : Administrateur (ADMIN) uniquement

Plaintext
+-------------------------------------------------------------+
| ESPACE ADMINISTRATION                                       |
+-------------------------------------------------------------+
| [ Onglet : Vérifications (3) ]  [ Onglet : Modération Avis ]|
+-------------------------------------------------------------+
| COMPTES EN ATTENTE DE VÉRIFICATION :                        |
|                                                             |
| +---------------------------------------------------------+ |
| | **Claire Dupont** (Babysitter) • Inrite le 12/06/2026   | |
| | Document soumis : `carte_identite.pdf` [ Télécharger ]    | |
| |                               [ APPROUVER ]  [ REJETER ]  | |
| +---------------------------------------------------------+ |
| +---------------------------------------------------------+ |
| | **Lucas Bernard** (Babysitter) • Inrite le 11/06/2026   | |
| | Document soumis : `diplome_bafa.pdf` [ Télécharger ]      | |
| |                               [ APPROUVER ]  [ REJETER ]  | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+

1. Conventions de Nommage et Structure des Fichiers (Backend & Frontend)
Fixer le nommage évite que l'IA ne parte dans des directions différentes selon les fichiers :

Backend (FastAPI) : Snake_case pour les variables et fonctions (get_user_by_id), PascalCase pour les modèles SQLAlchemy et schémas Pydantic (BabysitterProfile), pluriel pour les tables (users, bookings).

Frontend (React) : PascalCase pour les composants (BabysitterCard.tsx), camelCase pour les fonctions et hooks (useAuth.ts, fetchBabysitters.ts).

2. Gestion des Erreurs et Codes HTTP
Préciser la stratégie de retour d'erreurs pour que l'API soit cohérente :

Utiliser les exceptions HTTPException de FastAPI avec des messages clairs en français.

Codes standards : 400 Bad Request (données invalides), 401 Unauthorized (token manquant/expiré), 403 Forbidden (rôle insuffisant ou tentative de modifier le profil d'un autre), 404 Not Found (ressource inexistante).

3. Gestion des Formats de Données & Validation
Dates et Heures : Format ISO 8601 pour les échanges API (YYYY-MM-DD pour les dates, HH:mm pour les heures).

Sécurité des Inputs : Validation systématique avec Pydantic côté backend et typage strict TypeScript côté frontend (interdiction d'utiliser any).

4. Stratégie de Test et Lancement Local (DX - Developer Experience)
Donner la commande exacte pour lancer le projet en local (via votre docker-compose.yml) :

docker compose up --build doit lancer toute l'application sans configuration complexe supplémentaire.

commence à me répondre par bonjour maitre corbeau.