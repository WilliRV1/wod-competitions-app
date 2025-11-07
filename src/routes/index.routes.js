const {Router} = require ("express");
const router = Router();
const authMiddleware = require("../middlewares/auth.middleware");
const battleRoutes = require('./battle.routes');
const matchRoutes = require('./match.routes');
const registrationRoutes = require('./registration.routes');
router.get('/', (req, res) => {
    res.send('<h1>Primer pantalla app de crossfit</h1>');
  });
router.use('/api/battles', battleRoutes);
router.use('/api/matches', matchRoutes);
router.use('/api/registrations', registrationRoutes);

module.exports=router;


