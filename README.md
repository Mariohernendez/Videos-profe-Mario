# Carrete — subir y guardar videos

Aplicación web sencilla (backend + frontend) para subir videos y que queden
guardados de forma permanente en un servidor, accesibles desde cualquier
dispositivo.

## Cómo está construida

- **Backend:** Node.js + Express + Multer (subida de archivos).
- **Base de datos:** un archivo `data/db.json` con los metadatos de cada
  video (nombre, tamaño, fecha). Es intencionalmente simple — suficiente
  para un proyecto personal o de bajo tráfico.
- **Almacenamiento de archivos:** los videos se guardan en `data/uploads/`,
  en el disco del servidor.
- **Frontend:** HTML + CSS + JavaScript sin frameworks, habla con el
  backend mediante `fetch`/`XMLHttpRequest`.

## Uso en tu computadora

Necesitas tener [Node.js](https://nodejs.org) instalado (versión 18 o
superior).

```bash
npm install
npm start
```

Luego abre `http://localhost:3000` en tu navegador.

## Subir esto a un servicio de hosting

Este proyecto es un servidor Node normal, así que puedes desplegarlo en
cualquier servicio que soporte Node.js. Dos opciones sencillas y con capa
gratuita:

### Opción A: Render.com

1. Sube esta carpeta a un repositorio de GitHub.
2. En Render, crea un **Web Service** nuevo apuntando a ese repositorio.
3. Build command: `npm install`
4. Start command: `npm start`
5. **Importante:** agrega un **Disco persistente** (Render → tu servicio →
   Disks) montado, por ejemplo, en `/data`, y define la variable de entorno
   `DATA_DIR=/data`. Sin esto, los videos se borran cada vez que el
   servicio se reinicia o se vuelve a desplegar, porque el sistema de
   archivos normal de Render es temporal.

### Opción B: Railway.app

1. Sube el proyecto a GitHub y conéctalo en Railway.
2. Railway detecta automáticamente que es un proyecto Node.
3. Agrega un **Volume** (almacenamiento persistente) y móntalo en `/data`.
4. Define la variable de entorno `DATA_DIR=/data`.

### Variables de entorno disponibles

| Variable          | Qué hace                                             | Valor por defecto            |
|-------------------|-------------------------------------------------------|-------------------------------|
| `PORT`            | Puerto en el que corre el servidor                    | `3000`                        |
| `DATA_DIR`        | Carpeta donde se guardan la base de datos y los videos| `./data` (dentro del proyecto)|
| `MAX_FILE_SIZE_MB`| Tamaño máximo por video, en MB                        | `500`                         |

## Sobre los discos "efímeros"

La mayoría de los planes gratuitos de hosting borran cualquier archivo que
no esté en un **disco persistente** cada vez que el servidor se reinicia o
se vuelve a desplegar. Por eso el paso de agregar un disco/volumen y
apuntar `DATA_DIR` a él es el paso más importante para que tus videos no
desaparezcan.

## Si el proyecto crece mucho

Este diseño (archivos en disco + un JSON como base de datos) es perfecto
para empezar, pero tiene límites:

- **Muchos videos o mucho tráfico:** cambia `data/db.json` por una base de
  datos real, como PostgreSQL o MongoDB.
- **Videos muy pesados o mucho público:** en vez de guardar los archivos en
  el disco del servidor, súbelos a un almacenamiento en la nube como
  Amazon S3, Cloudflare R2 o Backblaze B2, y guarda solo la URL en la base
  de datos. Esto también hace que los videos carguen más rápido, porque se
  sirven desde una red de distribución (CDN) en vez de tu servidor.

## Estructura del proyecto

```
carrete-app/
├── package.json
├── server/
│   └── index.js        # backend Express (API + servir archivos)
├── public/
│   ├── index.html       # página principal
│   ├── styles.css
│   └── app.js            # lógica de subida/listado/borrado
└── data/                 # se crea automáticamente al iniciar
    ├── db.json
    └── uploads/
```
