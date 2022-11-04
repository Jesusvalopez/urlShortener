## Instalación

#### Requerimientos:

Tener instalado docker

## Como iniciar:

Luego de clonar el proyecto, crear archivo .env en la raíz del proyecto con la variable DATABASE_URL

`DATABASE_URL = "postgresql://root:postgres@pg_db:5432/url_shortener?schema=public"`

Ejecutar comandos

`docker-compose build` y
`docker-compose up -d`

Luego ingresar al contenedor urlshortener_app_1

`docker exec -it urlshortener_app_1 sh`

Y ejecutar el siguiente comando para correr las migraciones en la bd:

`npx prisma migrate dev --name ini`

Listo, en localhost ya se puede acceder al proyecto.
