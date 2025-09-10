# Configuration Serveur SANS Domaine (IP directe)

Cette configuration vous permet d'utiliser le système de mise à jour automatique avec uniquement l'IP de votre serveur, sans avoir besoin d'un nom de domaine.

## 🚀 Installation Ultra-Rapide

### 1. Sur votre serveur
```bash
# Téléchargez les fichiers de setup
wget https://raw.githubusercontent.com/votre-username/karlog-frontend/main/server-setup/setup-server-ip.sh
chmod +x setup-server-ip.sh

# Exécutez l'installation (comme root)
sudo ./setup-server-ip.sh
```

### 2. Récupérez l'IP de votre serveur
```bash
# L'IP sera affichée automatiquement, ou récupérez-la avec :
curl http://checkip.amazonaws.com/
```

### 3. Mettez à jour vos fichiers de config
Remplacez `YOUR_SERVER_IP` par l'IP réelle dans :
- `electron-builder.yml` → `url: http://123.45.67.89:8080`
- `dev-app-update.yml` → `url: http://123.45.67.89:8080`

## ⚙️ Configuration GitHub Secrets

Ajoutez dans GitHub → Settings → Secrets :
```
SERVER_HOST=123.45.67.89
SERVER_USER=ubuntu
SERVER_SSH_KEY=your-private-ssh-key
SERVER_PORT=22  (optionnel, défaut: 22)
```

## 🔍 Tests

### Test de base
```bash
curl http://123.45.67.89:8080/health
# Réponse attendue: "OK - Karlog Update Server"
```

### Interface web
Ouvrez dans votre navigateur : `http://123.45.67.89:8080`

## 🎯 Avantages de cette approche

✅ **Simple** - Pas de configuration DNS  
✅ **Rapide** - Prêt en 5 minutes  
✅ **Économique** - Pas besoin d'acheter un domaine  
✅ **Fonctionnel** - Marche parfaitement avec electron-updater  
✅ **Sécurisé** - Pare-feu configuré automatiquement  

## ⚠️ Points d'attention

- **IP fixe requise** - Votre serveur doit avoir une IP fixe
- **Port 8080** - Assurez-vous qu'il est ouvert dans votre pare-feu
- **HTTP uniquement** - Pas de HTTPS (mais suffisant pour les mises à jour)
- **Redémarrage** - Si votre serveur redémarre, l'IP pourrait changer

## 🔧 Configuration détaillée

### Structure du serveur
```
/var/www/karlog-updates/
├── index.html              # Interface de monitoring
├── latest.yml              # Métadonnées Windows
├── latest-mac.yml          # Métadonnées macOS  
├── latest-linux.yml        # Métadonnées Linux
├── cleanup.sh              # Script de nettoyage
└── releases/
    └── v1.0.1/
        ├── karlog-1.0.1-setup.exe
        ├── karlog-1.0.1.dmg
        └── karlog-1.0.1.AppImage
```

### Nginx écoute sur le port 8080
- HTTP simple (pas de SSL)
- CORS activé pour votre application
- Cache optimisé pour les gros fichiers
- Logs séparés pour monitoring

### Commandes utiles
```bash
# Status du serveur
karlog-status

# Voir les logs
tail -f /var/log/nginx/karlog-updates-access.log

# Test depuis le serveur
curl localhost:8080/health

# Redémarrer nginx si besoin
sudo systemctl reload nginx
```

## 🚨 Dépannage

### L'application ne trouve pas les mises à jour
1. Vérifiez que l'IP est correcte dans vos configs
2. Testez l'URL : `curl http://VOTRE_IP:8080/latest.yml`
3. Vérifiez que le port 8080 est ouvert

### Erreur de connexion
```bash
# Vérifiez que nginx écoute bien
sudo netstat -tlnp | grep :8080

# Vérifiez le pare-feu
sudo ufw status
```

### GitHub Actions échoue
1. Vérifiez que l'IP du serveur dans les secrets est correcte
2. Testez SSH manuellement : `ssh ubuntu@VOTRE_IP`
3. Vérifiez les permissions : `ls -la /var/www/karlog-updates/`

## 💡 Pour plus tard : Passage au HTTPS

Si vous voulez ajouter HTTPS plus tard (avec un domaine) :

1. **Achetez un domaine** et pointez-le vers votre IP
2. **Installez certbot** : `sudo apt install certbot python3-certbot-nginx`
3. **Générez le certificat** : `sudo certbot --nginx -d votre-domaine.com`
4. **Mettez à jour vos configs** avec `https://votre-domaine.com`

## 📞 Support

En cas de problème :
1. Exécutez `karlog-status` sur le serveur
2. Consultez les logs : `/var/log/nginx/karlog-updates-error.log`
3. Testez les endpoints avec `curl`