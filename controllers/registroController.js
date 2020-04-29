const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const { validationResult } = require('express-validator');

const instance = require('../firebase');
require('firebase/firestore');
require('firebase/auth');

const newClient = async (req, res, next) => {
    console.log('Llego al controller')
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(
            new HttpError('Error, Por favor revisa tus datos de entrada', 422)
        );
    }

    console.log('Inicio instancia')
    let firebase = instance.getInstance();

    const newUser = {
        ...req.body,
        verificado: false
    }
    console.log('INICIANDO...')
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

    let createUser;
    try {
        createUser = await firebase.firestore().collection('clients').doc(newUser.id).set(newUser)
            .then(_ => { })
            .catch(error => createUser.error = error)
        console.log(createUser);
    } catch (error) {
        createUser = true;
        return next(new HttpError(error.message, 500));
    }

    if (createUser) {
        return next(new HttpError('Something went wrong. Please, try again', 500));
    }

    console.log('Usuario creado')

    res.json({ message: 'CREATION SUCCESS' });
};


const newBusiness = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(
            new HttpError('Error, Por favor revisa tus datos de entrada', 422)
        );
    }

    let firebase = instance.getInstance();

    console.log('INICIANDO...')
    let existingUser;
    try {
        existingUser = await firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
            .then(succ => { })
            .catch(error => {
                existingUser.error = error
            })
        console.log(existingUser);
    } catch (error) {
        existingUser = true;
    }
    if (existingUser) {
        return next(new HttpError('User exist already. Please login', 422));
    }

    const newBusiness = {
        ...req.body,
        verificado: false,
        calificacion: null
    }

    let createUser;
    try {
        createUser = await firebase.firestore().collection('business').doc(newBusiness.id).set(newBusiness)
            .then(_ => { })
            .catch(error => createUser = true)
        console.log(createUser);
    } catch (error) {
        createUser = true;
        return next(new HttpError(error.message, 500));
    }

    if (createUser) {
        return next(new HttpError('Something went wrong. Please, try again', 500));
    }

    console.log("Negocio creado")

    res.json({
        message: "CREATION SUCCESS"
    });
};

exports.newClient = newClient;
exports.newBusiness = newBusiness;