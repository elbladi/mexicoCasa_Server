
const HttpError = require('../util/http-error');

const authRole = (role) => {
    return (decodedToken, req, res, next) => {
        if (role !== decodedToken.isCustomer) {
            return next(new HttpError('Permiso denegado', 403));
        }
        next();
    }
}

module.exports = {
    authRole
};