const { Op } = require('sequelize');

const { sequelize } = require('../../model');
const { USER_TYPES } = require('../../constants/User');
const response = require('../../network/responses');

const depositMoney = async(req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { body, profile, params: { userId } } = req;
        const { id: loggedUserId, type: userType } = profile;
        const { Contract, Job, Profile } = req.app.get('models');
        const { demositAmount } = body;

        if(isNaN(demositAmount) || isNaN(userId)) {
            const error = new Error('Please, provide valid request data');
            error.statusCode = 400;
            throw error;
        }

        if (userType === USER_TYPES.CONTRACTOR_TYPE || loggedUserId !== parseInt(userId)) {
            const error = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        }

        const demositAmountNumeric = parseFloat(demositAmount);

        sequelize.sync();
        const contracts = await Contract.findAll({
            where: {
                ClientId: loggedUserId
            },
            include: [
                {
                    model: Job,
                    where: {
                        paid: {
                            [Op.is]: null
                        }
                    },
                    attributes: [[sequelize.fn('SUM', sequelize.col('price')), 'totalPrice']]
                }
            ],
            group: ['Contract.id'],
            raw: true
        }, {
            transaction
        });

        if(!contracts.length) {
            const error = new Error('No contracts found');
            error.statusCode = 404;
            throw error;
        }

        const profileModel = await Profile.findOne({
            where: {
                id: loggedUserId
            }
        }, {
            transaction
        });

        const totalSum = contracts.reduce((acc, contract) => {
            return acc + parseFloat(contract['Jobs.totalPrice'] || 0);
        }, 0);

        const percentage = .25;
        const percentageValue = totalSum * percentage;

        console.log("PERCENTAGE: ", percentageValue);

        if(demositAmountNumeric > percentageValue) {
            const error = new Error('You cannot deposit more than 25% of your total jobs to pay');
            error.statusCode = 403;
            throw error;
        }

        profileModel.balance += demositAmountNumeric;
        await profileModel.save();

        transaction.commit();
        return response.success(req, res, 'Funds added correctly', 200);

    }catch(error) {
        await transaction.rollback();
        return response.error(req, res, error.message, error.statusCode);
    }
}

module.exports = {
    depositMoney
};