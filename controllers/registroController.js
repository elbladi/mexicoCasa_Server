const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { fileUploader } = require('../middleware/fileUploader');
const { ROLE } = require('../util/permissions/roles');
const instance = require('../firebase');
require('firebase/firestore');
require('firebase/auth');

const newClient = async (req, res, next) => {

    let firebase = instance.getInstance();

    /*
    * Verify the user is not registered
    */

    let userExist;
    try {
        userExist = await firebase.firestore().collection('users')
            .where('email', '==', req.body.email)
            .get()
            .then(snapshot => {
                if (snapshot.empty) return false
                else return true;
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal, por favor verificar datos', 500));
    }

    if (userExist) {
        res.json({ message: 'Email registrado. Por favor hacer Login' });
    }

    /**
     * Register the user in client collection
     * Get the created client id
     */

    let newClient = {
        ...req.body,
        verificado: false
    }
    delete (newClient['password'])

    let newUserId;
    try {
        newUserId = await firebase.firestore().collection('clients').add(newClient)
            .then(resp => {
                return resp.id;
            })
            .catch(_ => {
                next(new HttpError('Creacion de usuario fallo', 500))
            })
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    if (!newUserId) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    /**
    * Hash the password 
    */

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(req.body.password, 12)
            .then(hash => {
                return hash;
            })
            .catch(err => '')
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    if (!hashedPassword) return next(new HttpError('Creacion de usuario fallo', 500));

    /**
     * Upload the user to users collection
     */

    const user = {
        email: newClient.email,
        password: hashedPassword,
        isCustomer: true
    }

    let newUser;
    try {
        newUser = await firebase.firestore().collection('users').doc(newUserId).set(user)
            .then(_ => true)
            .catch(_ => false)

    } catch (_) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    if (!newUser) return next(new HttpError('Creacion de usuario fallo', 500));

    /**
     * Create the token and send it 
     */

    const token = jwt.sign(
        {
            email: user.email,
            id: newUserId
        },
        process.env.JWT_KEY,
        { expiresIn: '1h' }
    );


    res.json({
        message: 'Ok',
        client: newClient,
        token: token,
        isCustomer: true,
        id: newUserId
    })

};

const deleteBusinessFromCollection = (businessId) => {
    return new Promise((resolver, reject) => {
        let firebase = instance.getInstance();
        try {
            firebase.firestore().collection('business').doc(businessId).delete().
                then(_ => {
                    resolver()
                })
                .catch(_ => {
                    reject();
                    console.log('La eliminacion salio mal, eliminar manualmente el Business id: ' + businessId)
                })
        } catch (error) {
            reject();
        }
    });
};

const newBusiness = async (req, res, next) => {
    /*
    * Verify the request contain photoINE
    */

    if (!req.files) return next(new HttpError('no llego el file', 500));
    if (!req.files['photoINE']) return next(new HttpError('Foto de ID requerida', 500));

    let body = {}
    Object.keys(req.body).forEach((value, _) => {
        body[value] = JSON.parse(req.body[value]);
    })

    const email = body.email

    /*
    * Verify the user is not registered
    */

    let firebase = instance.getInstance();
    let existe;
    try {
        existe = await firebase.firestore().collection('users')
            .where('email', '==', email)
            .get()
            .then(snapshot => {
                if (snapshot.empty) return false
                else return true;
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal, por favor verificar datos', 500));
    }

    if (existe) {
        return next(new HttpError('Email registrado. Por favor hacer Login', 500));
    }

    /**
     * Create the business in the business collection
     * Get the created business id 
     */

    let newBusiness = {
        ...body,
        verificado: false,
    }
    delete newBusiness['password'];

    let newUserId;
    try {
        newUserId = await firebase.firestore().collection('business').add(newBusiness)
            .then(resp => {
                return resp.id;
            })
            .catch(_ => {
                next(new HttpError('Creacion de usuario fallo', 500))
            })
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    if (!newUserId) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    /**
     * Upload the images or image using the created business id
     * if upload fails: delete the business id in business collection
     */

    let photoINE;
    try {
        photoINE = await fileUploader(ROLE.BUSINESS, { id: newUserId, childFolder: 'register' }, { file: req.files['photoINE'] });
    } catch (error) {
        return next(new HttpError('Algo salio mal, intente mas tarde', 503));
    }

    if (!photoINE) {
        deleteBusinessFromCollection(newUserId)
            .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
        return next(new HttpError('Algo salio mal, intente mas tarde', 503))
    }

    let photoBusiness
    if (req.files['photoBusiness']) {
        try {
            photoBusiness = await fileUploader(ROLE.BUSINESS, { id: newUserId, childFolder: 'register' }, { file: req.files['photoBusiness'] })
        } catch (error) {
            return next(new HttpError('Algo salio mal, intente mas tarde', 503));
        }
    } else {
        photoBusiness = 'empty'
    }

    if (!photoBusiness) {
        deleteBusinessFromCollection(newUserId)
            .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
        return next(new HttpError('Algo salio mal, intente mas tarde', 503))
    }

    /**
     * Update the photos url of created business in business collection 
     */
    let updated;
    try {
        updated = await firebase.firestore().collection('business').doc(newUserId)
            .update({
                photoINE: photoINE,
                photoBusiness: photoBusiness
            })
            .then(_ => true)
            .catch(_ => false);
    } catch (error) {
        console.log(error);
        deleteBusinessFromCollection(newUserId)
            .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
        return next(new HttpError('Algo salio mal, intente mas tarde', 503))
    }

    if (!updated) {
        deleteBusinessFromCollection(newUserId)
            .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
        return next(new HttpError('Algo salio mal, intente mas tarde', 503))
    }

    /**
     * Hash the password 
     */

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(body.password, 12)
            .then(hash => {
                return hash;
            })
            .catch(err => '')
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    if (!hashedPassword) {
        deleteBusinessFromCollection(newUserId)
            .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    /**
     * Upload the user to users collection
     * if upload fails: delete the image(s) and delete the business id in business collection
     */

    const user = {
        email: email,
        password: hashedPassword,
        isCustomer: false
    }

    let newUser;
    try {
        newUser = await firebase.firestore().collection('users').doc(newUserId).set(user)
            .then(_ => {
                return true;
            })
            .catch(_ => {
                deleteBusinessFromCollection(newUserId)
                    .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
                    .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            })

    } catch (_) {
        deleteBusinessFromCollection(newUserId)
            .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
            .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
    }

    if (!newUser) return next(new HttpError('Creacion de usuario fallo', 500));

    /**
     * Create the token and send it 
     */

    const token = jwt.sign(
        {
            email: user.email,
            id: newUserId
        },
        process.env.JWT_KEY,
        { expiresIn: '1h' }
    );

    /**
     * Set newBusiness 
     */
    newBusiness = {
        ...newBusiness,
        photoINE: photoINE,
        photoBusiness: photoBusiness
    }

    res.json({
        message: 'CREATION SUCCESS',
        business: newBusiness,
        token: token,
        isCustomer: false,
        id: newUserId
    })

};

const verifyEmailExist = (req, res, next) => {
    let email = req.params.email;
    email = email.trim();
    const firebase = instance.getInstance();
    try {
        firebase.firestore().collection('users')
            .where('email', '==', email)
            .get()
            .then(snapshot => {
                if (snapshot.empty) res.json({ message: 'Ok' });
                else res.json({ message: 'El correo ya se encuentra registrado' })
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

}

exports.newClient = newClient;
exports.newBusiness = newBusiness;
exports.verifyEmailExist = verifyEmailExist;