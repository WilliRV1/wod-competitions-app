const {Router} = require ("express");
const router = Router();
const controller = require("../Controllers/user")

router.get('/users', controller.getUser)
router.get('/users/:id', controller.getUserID)

router.post('/users',controller.newUser)

router.put("/users/:id",controller.putUser)

router.delete("/users/:id", controller.deleteUser)

module.exports = router