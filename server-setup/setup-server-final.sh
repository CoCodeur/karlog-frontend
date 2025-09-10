#!/bin/bash

# Script de configuration du serveur de mise à jour Karlog (VERSION FINALE CORRIGÉE)
# Port 3001 et HTTP simple - Syntaxe nginx corrigée

set -e

echo "🚀 Configuration du serveur de mise à jour Karlog (Port 3001 - Version corrigée)..."

# Variables
PORT="3001"
WEBROOT="/var/www/karlog-updates"
NGINX_CONF="/etc/nginx/sites-available/karlog-updates"
USER="www-data"
SERVER_IP="91.108.122.35"

# Vérification des privilèges root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Ce script doit être exécuté en tant que root" 
   exit 1
fi

# Vérification si le port est libre
if netstat -tuln | grep -q ":$PORT "; then
    echo "❌ Le port $PORT est déjà utilisé !"
    echo "Ports actuellement utilisés :"
    netstat -tuln | grep LISTEN
    exit 1
fi

# Mise à jour du système (sans interaction)
echo "📦 Mise à jour du système..."
DEBIAN_FRONTEND=noninteractive apt update 
DEBIAN_FRONTEND=noninteractive apt upgrade -y

# Installation de nginx si nécessaire
if ! command -v nginx &> /dev/null; then
    echo "📦 Installation de Nginx..."
    DEBIAN_FRONTEND=noninteractive apt install -y nginx
fi

# Arrêt de nginx pour éviter les conflits
systemctl stop nginx 2>/dev/null || true

# Création du répertoire web
echo "📁 Création du répertoire web..."
mkdir -p $WEBROOT
mkdir -p $WEBROOT/releases
chown -R $USER:$USER $WEBROOT
chmod -R 755 $WEBROOT

# Création de la structure de dossiers
echo "📁 Création de la structure des dossiers..."
touch $WEBROOT/latest.yml
touch $WEBROOT/latest-mac.yml  
touch $WEBROOT/latest-linux.yml

# Configuration Nginx HTTP simple (SYNTAXE CORRIGÉE)
echo "⚙️  Configuration de Nginx (HTTP sur port $PORT)..."
cat > $NGINX_CONF << 'EOF'
# Configuration Nginx pour Karlog Updates - Port 3001 HTTP
server {
    listen 3001;
    server_name _;
    
    # Document root
    root /var/www/karlog-updates;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/karlog-updates-access.log;
    error_log /var/log/nginx/karlog-updates-error.log;
    
    # Headers de base
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    
    # Configuration CORS pour l'application Electron
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    add_header Access-Control-Allow-Headers "Range";
    
    # Cache pour les fichiers de mise à jour
    location ~* \.(exe|dmg|AppImage|deb|snap)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
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
    
    # Health check avec contenu statique
    location = /health {
        access_log off;
        return 200 "OK - Karlog Update Server\nServer: 91.108.122.35:3001\nStatus: Active\n";
        add_header Content-Type text/plain;
    }
    
    # Status endpoint
    location = /status {
        access_log off;
        return 200 "Karlog Update Server\nIP: 91.108.122.35\nPort: 3001\nStatus: Online\n";
        add_header Content-Type text/plain;
    }
    
    # Protection contre les accès indésirables
    location ~ /\. {
        deny all;
    }
    
    location = /favicon.ico {
        access_log off;
        log_not_found off;
        return 204;
    }
    
    # Page d'index avec fallback
    location = / {
        try_files $uri /index.html @fallback;
    }
    
    location @fallback {
        return 200 "Karlog Update Server\nStatus: Active\nEndpoints:\n  /health - Health check\n  /latest.yml - Windows metadata\n  /latest-mac.yml - macOS metadata\n  /latest-linux.yml - Linux metadata\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Remplacement des variables dans le fichier de configuration
sed -i "s|3001|$PORT|g" $NGINX_CONF
sed -i "s|/var/www/karlog-updates|$WEBROOT|g" $NGINX_CONF
sed -i "s|91.108.122.35|$SERVER_IP|g" $NGINX_CONF

# Suppression du site par défaut
rm -f /etc/nginx/sites-enabled/default

# Activation du nouveau site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/karlog-updates

# Test de la configuration Nginx
echo "🔍 Test de la configuration Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erreur dans la configuration Nginx !"
    echo "Contenu du fichier de configuration :"
    cat $NGINX_CONF
    exit 1
fi

# Démarrage de Nginx
echo "🔄 Démarrage de Nginx..."
systemctl enable nginx
systemctl start nginx

# Vérification que nginx écoute sur le bon port
sleep 2
if ! netstat -tuln | grep -q ":$PORT "; then
    echo "❌ Nginx ne semble pas écouter sur le port $PORT"
    systemctl status nginx
    exit 1
fi

# Configuration du pare-feu
echo "🔥 Configuration du pare-feu..."
ufw allow $PORT/tcp comment "Karlog Updates"
ufw allow ssh
ufw --force enable 2>/dev/null || echo "UFW déjà activé"

# Création d'un script de nettoyage automatique
echo "🧹 Création du script de nettoyage..."
cat > $WEBROOT/cleanup.sh << 'EOF'
#!/bin/bash
# Nettoyage automatique - garde seulement les 5 dernières versions
cd /var/www/karlog-updates/releases 2>/dev/null || exit 1
if [ "$(ls -1 | wc -l)" -gt 5 ]; then
    ls -1dt */ | tail -n +6 | xargs rm -rf
    echo "$(date): Nettoyage effectué - gardé les 5 dernières versions" >> /var/log/karlog-cleanup.log
fi
EOF

chmod +x $WEBROOT/cleanup.sh

# Ajout de la tâche cron pour le nettoyage (tous les dimanches à 2h)
echo "⏰ Configuration du nettoyage automatique..."
(crontab -l 2>/dev/null | grep -v karlog-cleanup; echo "0 2 * * 0 $WEBROOT/cleanup.sh") | crontab -

# Création d'une page de statut HTML (sans variables dynamiques)
cat > $WEBROOT/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karlog Update Server</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container { 
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 90%;
            text-align: center;
        }
        .status { 
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 { 
            color: #333;
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        .info {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: left;
        }
        .endpoint {
            background: #e9ecef;
            padding: 0.8rem;
            border-radius: 5px;
            font-family: monospace;
            margin: 0.5rem 0;
            word-break: break-all;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 1rem 0;
        }
        .card {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            margin: 0.5rem;
            transition: background 0.3s;
        }
        .btn:hover { background: #5a67d8; }
        #result { 
            margin-top: 1rem; 
            padding: 1rem; 
            border-radius: 5px; 
            font-family: monospace;
            font-size: 0.9rem;
        }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">🚀</div>
        <h1>Karlog Update Server</h1>
        <p style="color: #28a745; font-weight: bold; font-size: 1.2rem;">✅ Serveur opérationnel</p>
        
        <div class="info">
            <h3>📡 Configuration</h3>
            <div class="grid">
                <div class="card">
                    <strong>Serveur</strong><br>
                    $SERVER_IP
                </div>
                <div class="card">
                    <strong>Port</strong><br>
                    $PORT
                </div>
            </div>
            <div class="endpoint">http://$SERVER_IP:$PORT</div>
        </div>

        <div class="info">
            <h3>🔗 Endpoints disponibles</h3>
            <div class="endpoint">/health - Status du serveur</div>
            <div class="endpoint">/status - Informations serveur</div>
            <div class="endpoint">/latest.yml - Métadonnées Windows</div>
            <div class="endpoint">/latest-mac.yml - Métadonnées macOS</div>
            <div class="endpoint">/latest-linux.yml - Métadonnées Linux</div>
        </div>

        <div class="info">
            <h3>🧪 Test de connectivité</h3>
            <button class="btn" onclick="testHealth()">Tester /health</button>
            <button class="btn" onclick="testStatus()">Tester /status</button>
            <div id="result"></div>
        </div>

        <div class="info">
            <p><strong>⏰ Page chargée:</strong> <span id="time"></span></p>
            <p><strong>🔧 Configuration:</strong> HTTP simple, Port $PORT</p>
            <p><strong>🛡️ Sécurité:</strong> CORS activé pour Electron</p>
        </div>
    </div>

    <script>
        document.getElementById('time').textContent = new Date().toLocaleString('fr-FR');
        
        async function testEndpoint(path, name) {
            const result = document.getElementById('result');
            result.innerHTML = '⏳ Test en cours...';
            result.className = '';
            
            try {
                const response = await fetch(path);
                const text = await response.text();
                result.innerHTML = \`✅ <strong>\${name}</strong> OK (HTTP \${response.status})<br><pre>\${text.substring(0, 200)}\</pre>\`;
                result.className = 'success';
            } catch (error) {
                result.innerHTML = \`❌ <strong>\${name}</strong> ERREUR<br>\${error.message}\`;
                result.className = 'error';
            }
        }
        
        function testHealth() {
            testEndpoint('/health', 'Health Check');
        }
        
        function testStatus() {
            testEndpoint('/status', 'Status');
        }
        
        // Test automatique au chargement
        setTimeout(testHealth, 1000);
    </script>
</body>
</html>
EOF

# Script de monitoring
cat > /usr/local/bin/karlog-status << EOF
#!/bin/bash
echo "🔍 Status Karlog Update Server"
echo "=============================="
echo "📅 Date: \$(date)"
echo "🌐 IP: $SERVER_IP"
echo "🚪 Port: $PORT"
echo "📁 Dossier: $WEBROOT"
echo ""
echo "🔧 Status Nginx:"
systemctl is-active nginx
echo ""
echo "🔌 Port d'écoute:"
netstat -tuln | grep $PORT || echo "Port $PORT non trouvé"
echo ""
echo "📊 Espace disque:"
df -h $WEBROOT
echo ""
echo "📈 Dernières connexions:"
tail -5 /var/log/nginx/karlog-updates-access.log 2>/dev/null || echo "Pas de logs encore"
echo ""
echo "🧪 Test rapide:"
curl -s "http://localhost:$PORT/health" || echo "❌ Serveur non accessible"
EOF

chmod +x /usr/local/bin/karlog-status

# Test final complet
echo ""
echo "🧪 Tests finaux..."

# Test nginx
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx n'est pas actif"
    systemctl status nginx
    exit 1
fi

# Test du port
if ! netstat -tuln | grep -q ":$PORT "; then
    echo "❌ Le port $PORT n'est pas ouvert"
    netstat -tuln | grep LISTEN
    exit 1
fi

# Test HTTP
sleep 3
if curl -f -s "http://localhost:$PORT/health" > /dev/null; then
    echo "✅ Test HTTP réussi"
else
    echo "❌ Test HTTP échoué"
    echo "Vérification des logs nginx:"
    tail -10 /var/log/nginx/error.log
    exit 1
fi

# Résumé final
echo ""
echo "🎉 =================================="
echo "✅ INSTALLATION RÉUSSIE !"
echo "🎉 =================================="
echo ""
echo "📋 Configuration :"
echo "   • Serveur: $SERVER_IP"
echo "   • Port: $PORT"
echo "   • URL: http://$SERVER_IP:$PORT"
echo "   • Protocole: HTTP (syntaxe nginx corrigée)"
echo ""
echo "🔗 URLs importantes :"
echo "   • Interface web: http://$SERVER_IP:$PORT"
echo "   • Health check: http://$SERVER_IP:$PORT/health"
echo "   • Status serveur: karlog-status"
echo ""
echo "⚠️  À FAIRE MAINTENANT :"
echo "   1. Testez: curl http://$SERVER_IP:$PORT/health"
echo "   2. Interface web: http://$SERVER_IP:$PORT"
echo "   3. Redémarrez si demandé par le système"
echo ""
echo "🔧 Commandes utiles :"
echo "   • karlog-status - Status complet"
echo "   • systemctl status nginx - Status nginx"
echo "   • tail -f /var/log/nginx/karlog-updates-access.log - Logs"
echo ""

# Affichage du statut final
karlog-status

echo ""
echo "🚀 Serveur prêt à recevoir les déploiements !"
echo "✅ Syntaxe nginx corrigée - Plus d'erreurs de configuration !"