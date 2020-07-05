
const HttpError = require('../util/http-error');

const authRole = (role) => {
    return (req, res, next) => {
        
        if (role !== req.userData.isCustomer) {
            return next(new HttpError('Permiso denegado', 403));
        }
        next();
    }
}

module.exports = {
    authRole
};