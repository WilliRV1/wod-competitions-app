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
```
Corriendo el Servidor

Una vez instalado y con el .env configurado, puedes iniciar el servidor en modo de desarrollo:

```

npm run dev
```
El servidor se iniciará en http://localhost:5000 y se conectará a tu base de datos de MongoDB Atlas.

🛠️ API Endpoints (En Desarrollo)
La ruta base de la API es /api.

Endpoints de Usuarios (/api/users)
POST /api/users: Crea un nuevo usuario.

GET /api/users: Obtiene una lista de todos los usuarios.

GET /api/users/:id: Obtiene un usuario específico por su ID.

PUT /api/users/:id: Actualiza un usuario específico.

DELETE /api/users/:id: Borra un usuario específico.


---
## Tu Próxima Misión (La Gran Final de Backend)

1.  **Aplica los 3 arreglos** en tus archivos de `src/Models`.
2.  **Actualiza tu `README.md`** con la plantilla que te di.
3.  **Guarda y sube** todo este progreso a tu rama `Desarrollo` en GitHub.

Cuando hayas hecho eso, estaremos listos para la fase más emocionante: hacer que nuestros controladores usen estos modelos para **crear, leer, actualizar y borrar usuarios de verdad** en la base de datos. ¡Estás a un paso de terminar todo el backend!