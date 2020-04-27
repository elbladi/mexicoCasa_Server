const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const { validationResult } = require('express-validator');

const instance = require('../firebase');
require('firebase/firestore');
require('firebase/auth');

const loginClient = (req, res, next) => {

    // try {
    //     const firebase = instance.getInstance();
    //     firebase.auth().createUserWithEmailAndPassword(email, password)
    //         .then(succ => { })
    //         .catch(err =>  )
    // } catch (error) {

    // }


}