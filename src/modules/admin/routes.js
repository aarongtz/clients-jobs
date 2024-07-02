const express = require('express');
const { getBestCustomer, getBestProfession } = require('./controller');

const router = express.Router();

router.route('/best-profession')
    .get(getBestProfession);

router.route('/best-clients')
    .get(getBestCustomer);


module.exports = router;