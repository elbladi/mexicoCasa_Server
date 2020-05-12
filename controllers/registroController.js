const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const bcrypt = require('bcrypt');
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
                        password: hashedPassword,
                        verificado: false
                    }
                    createUser = firebase.firestore().collection('clients').doc(newUser.id).set(newUser)
                        .then(_ => {

                            console.log('Usuario creado')

                            res.json({ message: 'CREATION SUCCESS' });
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
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(
            new HttpError('Error, Por favor revisa tus datos de entrada', 422)
        );
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
                    calificacion: null
                }
                try {
                    firebase.firestore().collection('business').doc(newBusiness.id).set(newBusiness)
                        .then(_ => {
                            console.log("Negocio creado")

                            res.json({
                                message: "CREATION SUCCESS"
                            });
                        })
                        .catch(error => next(new HttpError(error.message, 500)))
                } catch (error) {
                    return next(new HttpError(error.message, 500));
                }
            })
            .catch(error => {
                return next(new HttpError(error.message, 500));
            })
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }


};

exports.newClient = newClient;
exports.newBusiness = newBusiness;