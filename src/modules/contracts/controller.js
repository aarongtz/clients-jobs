const response = require('../../network/responses');
const { USER_TYPES } = require('../../constants/User');

const getContracts = async (req, res, next) => {
    try{
        const { Contract } = req.app.get('models');

        const { id: loggedUserId, type: userType } = req.profile;
    
        const contracts = await Contract.findAll({ 
            where: { 
                ...(userType === USER_TYPES.CONTRACTOR_TYPE ? { ContractorId:  loggedUserId} : { ClientId: loggedUserId })
            } 
        });
    
        if(!contracts.length) return response.error(req, res, "No results", 404);
    
        return response.success(req, res, contracts, 200);
    }catch(error) {
        return response.error(req, res, 'Internal Server Error', 500);
    }
}

const getContract = async (req, res, next) => {
    try{
        const { Contract } = req.app.get('models');
        const { id: contractId } = req.params;
        const { id: loggedUserId, type: userType } = req.profile;
    
        const contract = await Contract.findOne({ 
            where: { 
                id: contractId,
                ...(userType === USER_TYPES.CONTRACTOR_TYPE ? { ContractorId:  loggedUserId} : { ClientId: loggedUserId })
            } 
        });
        if (!contract) return response.error(req, res, "No results", 404);
    
        return response.success(req, res, contract, 200);
    }catch(error) {
        return response.error(req, res, 'Internal Server Error', 500);
    }
}

module.exports = {
    getContract,
    getContracts
};