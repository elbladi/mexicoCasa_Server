const HttpError = require('../util/http-error');
const bcrypt = require('bcrypt');
const instance = require('../firebase');
const jwt = require('jsonwebtoken');
require('firebase/firestore');

let user = null;

const getUser = (credentials) => {

    const firebase = instance.getInstance();
    return new Promise((resolve, reject) => {
        try {
            firebase.firestore().collection('users')
                .where('email', '==', credentials.email)
                .get()
                .then(snapshot => {
                    
                    if (snapshot.empty) {
                        reject(new HttpError('Usuario o contraseña incorrectos', 401));

                    } else {

                        snapshot.forEach(doc => {
                            user = {
                                id: doc.id,
                                ...doc.data(),
                            }
                        });
                        resolve(user);

                    }

                }).catch(error => {
                    reject(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
                })
        } catch (error) {
            reject(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
        }
    });
}

const login = (req, res, next) => {
    const credentials = req.body;
    let token;
    getUser(credentials)
        .then(user => {
            try {
                if (credentials) {
                    bcrypt.compare(credentials.password, user.password)
                        .then(isEqual => {
                            if (isEqual) {
                                token = jwt.sign(
                                    {
                                        email: user.email,
                                        id: user.id
                                    },
                                    process.env.JWT_KEY,
                                    { expiresIn: '1h' }
                                );
                                res.status(201).json({
                                    token: token,
                                    id: user.id,
                                    isCustomer: user.isCustomer,
                                });
                            } else {
                                return next(new HttpError('Usuario o contraseña incorrecto', 401));
                            }
                        })
                        .catch(err => {
                            return next(new HttpError('Algo salio mal, intente mas tarde', 503));
                        })
                }
            } catch (error) {
                return next(error);

            }
        })
        .catch(error => {
            return next(error);
        });
}

exports.login = login;