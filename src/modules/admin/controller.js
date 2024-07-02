const { sequelize } = require('../../model');
const response = require('../../network/responses');

const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) {
        return false;
    }
    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        return false;
    }
    return date.toISOString().startsWith(dateString);
}

// Date needs to be formatted as YYYY-mm-dd
const getBestProfession = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { start, end } = req.query;

        if (!isValidDate(start) || !isValidDate(end)) {
            const error = new Error('Please, provide valid request data');
            error.statusCode = 400;
            throw error;
        }

        const result = await sequelize.query(
            `
            SELECT
              Profile.profession,
              SUM(Jobs.price) AS totalEarnings
            FROM
              Profiles AS Profile
              INNER JOIN Contracts AS Contractor ON Profile.id = Contractor.ContractorId
              INNER JOIN Jobs AS Jobs ON Contractor.id = Jobs.ContractId
            WHERE
              Jobs.paid = 1
              AND Jobs.createdAt BETWEEN :startDate AND :endDate
            GROUP BY
              Profile.profession
            ORDER BY
              totalEarnings DESC
            LIMIT 1;
            `,
            {
                replacements: { startDate: start, endDate: end },
                type: sequelize.QueryTypes.SELECT,
                transaction
            }
        );

        if (!result.length) {
            const error = new Error('No results found');
            error.statusCode = 404;
            throw error;
        }

        await transaction.commit();

        return response.success(req, res, { profession: result[0].profession });
    } catch (error) {
        await transaction.rollback();
        return response.error(req, res, error.message, error.statusCode);
    }

}

const getBestCustomer = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { start, end, limit } = req.query;
        let limitQuery = limit;
        if(!limit || !isNaN(limit)) {
            limitQuery = 2;
        }

        console.log('limit: ', limitQuery);

        if (!isValidDate(start) || !isValidDate(end)) {
            const error = new Error('Please, provide valid request data');
            error.statusCode = 400;
            throw error;
        }

        const results = await sequelize.query(
            `
            SELECT
                Profile.id,
                Profile.firstName,
                Profile.lastName,
                Profile.profession,
                SUM(Jobs.price) AS totalEarnings
            FROM
              Profiles AS Profile
              INNER JOIN Contracts AS Client ON Profile.id = Client.ClientId
              INNER JOIN Jobs AS Jobs ON Client.id = Jobs.ContractId
            WHERE
              Jobs.paid = 1
              AND Jobs.createdAt BETWEEN :startDate AND :endDate
            GROUP BY
              Profile.id
            ORDER BY
              totalEarnings DESC
            LIMIT :limit;
            `,
            {
                replacements: { startDate: start, endDate: end, limit: limitQuery },
                type: sequelize.QueryTypes.SELECT,
                transaction
            }
        );

        if (!results.length) {
            const error = new Error('No results found');
            error.statusCode = 404;
            throw error;
        }

        await transaction.commit();

        const profiles = [];
        results.forEach((value) => {
            const profile = {
                id: value.id,
                fullName: `${value.firstName} ${value.lastName}`,
                paid: value.totalEarnings
            };

            profiles.push(profile);
        });

        return response.success(req, res, profiles);
    } catch (error) {
        await transaction.rollback();
        return response.error(req, res, error.message, error.statusCode);
    }
}

module.exports = {
    getBestCustomer,
    getBestProfession
};