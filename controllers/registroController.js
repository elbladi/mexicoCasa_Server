const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const instance = require('../firebase');
require('firebase/firestore');
require('firebase/auth');

const newClient = (req, res, next) => {
    console.log('Llego al controller')
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(
            new HttpError('Error, Por favor revisa tus datos de entrada', 422)
        );
    }

    console.log('Inicio instancia')
    let firebase = instance.getInstance();

    let hashedPassword;
    try {
        bcrypt.hash(req.body.password, 12)
            .then(hash => {
                hashedPassword = hash;
            })
            .catch(err => next(new HttpError('Creacion de usuario fallo', 500)))
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    console.log('INICIANDO...')
    try {
        firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
            .then(succ => {
                try {
                    console.log(hashedPassword);
                    const newUser = {
                        ...req.body,
                        // password: hashedPassword,
                        verificado: false
                    }
                    delete newUser['password'];
                    firebase.firestore().collection('clients').add(newUser)
                        .then(resp => {
                            console.log('Usuario creado')
                            const user = {
                                email: req.body.email,
                                password: hashedPassword,
                                isCustomer: true
                            }
                            firebase.firestore().collection('users').doc(resp.id).set(user).
                                then(succ => {
                                    res.json({ message: 'CREATION SUCCESS' })
                                })
                                .catch(err => {
                                    firebase.firestore().collection('clients').doc(resp.id).delete().catch(err => {
                                        return next(new HttpError('Creacion de usuario fallo, por favor intentalo mas tarde', 501));
                                    })
                                })
                        })
                        .catch(error => next(new HttpError(error.message, 500)))
                } catch (error) {
                    return next(new HttpError(error.message, 500));
                }
            })
            .catch(error => {

                return next(new HttpError(error.message, 500))
            })
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }

};


const newBusiness = (req, res, next) => {
    // const error = validationResult(req);
    // if (!error.isEmpty()) {
    //     return next(
    //         new HttpError('Error, Por favor revisa tus datos de entrada', 422)
    //     );
    // }

    let hashedPassword;
    let token;
    try {
        bcrypt.hash(req.body.password, 12)
            .then(hash => {
                hashedPassword = hash;
            })
            .catch(err => next(new HttpError('Creacion de usuario fallo', 500)))
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    let firebase = instance.getInstance();

    console.log('INICIANDO...')
    try {
        existingUser = firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
            .then(succ => {
                // agregar aqui
                const newBusiness = {
                    ...req.body,
                    verificado: false,
                }
                delete newBusiness['password'];
                try {
                    firebase.firestore().collection('business').add(newBusiness)
                        .then(resp => {
                            const user = {
                                email: req.body.email,
                                password: hashedPassword,
                                isCustomer: false
                            }
                            firebase.firestore().collection('users').doc(resp.id).set(user).
                                then(succ => {
                                    console.log("Negocio creado");
                                    token = jwt.sign(
                                        {
                                            email: user.email,
                                            id: resp.id
                                        },
                                        process.env.JWT_KEY,
                                        { expiresIn: '1h' }
                                    );
                                    res.json({
                                        message: 'CREATION SUCCESS',
                                        token: token,
                                        isCustomer: false,
                                        id: resp.id
                                    })
                                })
                                .catch(err => {
                                    firebase.firestore().collection('business').doc(resp.id).delete().catch(err => {
                                        return next(new HttpError('Creacion de usuario fallo, por favor intentalo mas tarde', 501));
                                    })
                                })
                        })
                        .catch(error => next(new HttpError(error.message, 500)))
                } catch (error) {
                    return next(new HttpError(error.message, 500));
                }
            })
            .catch(error => {
                return next(new HttpError("Email registrado. Por favor hacer Login", 402));
            })
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }


};

exports.newClient = newClient;
exports.newBusiness = newBusiness;