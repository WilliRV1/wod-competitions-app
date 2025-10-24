const { Router } = require("express");
const router = Router();
// Tu importación está perfecta, asumiendo que tu carpeta es "Controllers"
const controller = require("../Controllers/user.js");
const authMiddleware = require("../middlewares/auth.middleware");

// Antes era: /users
// Ahora es: / (que significa /api/users)
router.get('/', controller.getUser);

// Antes era: /users/:id
// Ahora es: /:id (que significa /api/users/:id)
router.get('/:id', controller.getUserID);

// Antes era: /users
// Ahora es: /
router.post('/', controller.newUser);

// Antes era: /users/:id
// Ahora es: /:id
router.put("/:id", controller.putUser);

// Antes era: /users/delete/:id (Esta también estaba mal)
// Ahora es: /:id
router.delete("/:id", controller.deleteUser);

module.exports = router;