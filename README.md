# wod-competitions-app

Aplicación web para conectar a la comunidad de CrossFit en Colombia, encontrar competencias y buscar compañeros de equipo.

## 🚀 Empezando

Esta es la guía de instalación para levantar el servidor de backend localmente.

### Pre-requisitos

Asegúrate de tener instalado:
* Node.js (v18 o superior)
* npm
* Git

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone [https://github.com/WilliRV1/wod-competitions-app.git](https://github.com/WilliRV1/wod-competitions-app.git)
    ```
2.  Entra en la carpeta del proyecto:
    ```bash
    cd wod-competitions-app
    ```
3.  Instala las dependencias de npm:
    ```bash
    npm install
    ```

### Variables de Entorno

Para correr este proyecto, necesitas un archivo `.env` en la raíz del directorio. Este archivo **no** debe ser subido a Git.

Crea un archivo `.env` y añade la siguiente variable:

```env
# Ejemplo de .env
MONGODB_URI=tu-cadena-de-conexion-de-mongodb-atlas