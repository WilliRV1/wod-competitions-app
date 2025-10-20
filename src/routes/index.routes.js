const {Router} = require ("express");
const router = Router();

router.get('/', (req, res) => {
    res.send('<h1>Primer pantalla app de crossfit</h1>');
  });

module.exports=router;


