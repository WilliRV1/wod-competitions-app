# WODMATCH BATTLE - Backend

Este repositorio contiene el **Backend** de la plataforma **WODMATCH BATTLE**. Es el encargado de gestionar la lógica de negocio, la persistencia de datos y la comunicación en tiempo real para las competencias de CrossFit.

## 🏆 Cumplimiento con la Rúbrica del Proyecto Final

El backend soporta las funcionalidades críticas solicitadas en la rúbrica:

### 1. Almacenamiento y Base de Datos
- **Base de Datos en la Nube**: Se utiliza **MongoDB Atlas** para el almacenamiento persistente de usuarios, competencias, brackets y resultados.
- **Transacción de Datos**: API RESTful robusta para el manejo de operaciones CRUD (Crear, Leer, Actualizar, Eliminar).

### 2. Comunicación en Tiempo Real
- **Socket.io**: Implementación de un servidor de WebSockets para emitir eventos de actualización de brackets y resultados a todos los clientes conectados simultáneamente.

### 3. Seguridad y Usuarios
- **Validación**: Integración con el frontend para asegurar que las operaciones críticas sean realizadas por usuarios autorizados.
- **Gestión de Usuarios**: Endpoints para la creación y administración de perfiles de atletas.

### 4. Tecnologías Utilizadas
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: MongoDB + Mongoose
- **Tiempo Real**: Socket.io
- **Otros**: Cors, Dotenv

---

## 📋 Información de Entrega

### Despliegue (Deployment)
El servicio backend se encuentra publicado en:
- **URL del API:** [Enlace al Backend](https://wod-match-api.vercel.app) *(Por favor, actualizar con el enlace real)*

### Integrantes del Equipo
- **Nombre del Integrante 1** - Rol (Frontend/Backend)
- **Nombre del Integrante 2** - Rol (Frontend/Backend)
- **Nombre del Integrante 3** - Rol (Frontend/Backend)

---

## 🚀 Instalación y Ejecución Local

### Pre-requisitos
- Node.js (v18 o superior)
- MongoDB Atlas URI

### Pasos
1.  **Clonar el repositorio e instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz con la siguiente variable:
    ```env
    MONGODB_URI=tu-cadena-de-conexion-de-mongodb-atlas
    ```

3.  **Iniciar el Servidor:**
    ```bash
    npm run dev
    ```
    El servidor iniciará en `http://localhost:5000`.
