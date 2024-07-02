const express = require('express');
const { depositMoney } = require('./controller');

const router = express.Router();

router.route('/deposit/:userId')
    .post(depositMoney);


module.exports = router;