const HttpError = require('../util/http-error');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    };

    let token;
    try {
        token = req.headers.authorization;
        token = token ? token.split(' ')[1] : null;
        if (!token) {
            throw new Error('auth fail');
        };
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        const userData = { userId: decodedToken.id, isCustomer: decodedToken.isCustomer };
        req.userData = userData;
        next(userData);
    } catch (error) {
        return next(new HttpError('Authentication failed', 401));
    };



};