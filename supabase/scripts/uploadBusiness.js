// scripts/uploadNegocios.js
// ─────────────────────────────────────────────────────────────────────────────
// Sube los negocios de negocios.json a Supabase
//
// USO:
//   1. Agrega SUPABASE_URL y SUPABASE_SERVICE_KEY al archivo .env de la raíz
//   2. Corre: node scripts/uploadNegocios.js
//
// INSTALAR (solo una vez desde /scripts):
//   npm install @supabase/supabase-js dotenv
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Validar variables de entorno ─────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role key (no anon)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\n❌ Faltan variables de entorno en .env:');
  if (!SUPABASE_URL)         console.error('   → SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   → SUPABASE_SERVICE_KEY');
  console.error('\nObtén estas en: Supabase → Settings → API\n');
  process.exit(1);
}

// Usar service_role para bypassear RLS al hacer la carga inicial
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Cargar JSON ──────────────────────────────────────────────────────────────
const negociosPath = path.join(__dirname, 'negocios.json');
if (!fs.existsSync(negociosPath)) {
  console.error(`\n❌ No se encontró: ${negociosPath}\n`);
  process.exit(1);
}

const negocios = JSON.parse(fs.readFileSync(negociosPath, 'utf8'));

// ─── Subir a Supabase ─────────────────────────────────────────────────────────
async function uploadNegocios() {
  console.log(`\n Subiendo ${negocios.length} negocio(s) a Supabase...\n`);

  let exitosos = 0;
  let fallidos = 0;

  for (const negocio of negocios) {
    if (!negocio.id) {
      console.warn(`  ⚠️  Negocio sin ID, omitido:`, negocio.nombre ?? '(sin nombre)');
      fallidos++;
      continue;
    }

    // upsert: inserta si no existe, actualiza si ya existe
    const { error } = await supabase
      .from('negocios')
      .upsert({
        id:          negocio.id,
        nombre:      negocio.nombre,
        descripcion: negocio.descripcion,
        direccion:   negocio.direccion,
        horario:     negocio.horario,
        telefono:    negocio.telefono,
        whatsapp:    negocio.whatsapp,
        categoria:   negocio.categoria,
        calificacion: negocio.calificacion,
        menu:        negocio.menu ?? [],
        activo:      true,
      });

    if (error) {
      console.error(`  ❌ Error en "${negocio.nombre}":`, error.message);
      fallidos++;
    } else {
      console.log(`  ✅ ${negocio.nombre}`);
      exitosos++;
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Exitosos : ${exitosos}`);
  if (fallidos > 0) console.log(`❌ Fallidos : ${fallidos}`);
  console.log('─────────────────────────────────');
  console.log('\n Verifica en: Supabase → Table Editor → negocios\n');
}

uploadNegocios().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});