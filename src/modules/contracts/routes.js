const express = require('express');
const { getContract, getContracts } = require('./controller');

const router = express.Router();


router.route('/')
    .get(getContracts);


router.route('/:id')
    .get(getContract);



module.exports = router;