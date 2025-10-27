const {Router} = require ("express");
const router = Router();
const authMiddleware = require("../middlewares/auth.middleware");
router.get('/', (req, res) => {
    res.send('<h1>Primer pantalla app de crossfit</h1>');
  });

module.exports=router;


