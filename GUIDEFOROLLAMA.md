# 🦙 Guía de equipo — Ollama + Llama3 con Pidelo

> Esta guía es para todos los miembros del equipo que quieran correr el chatbot de Pidelo con el modelo Llama3 de forma local y gratuita usando Ollama.

---

## ¿Qué es Ollama?

Ollama te permite correr modelos de IA (como Llama3) **directamente en tu computadora**, sin pagar APIs externas. El chatbot de Pidelo se conecta a Ollama por red local cuando usas Expo Go en tu teléfono.

---

## Requisitos

| Requisito | Mínimo recomendado |
|-----------|-------------------|
| RAM | 8 GB (16 GB ideal) |
| Espacio en disco | ~5 GB libres para el modelo |
| SO | Windows 10/11, macOS 12+, Linux |
| Red | PC y teléfono en el **mismo WiFi** |

---

## PASO 1 — Instalar Ollama

### Windows / macOS
1. Ve a [https://ollama.com/download](https://ollama.com/download)
2. Descarga el instalador para tu sistema operativo
3. Instala normalmente (siguiente, siguiente, instalar)
4. Verifica en terminal:
```bash
ollama --version
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## PASO 2 — Descargar el modelo Llama3

Abre tu terminal y corre:

```bash
ollama pull llama3
```

> ⏳ Esto descarga ~4.7 GB la primera vez. Solo se hace una vez.

Verifica que se descargó correctamente:
```bash
ollama list
```
Debe aparecer `llama3` en la lista.

---

## PASO 3 — Exponer Ollama a tu red local

Por defecto Ollama solo escucha en `localhost`, lo que significa que tu teléfono no puede conectarse. Debes iniciarlo con acceso a toda la red:

### Windows (PowerShell)
```powershell
$env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve
```

### macOS / Linux
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

> ✅ Debes ver algo como: `Listening on 0.0.0.0:11434`

> ⚠️ **Deja esta terminal abierta** mientras desarrollas. Si la cierras, el chatbot no funcionará.

---

## PASO 4 — Obtener tu IP local

Necesitas saber tu IP para configurar la app.

### Windows
```powershell
ipconfig
```
Busca **"Dirección IPv4"** bajo tu adaptador WiFi. Ejemplo: `192.168.1.100`

### macOS
```bash
ipconfig getifaddr en0
```

### Linux
```bash
hostname -I | awk '{print $1}'
```

---

## PASO 5 — Abrir el puerto en el Firewall (Windows)

Si tu teléfono no puede conectarse, Windows puede estar bloqueando el puerto. Abre PowerShell **como administrador** y corre:

```powershell
New-NetFirewallRule -DisplayName "Ollama Pidelo" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow
```

---

## PASO 6 — Actualizar el archivo de configuración

Abre `frontend/services/geminiService.ts` y cambia la IP en la línea:

```ts
// Cambia esto:
const OLLAMA_URL = 'http://192.168.1.100:11434/api/chat';

// Por la IP de TU máquina:
const OLLAMA_URL = 'http://TU_IP_AQUI:11434/api/chat';
```

> 💡 Cada miembro del equipo debe usar **su propia IP**. No compartas esta línea modificada al repositorio.

---

## PASO 7 — Verificar que funciona

Antes de abrir la app, verifica que tu teléfono puede llegar a Ollama.

1. Asegúrate de que tu teléfono está en el **mismo WiFi** que tu PC
2. Abre Safari/Chrome en tu teléfono y ve a:
```
http://TU_IP:11434
```
3. Debe aparecer el texto: **`Ollama is running`**

Si no carga, revisa el Paso 5 (firewall).

---

## PASO 8 — Correr la app

```bash
cd pidelo
npx expo start --clear
```

Escanea el QR con Expo Go en tu iPhone. El chatbot ya debería responder con Llama3. 🎉

---

## Comandos útiles del día a día

```bash
# Ver modelos descargados
ollama list

# Iniciar Ollama expuesto a la red (el que usarás siempre)
# Windows:
$env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve

# macOS/Linux:
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# Probar el modelo directamente en terminal
ollama run llama3

# Ver si Ollama está corriendo
curl http://localhost:11434
```

---

## Solución de problemas

| Error | Causa probable | Solución |
|-------|---------------|----------|
| `Network request failed` | Ollama no está corriendo | Corre el Paso 3 |
| `Ollama is running` no aparece en el teléfono | Firewall bloqueando | Corre el Paso 5 |
| Respuestas muy lentas | Poca RAM disponible | Cierra otras aplicaciones |
| `model not found` | Llama3 no descargado | Corre `ollama pull llama3` |
| Teléfono y PC en redes distintas | WiFi diferente | Conecta ambos al mismo router |

---

## Notas importantes
