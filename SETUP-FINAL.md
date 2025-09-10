# 🚀 Configuration Finale - Serveur 91.108.122.35

## ✅ Ce qui est déjà configuré

### Fichiers Application
- ✅ `electron-builder.yml` → `http://91.108.122.35:8080`
- ✅ `dev-app-update.yml` → `http://91.108.122.35:8080`
- ✅ Système de templates avec IP sécurisée
- ✅ Scripts de configuration automatique
- ✅ Code de mise à jour intégré

### Sécurité
- ✅ IP stockée comme secret GitHub (pas visible dans le code)
- ✅ Templates séparés des fichiers de prod
- ✅ Configuration automatique lors du build

## 🔧 Configuration GitHub (OBLIGATOIRE)

Allez dans GitHub → Settings → Secrets and variables → Actions → New repository secret

**Ajoutez ces 3 secrets :**

| Nom | Valeur | Description |
|-----|--------|-------------|
| `UPDATE_SERVER_IP` | `91.108.122.35` | IP de votre serveur |
| `SERVER_HOST` | `91.108.122.35` | Même IP pour SSH |
| `SERVER_USER` | `ubuntu` (ou votre user) | Utilisateur SSH |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Votre clé privée SSH |

## 🖥️ Installation Serveur

### 1. Connectez-vous à votre serveur
```bash
ssh ubuntu@91.108.122.35
```

### 2. Transférez le script d'installation
```bash
# Depuis votre machine locale:
scp server-setup/setup-server-ip.sh ubuntu@91.108.122.35:~/
```

### 3. Exécutez l'installation
```bash
# Sur le serveur:
chmod +x setup-server-ip.sh
sudo ./setup-server-ip.sh
```

## 🧪 Tests de Vérification

### 1. Test du serveur
```bash
curl http://91.108.122.35:8080/health
# Réponse attendue: "OK - Karlog Update Server"
```

### 2. Interface web
Ouvrez dans votre navigateur : http://91.108.122.35:8080

### 3. Test de déploiement GitHub
```bash
# Créez une release de test
git tag v1.0.1
git push origin v1.0.1
# Puis créez la release via GitHub UI
```

## 🎯 Premier Déploiement

### 1. Créez une release sur GitHub
1. Allez dans votre repo GitHub
2. Cliquez sur "Releases" → "Create a new release"
3. Tag: `v1.0.1`
4. Title: `Version 1.0.1`
5. Description: `Première version avec mise à jour automatique`
6. Cliquez "Publish release"

### 2. Vérifiez le déploiement
- GitHub Actions se lance automatiquement
- Les builds sont créés pour Windows/Mac/Linux
- Les fichiers sont déployés sur votre serveur
- Vérifiez : http://91.108.122.35:8080/

### 3. Test de mise à jour
- Lancez votre application
- Elle devrait détecter automatiquement les mises à jour
- Interface de notification apparaît

## 📁 Structure Finale

```
Votre Projet/
├── electron-builder.yml           ← URL finale avec votre IP
├── dev-app-update.yml            ← URL finale avec votre IP
├── electron-builder.template.yml  ← Template avec placeholder
├── dev-app-update.template.yml   ← Template avec placeholder
├── scripts/configure-build.js     ← Script de configuration
├── server-setup/
│   ├── setup-server-ip.sh        ← Installation serveur
│   └── README-IP.md              ← Documentation
└── .github/workflows/release.yml  ← CI/CD automatique
```

```
Serveur 91.108.122.35/
├── :8080/                        ← Interface web
├── :8080/health                  ← Status
├── :8080/latest.yml              ← Métadonnées Windows
├── :8080/latest-mac.yml          ← Métadonnées Mac
├── :8080/latest-linux.yml        ← Métadonnées Linux
└── :8080/releases/v1.0.1/        ← Fichiers de la version
```

## 🔄 Workflow Complet

1. **Développement** → Vous codez normalement
2. **Release** → Vous créez une release GitHub
3. **Build automatique** → GitHub Actions build les 3 plateformes
4. **Déploiement** → Les fichiers sont envoyés sur votre serveur
5. **Notification** → Les clients reçoivent la notification de mise à jour
6. **Installation** → Les utilisateurs installent en un clic

## 🚨 Points d'Attention

- ✅ Le port 8080 doit être ouvert sur votre serveur
- ✅ Votre serveur doit avoir une IP fixe (91.108.122.35)
- ✅ Les secrets GitHub doivent être configurés AVANT le premier build
- ✅ Testez toujours avec `curl` avant de créer une release

## 🎉 C'est Fini !

Votre système de mise à jour automatique est maintenant :
- ✅ **Sécurisé** (IP dans les secrets)
- ✅ **Automatisé** (GitHub Actions)
- ✅ **Multi-plateforme** (Windows/Mac/Linux)
- ✅ **Prêt à l'emploi** (interface utilisateur incluse)

**Prochaine étape :** Configurez les secrets GitHub et lancez votre premier déploiement ! 🚀