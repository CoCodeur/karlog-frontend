#!/bin/bash

# Script de configuration du serveur de mise à jour Karlog (SANS domaine - IP directe)
# À exécuter sur votre serveur Ubuntu/Debian

set -e

echo "🚀 Configuration du serveur de mise à jour Karlog (IP directe)..."

# Variables
PORT="8080"
WEBROOT="/var/www/karlog-updates"
NGINX_CONF="/etc/nginx/sites-available/karlog-updates-ip"
USER="www-data"
SERVER_IP="91.108.122.35"

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

# Configuration Nginx SANS SSL (HTTP uniquement)
echo "⚙️  Configuration de Nginx (HTTP sur port $PORT)..."
cat > $NGINX_CONF << EOF
# Configuration Nginx pour servir les mises à jour Karlog via IP
server {
    listen $PORT;
    server_name _;
    
    # Document root
    root $WEBROOT;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/karlog-updates-access.log;
    error_log /var/log/nginx/karlog-updates-error.log;
    
    # Headers de sécurité adaptés pour HTTP
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    
    # Configuration CORS pour permettre l'accès depuis l'application
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    add_header Access-Control-Allow-Headers "Range";
    
    # Cache pour les fichiers de mise à jour
    location ~* \.(exe|dmg|AppImage|deb|snap)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Support des téléchargements partiels
        add_header Accept-Ranges bytes;
        
        # Logs spéciaux pour les téléchargements
        access_log /var/log/nginx/downloads.log;
    }
    
    # Configuration pour les fichiers de métadonnées (.yml)
    location ~* \.(yml|yaml)$ {
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
        add_header Content-Type "text/yaml";
    }
    
    # Health check
    location = /health {
        access_log off;
        return 200 "OK - Karlog Update Server\\nServer IP: $SERVER_IP\\nPort: $PORT\\n";
        add_header Content-Type text/plain;
    }
    
    # Protection contre les accès indésirables
    location ~ /\. {
        deny all;
    }
    
    # Page d'index
    location = / {
        try_files \$uri @status;
    }
    
    location @status {
        return 200 "🚀 Karlog Update Server\\n✅ Status: Active\\n🌐 Server IP: $SERVER_IP\\n🚪 Port: $PORT\\n📅 $(date)\\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Activation du site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/karlog-updates-ip

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
ufw allow $PORT/tcp
ufw allow ssh
ufw --force enable

# Création d'un script de nettoyage automatique
echo "🧹 Création du script de nettoyage..."
cat > $WEBROOT/cleanup.sh << 'EOF'
#!/bin/bash
# Nettoyage automatique - garde seulement les 5 dernières versions
cd /var/www/karlog-updates/releases
ls -1dt */ | tail -n +6 | xargs rm -rf
echo "$(date): Nettoyage effectué - gardé les 5 dernières versions" >> /var/log/karlog-cleanup.log
EOF

chmod +x $WEBROOT/cleanup.sh

# Ajout de la tâche cron pour le nettoyage (tous les dimanches à 2h)
echo "⏰ Configuration du nettoyage automatique..."
(crontab -l 2>/dev/null; echo "0 2 * * 0 $WEBROOT/cleanup.sh") | crontab -

# Création d'une page de statut détaillée
cat > $WEBROOT/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Karlog Update Server</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 700px; 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 { 
            color: #333; 
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .emoji { font-size: 3em; margin-bottom: 20px; }
        .status { 
            color: #28a745; 
            font-weight: bold; 
            font-size: 1.3em;
            margin: 20px 0;
        }
        .info { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 10px; 
            margin: 25px 0;
            border-left: 5px solid #667eea;
        }
        .info p { margin: 10px 0; }
        .endpoint {
            background: #e9ecef;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 1.1em;
            color: #495057;
            margin: 15px 0;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        .test-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            margin: 10px;
            transition: background 0.3s;
        }
        .test-btn:hover {
            background: #5a67d8;
        }
        .footer {
            margin-top: 30px;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🚀</div>
        <h1>Karlog Update Server</h1>
        <p class="status">✅ Serveur opérationnel</p>
        
        <div class="info">
            <h3>🔧 Configuration</h3>
            <div class="grid">
                <div class="card">
                    <strong>IP du serveur</strong><br>
                    $SERVER_IP
                </div>
                <div class="card">
                    <strong>Port</strong><br>
                    $PORT
                </div>
            </div>
            
            <div class="endpoint">
                Endpoint: http://$SERVER_IP:$PORT/
            </div>
        </div>

        <div class="info">
            <h3>🔍 Tests rapides</h3>
            <button class="test-btn" onclick="testEndpoint('health')">Test Health</button>
            <button class="test-btn" onclick="testEndpoint('latest.yml')">Test Metadata</button>
            <div id="test-result" style="margin-top: 15px;"></div>
        </div>

        <div class="info">
            <h3>📋 URLs importantes</h3>
            <p><strong>Health Check:</strong> <code>/health</code></p>
            <p><strong>Windows Updates:</strong> <code>/latest.yml</code></p>
            <p><strong>macOS Updates:</strong> <code>/latest-mac.yml</code></p>
            <p><strong>Linux Updates:</strong> <code>/latest-linux.yml</code></p>
        </div>

        <div class="footer">
            <p><strong>Dernière vérification:</strong> <span id="date"></span></p>
            <p>Serveur configuré pour IP directe - Pas de certificat SSL requis</p>
        </div>
    </div>

    <script>
        document.getElementById('date').textContent = new Date().toLocaleString('fr-FR');
        
        async function testEndpoint(path) {
            const resultDiv = document.getElementById('test-result');
            resultDiv.innerHTML = '⏳ Test en cours...';
            
            try {
                const response = await fetch('/' + path);
                const text = await response.text();
                resultDiv.innerHTML = \`✅ <strong>\${path}</strong>: \${response.status} - \${text.substring(0, 100)}...\`;
                resultDiv.style.color = 'green';
            } catch (error) {
                resultDiv.innerHTML = \`❌ <strong>\${path}</strong>: Erreur - \${error.message}\`;
                resultDiv.style.color = 'red';
            }
        }
        
        // Test automatique au chargement
        setTimeout(() => testEndpoint('health'), 1000);
    </script>
</body>
</html>
EOF

# Script de monitoring simple
cat > /usr/local/bin/karlog-status << EOF
#!/bin/bash
echo "🔍 Status du serveur Karlog Updates"
echo "=================================="
echo "📅 Date: \$(date)"
echo "🌐 IP: $SERVER_IP"
echo "🚪 Port: $PORT"
echo "📁 Dossier: $WEBROOT"
echo ""
echo "🔧 Status Nginx:"
systemctl is-active nginx
echo ""
echo "📊 Espace disque:"
df -h $WEBROOT
echo ""
echo "📈 Dernières connections:"
tail -5 /var/log/nginx/karlog-updates-access.log 2>/dev/null || echo "Pas de logs encore"
EOF

chmod +x /usr/local/bin/karlog-status

# Résumé
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Résumé de la configuration :"
echo "   • IP du serveur: $SERVER_IP"
echo "   • Port: $PORT"
echo "   • URL complète: http://$SERVER_IP:$PORT"
echo "   • Répertoire web: $WEBROOT"
echo ""
echo "🔧 URLs à utiliser dans votre app :"
echo "   electron-builder.yml: url: http://$SERVER_IP:$PORT"
echo "   dev-app-update.yml: url: http://$SERVER_IP:$PORT"
echo ""
echo "🔍 Tests à effectuer :"
echo "   curl http://$SERVER_IP:$PORT/health"
echo "   curl http://$SERVER_IP:$PORT/"
echo ""
echo "🛠️ Commande de monitoring :"
echo "   karlog-status"
echo ""
echo "⚠️  IMPORTANT :"
echo "   - Remplacez YOUR_SERVER_IP par $SERVER_IP dans vos fichiers de config"
echo "   - Ce serveur utilise HTTP (pas HTTPS) pour simplifier"
echo "   - Assurez-vous que le port $PORT est ouvert dans votre pare-feu"
echo ""

# Test final
echo "🔍 Test de la configuration..."
systemctl status nginx --no-pager -l

# Test de l'endpoint
echo ""
echo "🌐 Test de l'endpoint..."
sleep 2
curl -f "http://localhost:$PORT/health" || echo "❌ Erreur lors du test"

echo ""
echo "🎉 Serveur de mise à jour Karlog configuré avec succès !"
echo "🔗 Accédez à http://$SERVER_IP:$PORT pour voir le status"