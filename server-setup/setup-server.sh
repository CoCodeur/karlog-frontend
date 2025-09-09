#!/bin/bash

# Script de configuration du serveur de mise à jour Karlog
# À exécuter sur votre serveur Ubuntu/Debian

set -e

echo "🚀 Configuration du serveur de mise à jour Karlog..."

# Variables
DOMAIN="updates.yourdomain.com"
WEBROOT="/var/www/karlog-updates"
NGINX_CONF="/etc/nginx/sites-available/karlog-updates"
USER="www-data"

# Vérification des privilèges root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Ce script doit être exécuté en tant que root" 
   exit 1
fi

# Mise à jour du système
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

# Installation de nginx si nécessaire
if ! command -v nginx &> /dev/null; then
    echo "📦 Installation de Nginx..."
    apt install -y nginx
fi

# Installation de certbot pour SSL (optionnel)
if ! command -v certbot &> /dev/null; then
    echo "🔒 Installation de Certbot pour SSL..."
    apt install -y certbot python3-certbot-nginx
fi

# Création du répertoire web
echo "📁 Création du répertoire web..."
mkdir -p $WEBROOT
mkdir -p $WEBROOT/releases
chown -R $USER:$USER $WEBROOT
chmod -R 755 $WEBROOT

# Création de la structure de dossiers
echo "📁 Création de la structure des dossiers..."
mkdir -p $WEBROOT/releases
touch $WEBROOT/latest.yml
touch $WEBROOT/latest-mac.yml  
touch $WEBROOT/latest-linux.yml

# Configuration Nginx
echo "⚙️  Configuration de Nginx..."
cp nginx.conf $NGINX_CONF

# Remplacement du domaine dans la config
sed -i "s/updates.yourdomain.com/$DOMAIN/g" $NGINX_CONF

# Activation du site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/karlog-updates

# Suppression du site par défaut si présent
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test de la configuration Nginx
echo "🔍 Test de la configuration Nginx..."
nginx -t

# Redémarrage de Nginx
echo "🔄 Redémarrage de Nginx..."
systemctl reload nginx
systemctl enable nginx

# Configuration du pare-feu
echo "🔥 Configuration du pare-feu..."
ufw allow 'Nginx Full'
ufw allow ssh
ufw --force enable

# Génération du certificat SSL avec Certbot (interactif)
echo "🔒 Configuration SSL (optionnel)..."
echo "Pour configurer SSL automatiquement, exécutez :"
echo "certbot --nginx -d $DOMAIN"
echo ""
echo "Ou pour un certificat wildcard :"
echo "certbot certonly --manual --preferred-challenges dns-01 --email your-email@domain.com -d $DOMAIN"

# Création d'un script de nettoyage automatique
echo "🧹 Création du script de nettoyage..."
cat > $WEBROOT/cleanup.sh << 'EOF'
#!/bin/bash
# Nettoyage automatique - garde seulement les 5 dernières versions
cd /var/www/karlog-updates/releases
ls -1dt */ | tail -n +6 | xargs rm -rf
EOF

chmod +x $WEBROOT/cleanup.sh

# Ajout de la tâche cron pour le nettoyage (tous les dimanches à 2h)
echo "⏰ Configuration du nettoyage automatique..."
(crontab -l 2>/dev/null; echo "0 2 * * 0 $WEBROOT/cleanup.sh") | crontab -

# Création d'une page de statut simple
cat > $WEBROOT/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Karlog Update Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { color: #28a745; font-weight: bold; }
        .info { background: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Karlog Update Server</h1>
        <p class="status">✅ Serveur opérationnel</p>
        <div class="info">
            <p><strong>Dernière mise à jour:</strong> <span id="date"></span></p>
            <p><strong>Versions disponibles:</strong> <span id="versions">En cours de chargement...</span></p>
        </div>
    </div>
    <script>
        document.getElementById('date').textContent = new Date().toLocaleString();
        // Vous pouvez ajouter du JavaScript pour afficher les versions disponibles
    </script>
</body>
</html>
EOF

# Résumé
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Résumé de la configuration :"
echo "   • Domaine: $DOMAIN"
echo "   • Répertoire web: $WEBROOT" 
echo "   • Configuration Nginx: $NGINX_CONF"
echo "   • Nettoyage automatique: configuré (dimanches 2h)"
echo ""
echo "🔧 Prochaines étapes :"
echo "   1. Configurez votre DNS pour pointer $DOMAIN vers ce serveur"
echo "   2. Exécutez: certbot --nginx -d $DOMAIN (pour SSL)"
echo "   3. Mettez à jour les URLs dans votre GitHub workflow"
echo "   4. Testez avec: curl https://$DOMAIN/health"
echo ""
echo "📁 Structure des fichiers de mise à jour :"
echo "   $WEBROOT/"
echo "   ├── latest.yml (Windows)"
echo "   ├── latest-mac.yml (macOS)"  
echo "   ├── latest-linux.yml (Linux)"
echo "   └── releases/"
echo "       └── v1.0.1/"
echo "           ├── karlog-1.0.1-setup.exe"
echo "           ├── karlog-1.0.1.dmg"
echo "           └── karlog-1.0.1.AppImage"
echo ""

# Test final
echo "🔍 Test de la configuration..."
systemctl status nginx --no-pager -l

echo "🎉 Serveur de mise à jour Karlog configuré avec succès !"