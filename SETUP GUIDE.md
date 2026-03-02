# 🚀 GUÍA COMPLETA: Chatbot Pidelo con Gemini Flash + Firebase

---

## PASO 1 — Obtener API Key de Gemini Flash

1. Ve a: https://aistudio.google.com/app/apikey
2. Inicia sesión con tu cuenta Google
3. Clic en **"Create API Key"**
4. Copia la key (ej: `AIzaSy...`)

---

## PASO 2 — Crear proyecto en Firebase

1. Ve a: https://console.firebase.google.com
2. **Agregar proyecto** → nombre: `pidelo-app`
3. En panel → **Firestore Database** → **Crear base de datos** → Modo Producción → región `us-central1`
4. En ⚙️ Configuración del proyecto → sección **"Tus apps"** → clic `</>` (Web)
5. Registra la app → copia el objeto `firebaseConfig`

---

## PASO 3 — Instalar dependencias

```bash
npx expo install firebase expo-constants expo-linking
npm install react-native-dotenv
```

---

## PASO 4 — babel.config.js

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
    ],
  };
};
```

---

## PASO 5 — Archivo .env (raíz del proyecto)

```env
GEMINI_API_KEY=AIzaSy_TU_KEY_AQUI
FIREBASE_API_KEY=tu_firebase_api_key
FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

⚠️ Agrega `.env` a tu `.gitignore`

---

## PASO 6 — Estructura Firestore

### Colección `negocios`
Crea un documento con este formato:
```
negocios/pizza-paradiso
  nombre: "Pizza Paradiso"
  descripcion: "La mejor pizza artesanal de la ciudad"
  direccion: "Calle Principal 123, Col. Centro"
  horario: "Lun-Dom 10:00am - 10:00pm"
  telefono: "+52 55 1234 5678"
  whatsapp: "5215512345678"   ← sin + ni espacios, con código país
  categoria: "pizzeria"
  calificacion: 4.9
  menu: [
    { nombre: "Margherita", precio: 120, descripcion: "Tomate, mozzarella, albahaca" },
    { nombre: "Pepperoni", precio: 140, descripcion: "Extra pepperoni" },
    { nombre: "4 Quesos", precio: 155, descripcion: "Blend especial de 4 quesos" }
  ]
```

### Colección `pedidos` (se crea automáticamente)
El chatbot la llena solo cuando el usuario confirma un pedido.

---

## PASO 7 — Coloca los archivos

```
/config/firebaseConfig.ts
/services/geminiService.ts
/screens/Chatbot.tsx   ← reemplaza el actual
```

## PASO 8 — Ejecutar

```bash
npx expo start --clear
```

## CHATBOT USE.md

```
Para correr el modelo de llama3 desde las pcs, correr el siguiente comando desde powershell:
$env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve
```