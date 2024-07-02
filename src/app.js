const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile');
const { routes: contractRoutes } = require('./modules/contracts');
const { routes: jobRoutes } = require('./modules/jobs');
const { routes: balancesRoutes } = require('./modules/balances');
const { routes: adminRoutes } = require('./modules/admin');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.use('/contracts', getProfile, contractRoutes);
app.use('/jobs', getProfile, jobRoutes);
app.use('/balances', getProfile, balancesRoutes);
app.use('/admin', getProfile, adminRoutes);

module.exports = app;
