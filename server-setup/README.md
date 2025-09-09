# Configuration du Serveur de Mise à Jour

Ce dossier contient les fichiers nécessaires pour configurer votre serveur de mise à jour automatique.

## 🚀 Installation Rapide

1. **Transférez les fichiers sur votre serveur :**
   ```bash
   scp -r server-setup/ user@your-server.com:~/
   ```

2. **Connectez-vous à votre serveur et exécutez :**
   ```bash
   cd ~/server-setup
   sudo ./setup-server.sh
   ```

3. **Configurez SSL :**
   ```bash
   sudo certbot --nginx -d updates.yourdomain.com
   ```

## ⚙️ Configuration Manuelle

### Prérequis
- Serveur Ubuntu/Debian 
- Nginx installé
- Nom de domaine pointant vers le serveur
- Accès root/sudo

### Étapes

1. **Créez le répertoire web :**
   ```bash
   sudo mkdir -p /var/www/karlog-updates/releases
   sudo chown -R www-data:www-data /var/www/karlog-updates
   ```

2. **Configurez Nginx :**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/karlog-updates
   sudo ln -s /etc/nginx/sites-available/karlog-updates /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **Configurez SSL avec Certbot :**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d updates.yourdomain.com
   ```

## 📋 Configuration GitHub

Ajoutez ces secrets dans votre repository GitHub :

- `SERVER_HOST` : IP ou domaine de votre serveur
- `SERVER_USER` : Utilisateur SSH (ex: ubuntu)
- `SERVER_SSH_KEY` : Clé privée SSH pour l'accès au serveur

## 🔧 Configuration de l'Application

Mettez à jour les URLs dans :
- `electron-builder.yml` : `url: https://updates.yourdomain.com`
- `dev-app-update.yml` : `url: https://updates.yourdomain.com`

## 📁 Structure des Fichiers

Après déploiement, votre serveur aura cette structure :

```
/var/www/karlog-updates/
├── index.html              # Page de statut
├── latest.yml              # Métadonnées Windows
├── latest-mac.yml          # Métadonnées macOS
├── latest-linux.yml        # Métadonnées Linux
├── cleanup.sh              # Script de nettoyage auto
└── releases/
    ├── v1.0.1/
    │   ├── karlog-1.0.1-setup.exe
    │   ├── karlog-1.0.1.dmg
    │   └── karlog-1.0.1.AppImage
    └── v1.0.2/
        └── ...
```

## 🔍 Tests

1. **Test de base :**
   ```bash
   curl https://updates.yourdomain.com/health
   ```

2. **Test des métadonnées :**
   ```bash
   curl https://updates.yourdomain.com/latest.yml
   ```

3. **Vérification depuis l'application :**
   - Ouvrir l'application
   - Vérifier les logs de mise à jour
   - Tester la vérification manuelle

## 🧹 Maintenance

- **Nettoyage automatique** : Le script garde automatiquement les 5 dernières versions
- **Logs** : Vérifiez `/var/log/nginx/karlog-updates-*.log`
- **Espace disque** : Surveillez l'utilisation avec `df -h`

## 🚨 Dépannage

### Erreur 404 sur les fichiers
Vérifiez les permissions :
```bash
sudo chown -R www-data:www-data /var/www/karlog-updates
sudo chmod -R 755 /var/www/karlog-updates
```

### Erreur SSL
Renouvelez le certificat :
```bash
sudo certbot renew --dry-run
```

### GitHub Actions échoue
1. Vérifiez les secrets dans GitHub
2. Testez la connexion SSH manuellement
3. Vérifiez les permissions du dossier de destination

## 📞 Support

En cas de problème :
1. Vérifiez les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
2. Testez la configuration : `sudo nginx -t`
3. Vérifiez le statut : `sudo systemctl status nginx`