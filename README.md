# 🌐 WebCraft MA — Guide d'installation

## Structure dyal Projet

```
web-agency/
├── index.html      ← Site client (page principale + formulaire)
├── admin.html      ← Dashboard admin (visualiser les demandes)
├── server.js       ← Serveur Node.js (backend + API)
├── requests.json   ← Database (fichier JSON)
└── package.json    ← Dependencies
```

---

## 🚀 Démarrer le projet

### 1. Installer les dépendances
```bash
npm install
```

### 2. Démarrer le serveur
```bash
node server.js
```

Ou pour le développement (auto-restart):
```bash
npm run dev
```

### 3. Ouvrir dans le navigateur
- **Site client:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin.html

---

## 🔒 Mot de passe Admin

Le mot de passe par défaut est **`admin123`**

⚠️ Changez-le dans `admin.html` ligne ~180 :
```javascript
const ADMIN_PASSWORD = 'votre-nouveau-mot-de-passe';
```

---

## 📋 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/requests` | Récupérer toutes les demandes |
| `POST` | `/api/requests` | Soumettre une nouvelle demande |
| `PATCH` | `/api/requests/:id` | Changer le statut |
| `DELETE` | `/api/requests/:id` | Supprimer une demande |

---

## 🎨 Personnalisation

### Changer le nom / prix dans index.html:
- Cherchez `WebCraft MA` → remplacez par votre nom
- Les prix sont dans les `<div class="service-price">`

### Changer le port:
```bash
PORT=8080 node server.js
```

---

## 📦 Déploiement (Production)

**Option 1 - VPS avec PM2:**
```bash
npm install -g pm2
pm2 start server.js --name webcraft
pm2 save
```

**Option 2 - Railway / Render:**
- Push le projet sur GitHub
- Connectez à Railway.app ou Render.com
- Deploy automatique!

---

Avec ❤️ — WebCraft MA
