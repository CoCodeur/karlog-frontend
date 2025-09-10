#!/usr/bin/env node

/**
 * Script de configuration des builds avec IP du serveur
 * Remplace UPDATE_SERVER_IP par l'IP réelle dans les fichiers de template
 */

const fs = require('fs')
const path = require('path')

// IP du serveur (peut être passée en variable d'environnement)
const SERVER_IP = process.env.UPDATE_SERVER_IP || '91.108.122.35'
const PORT = process.env.UPDATE_SERVER_PORT || '8080'
const FULL_URL = `http://${SERVER_IP}:${PORT}`

console.log(`🔧 Configuration des builds avec serveur: ${FULL_URL}`)

// Fichiers à traiter
const files = [
  {
    template: 'electron-builder.template.yml',
    output: 'electron-builder.yml'
  },
  {
    template: 'dev-app-update.template.yml', 
    output: 'dev-app-update.yml'
  }
]

// Traitement des fichiers
files.forEach(({ template, output }) => {
  const templatePath = path.join(__dirname, '..', template)
  const outputPath = path.join(__dirname, '..', output)
  
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template non trouvé: ${template}`)
    return
  }
  
  try {
    // Lecture du template
    let content = fs.readFileSync(templatePath, 'utf8')
    
    // Remplacement des variables
    content = content.replace(/UPDATE_SERVER_IP/g, SERVER_IP)
    content = content.replace(/UPDATE_SERVER_PORT/g, PORT)
    content = content.replace(/UPDATE_SERVER_URL/g, FULL_URL)
    
    // Écriture du fichier final
    fs.writeFileSync(outputPath, content, 'utf8')
    
    console.log(`✅ ${template} → ${output}`)
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${template}:`, error.message)
    process.exit(1)
  }
})

// Vérification des fichiers générés
console.log('\n🔍 Vérification des fichiers générés:')
files.forEach(({ output }) => {
  const outputPath = path.join(__dirname, '..', output)
  if (fs.existsSync(outputPath)) {
    const content = fs.readFileSync(outputPath, 'utf8')
    if (content.includes('UPDATE_SERVER_IP')) {
      console.warn(`⚠️  ${output} contient encore des placeholders non remplacés`)
    } else {
      console.log(`✅ ${output} configuré correctement`)
    }
  } else {
    console.error(`❌ ${output} n'a pas été généré`)
  }
})

console.log(`\n🎯 Configuration terminée pour: ${FULL_URL}`)
console.log('📋 Prochaines étapes:')
console.log('   1. Vérifiez que votre serveur est accessible')
console.log(`   2. Testez: curl ${FULL_URL}/health`)
console.log('   3. Lancez le build: npm run build')