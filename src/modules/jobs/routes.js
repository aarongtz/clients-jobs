const express = require('express');
const { payJob, getUnpaidJobs } = require('./controller');

const router = express.Router();

router.route('/unpaid')
    .get(getUnpaidJobs);

router.route('/:jobid/pay')
    .post(payJob);


module.exports = router;