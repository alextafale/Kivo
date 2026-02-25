// scripts/uploadNegocios.js
// ─────────────────────────────────────────────────────────────────────────────
// Script para subir negocios a Firestore desde negocios.json
//
// USO:
//   1. Coloca tu serviceAccountKey.json en esta misma carpeta (scripts/)
//   2. Edita negocios.json con los datos reales de tus negocios
//   3. Corre: node scripts/uploadNegocios.js
//
// INSTALAR DEPENDENCIAS (solo una vez, desde la raíz del proyecto):
//   npm install firebase-admin
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ─── Inicializar Firebase Admin ───────────────────────────────────────────────

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n No se encontró serviceAccountKey.json');
  console.error('   Descárgalo desde: Firebase Console →  Configuración → Cuentas de servicio → Generar nueva clave privada');
  console.error(`   Colócalo en: ${serviceAccountPath}\n`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── Cargar negocios desde JSON ───────────────────────────────────────────────

const negociosPath = path.join(__dirname, 'negocios.json');

if (!fs.existsSync(negociosPath)) {
  console.error('\n No se encontró negocios.json');
  console.error(`   Ruta esperada: ${negociosPath}\n`);
  process.exit(1);
}

const negocios = JSON.parse(fs.readFileSync(negociosPath, 'utf8'));

// ─── Subir a Firestore ────────────────────────────────────────────────────────

async function uploadNegocios() {
  console.log(`\n Subiendo ${negocios.length} negocio(s) a Firestore...\n`);

  let exitosos = 0;
  let fallidos = 0;

  for (const negocio of negocios) {
    const { id, ...data } = negocio;

    if (!id) {
      console.warn(`    Negocio sin ID, se omite:`, negocio.nombre ?? '(sin nombre)');
      fallidos++;
      continue;
    }

    try {
      await db.collection('negocios').doc(id).set(data, { merge: true });
      console.log(`   ${negocio.nombre} → negocios/${id}`);
      exitosos++;
    } catch (error) {
      console.error(`   Error subiendo "${negocio.nombre}":`, error.message);
      fallidos++;
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(` Exitosos: ${exitosos}`);
  if (fallidos > 0) console.log(` Fallidos: ${fallidos}`);
  console.log('─────────────────────────────────────\n');

  if (exitosos > 0) {
    console.log(' Listo! Verifica en Firebase Console → Firestore → colección "negocios"\n');
  }

  process.exit(0);
}

uploadNegocios().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});