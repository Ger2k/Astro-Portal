# Portal Games Tracker

Aplicación web construida con Astro, React y Firebase para registrar juegos completados, mantener una biblioteca personal y gestionar la sesión con Google.

## Resumen

Portal Games Tracker combina una landing ligera con una zona de aplicación donde cada usuario puede:

- iniciar sesión con Google,
- guardar juegos completados en Firebase Realtime Database,
- editar o eliminar registros existentes,
- buscar portadas desde RAWG mediante un endpoint del servidor,
- usar filtros, ordenación y paginación,
- cambiar entre varios temas visuales.

## Stack

- Astro 6
- React 19
- Tailwind CSS 4
- Firebase Authentication
- Firebase Realtime Database
- Netlify SSR

## Requisitos

- Node.js 22.12.0 o superior
- npm
- Un proyecto de Firebase con Authentication y Realtime Database configurados
- Una API key válida de RAWG para la búsqueda de portadas

## Variables de entorno

Crea un archivo `.env` o configura estas variables en tu proveedor de despliegue:

```env
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_APP_ID=
PUBLIC_FIREBASE_DATABASE_URL=
RAWG_API_KEY=
```

Notas importantes:

- Las variables con prefijo `PUBLIC_` se usan en cliente para inicializar Firebase.
- `RAWG_API_KEY` solo debe existir en entorno servidor.
- Si despliegas en Netlify, añade tu dominio en Firebase Authentication > Settings > Authorized domains.
- Activa el proveedor de Google en Firebase Authentication > Sign-in method.

## Instalación

```sh
npm install
```

## Desarrollo

```sh
npm run dev
```

La aplicación se ejecutará en local y expondrá la landing en `/` y la aplicación principal en `/app`.

## Scripts disponibles

| Comando | Descripción |
| :-- | :-- |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la build de producción |
| `npm run preview` | Previsualiza la build generada |
| `npm run check` | Ejecuta validaciones de Astro |
| `npm run typecheck` | Alias de validación de tipos |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige problemas automáticos de lint |
| `npm run format` | Formatea el proyecto con Prettier |
| `npm run format:check` | Comprueba el formato sin modificar archivos |

## Despliegue

El proyecto está preparado para ejecutarse en Netlify con renderizado SSR.

Pasos recomendados:

1. Configura todas las variables de entorno en Netlify.
2. Verifica que Firebase Authentication autoriza el dominio de producción.
3. Ejecuta localmente `npm run build` antes de publicar.

## Estructura general

```text
src/
	config/        Configuración de Firebase y utilidades base
	domains/       Lógica de negocio por áreas: auth, games, design-system
	layouts/       Layouts Astro compartidos
	pages/         Rutas públicas, privadas y endpoints
	shared/        Componentes y utilidades reutilizables
```

## Estado del proyecto

La aplicación está orientada a uso real y ya incluye:

- autenticación con Google,
- persistencia por usuario,
- interfaz responsive,
- temas visuales persistidos,
- endpoint server-side para portadas con RAWG.

## Seguridad y reglas de Firebase

El archivo `database.rules.json` define las reglas de seguridad de Firebase Realtime Database.
Cada usuario solo puede leer y escribir sus propios datos (`auth.uid === $uid`).

Para desplegar las reglas en Firebase:

```sh
# Instala Firebase CLI si no lo tienes
npm install -g firebase-tools

# Autentícate
firebase login

# Inicializa el proyecto (selecciona tu proyecto cuando lo pida)
firebase init database

# Despliega solo las reglas
firebase deploy --only database:rules
```

**Nunca subas el archivo `.env` a tu repositorio.** Usa el gestor de variables de entorno de Netlify para las credenciales de producción, y rota las claves si sospechas que se han expuesto.

## CI / Integración continua

El proyecto incluye un workflow de GitHub Actions en `.github/workflows/ci.yml` que ejecuta automáticamente:

1. `npm run lint` — análisis estático con ESLint
2. `npm run typecheck` — validación de tipos con Astro/TypeScript
3. `npm run build` — compilación de producción

El workflow se activa en cada push a `main` y en pull requests. No requiere secretos reales en CI porque las variables de Firebase se usan en runtime (cliente/servidor), no en tiempo de build.

## Licencia

Uso privado o según lo que decida el propietario del repositorio.
