
const HttpError = require('../util/http-error');

const authRole = (role) => {
    return (decodedToken, req, res, next) => {
        if (role !== req.userData.isCustomer) {
            return next(new HttpError('Permiso denegado', 401));
        }
        next();
    }
}

module.exports = {
    authRole
};