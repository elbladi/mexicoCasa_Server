const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const { validationResult } = require('express-validator');

const instance = require('../firebase');
require('firebase/firestore');
require('firebase/auth');

const newClient = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(
            new HttpError('Error, Por favor revisa tus datos de entrada', 422)
        );
    }
    let firebase = instance.getInstance();

    const newUser = {
        ...req.body,
        verificado: false
    }
    console.log('INICIANDO...')
    let err = false
    let existingUser;
    try {
        existingUser = await firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
            .then(succ => { })
            .catch(error => {
                existingUser.error = error
                // return next(new HttpError(error.message, 500))
            })
        console.log(existingUser);
    } catch (error) {
        existingUser = true;
        // return next(new HttpError(error.message, 500));
    }
    if (existingUser) {
        return next(new HttpError('User exist already. Please login', 422));
    }

    let createUset;
    try {
        createUset = await firebase.firestore().collection('clients').doc(newUser.id).set(newUser)
            .then(_ => { })
            .catch(error => createUset.error = error)
        console.log(createUset);
    } catch (error) {
        createUset = true;
        return next(new HttpError(error.message, 500));
    }

    if (createUset) {
        return next(new HttpError('ALGO SALIO MAL', 500));
    }

    console.log('Usuario creado')

    res.json({ message: 'CREATION SUCCESS' });
};


const newBusiness = (req, res, next) => {

};

exports.newClient = newClient;
exports.newBusiness = newBusiness;