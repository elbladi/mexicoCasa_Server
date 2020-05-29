
const HttpError = require('../util/http-error');

const authRole = (role) => {
    return (decodedToken, req, res, next) => {
        console.log(decodedToken)
        if (role !== decodedToken.isCustomer) {
            console.log(role +" "+ decodedToken.isCustomer)
            return next(new HttpError('Permiso denegado', 401));
        }
        next();
    }

}

module.exports = {
    authRole
};