const { sequelize } = require('../../model');
const response = require('../../network/responses');
const { STATUSES } = require('../../constants/Contracts');
const { USER_TYPES } = require('../../constants/User');

const getUnpaidJobs = async (req, res, next) => {
    try {
        const { id: loggedUserId, type: userType } = req.profile;
        const { Contract, Job } = req.app.get('models');

        const contracts = await Contract.findAll({
            where: {
                ...(userType === USER_TYPES.CONTRACTOR_TYPE ? { ContractorId: loggedUserId } : { ClientId: loggedUserId }),
                status: STATUSES.IN_PROGRESS
            },
            include: {
                model: Job,
                where: {
                    paid: true
                }
            }
        });

        if (!contracts.length) {
            return response.success(req, res, [], 200);
        }

        const jobs = contracts.flatMap(contract => contract.Jobs);

        if (!jobs.length) {
            return response.success(req, res, [], 200);
        }

        return response.success(req, res, jobs, 200);

    } catch (error) {
        return response.error(req, res, "Internal Server Error", 500);
    }
};

const payJob = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { profile, params: { jobid } } = req;
        const { id: loggedUserId, type: userType, balance } = profile;
        const { Contract, Job, Profile } = req.app.get('models');

        if (userType === USER_TYPES.CONTRACTOR_TYPE) {
            const error = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        }

        await sequelize.sync();

        const job = await Job.findOne({
            where: {
                id: jobid
            },
            include: [
                {
                    model: Contract,
                    include: {
                        model: Profile,
                        as: 'Contractor'
                    }
                },
                {
                    model: Contract,
                    include: {
                        model: Profile,
                        as: 'Client'
                    }
                }
            ]
        }, {
            transaction
        });

        if(!job.Contract.Client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        const clientModel = job.Contract.Client;

        if(clientModel.id !== loggedUserId) {
            const error = new Error('This job does not belong to that user');
            error.statusCode = 403;
            throw error;
        }

        if (!job || !job.Contract || !job.Contract.Contractor) {
            const error = new Error('Not a valid job');
            error.statusCode = 404;
            throw error;
        }

        if(job.paid) {
            const error = new Error('Job already paid');
            error.statusCode = 402;
            throw error;
        }

        if (balance < job.price) {
            const error = new Error('Not enough balance');
            error.statusCode = 402;
            throw error;
        }

        const date = new Date();
        const isoString = date.toISOString();
        job.paid = true;
        job.paymentDate = isoString;
        await job.save();

        const contractorProfile = job.Contract.Contractor;

        contractorProfile.balance = contractorProfile.balance + job.price;

        await contractorProfile.save();

        clientModel.balance = (profile.balance - job.price);

        await clientModel.save();

        await transaction.commit();

        return response.success(req, res, 'Job paid successfully', 200);

    } catch (error) {
        await transaction.rollback();
        return response.error(req, res, error.message, error.statusCode);
    }
};



module.exports = {
    getUnpaidJobs,
    payJob
}