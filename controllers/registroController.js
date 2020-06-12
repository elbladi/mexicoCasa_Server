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

// const newBusiness = async (req, res, next) => {
//     /*
//     * Verify the request contain photoINE
//     */

//     if (!req.files) return next(new HttpError('no llego el file', 500));
//     if (!req.files['photoINE']) return next(new HttpError('Foto de ID requerida', 500));
//     //CAMBIAR ESTE EMAIL
//     const email = req.body.email

//     /*
//     * Verify the user is not registered
//     */

//     let firebase = instance.getInstance();
//     let existe;
//     try {
//         existe = await firebase.firestore().collection('users')
//             .where('email', '==', email)
//             .get()
//             .then(snapshot => {
//                 if (snapshot.empty) return false
//                 else return true;
//             })
//     } catch (error) {
//         return next(new HttpError('Algo salio mal, por favor verificar datos', 500));
//     }

//     if (existe) {
//         return next(new HttpError('Email registrado. Por favor hacer Login', 500));
//     }

//     /**
//      * Create the business in the business collection
//      * Get the created business id 
//      */

//     let newBusiness = {
//         ...req.body,
//         verificado: false,
//     }
//     delete newBusiness['password'];

//     let newUserId;
//     try {
//         newUserId = await firebase.firestore().collection('business').add(newBusiness)
//             .then(resp => {
//                 return resp.id;
//             })
//             .catch(_ => {
//                 next(new HttpError('Creacion de usuario fallo', 500))
//             })
//     } catch (error) {
//         return next(new HttpError('Creacion de usuario fallo', 500));
//     }

//     if (!newUserId) {
//         return next(new HttpError('Creacion de usuario fallo', 500));
//     }

//     /**
//      * Upload the images or image using the created business id
//      * if upload fails: delete the business id in business collection
//      */

//     let photoINE;
//     try {
//         photoINE = await fileUploader(ROLE.BUSINESS, { id: newUserId, childFolder: 'register' }, { file: req.files['photoINE'] })
//             .then(fileUrl => {
//                 if (!fileUrl) {
//                     return false
//                 }
//                 return fileUrl
//             })
//             .catch(err => {
//                 console.log(err);
//                 return false
//             })
//     } catch (error) {
//         return next(new HttpError('Algo salio mal, intente mas tarde', 503));
//     }

//     if (!photoINE) {
//         deleteBusinessFromCollection(newUserId)
//             .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//         return next(new HttpError('Algo salio mal, intente mas tarde', 503))
//     }

//     let photoBusiness
//     if (req.files['photoBusiness']) {
//         try {
//             photoBusiness = await fileUploader(ROLE.BUSINESS, { id: newUserId, childFolder: 'register' }, { file: req.files['photoBusiness'] })
//                 .then(fileUrl => {
//                     if (!fileUrl) {
//                         return false
//                     }
//                     return fileUrl
//                 })
//                 .catch(err => {
//                     console.log(err);
//                     return false
//                 })
//         } catch (error) {
//             return next(new HttpError('Algo salio mal, intente mas tarde', 503));
//         }
//     } else {
//         photoBusiness = 'empty'
//     }

//     if (!photoBusiness) {
//         deleteBusinessFromCollection(newUserId)
//             .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//         return next(new HttpError('Algo salio mal, intente mas tarde', 503))
//     }

//     /**
//      * Update the photos url of created business in business collection 
//      */
//     let updated;
//     try {
//         updated = await firebase.firestore().collection('business').doc(newUserId)
//             .update({
//                 photoINE: photoINE,
//                 photoBusiness: photoBusiness
//             })
//             .then(_ => true)
//             .catch(_ => false);
//     } catch (error) {
//         console.log(error);
//         deleteBusinessFromCollection(newUserId)
//             .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//         return next(new HttpError('Algo salio mal, intente mas tarde', 503))
//     }

//     if (!updated) {
//         deleteBusinessFromCollection(newUserId)
//             .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//         return next(new HttpError('Algo salio mal, intente mas tarde', 503))
//     }

//     /**
//      * Hash the password 
//      */

//     let hashedPassword;
//     try {
//         hashedPassword = await bcrypt.hash('req.body.password', 12)
//             .then(hash => {
//                 return hash;
//             })
//             .catch(err => '')
//     } catch (error) {
//         return next(new HttpError('Creacion de usuario fallo', 500));
//     }

//     if (!hashedPassword) {
//         deleteBusinessFromCollection(newUserId)
//             .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//         return next(new HttpError('Creacion de usuario fallo', 500));
//     }

//     /**
//      * Upload the user to users collection
//      * if upload fails: delete the image(s) and delete the business id in business collection
//      */

//     const user = {
//         email: email,
//         password: hashedPassword,
//         isCustomer: false
//     }

//     let newUser;
//     try {
//         newUser = await firebase.firestore().collection('users').doc(newUserId).set(user)
//             .then(_ => {
//                 return true;
//             })
//             .catch(_ => {
//                 deleteBusinessFromCollection(newUserId)
//                     .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//                     .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             })

//     } catch (_) {
//         deleteBusinessFromCollection(newUserId)
//             .then(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//             .catch(_ => next(new HttpError('Creacion de usuario fallo', 500)))
//     }

//     if (!newUser) return next(new HttpError('Creacion de usuario fallo', 500));

//     /**
//      * Create the token and send it 
//      */

//     const token = jwt.sign(
//         {
//             email: user.email,
//             id: newUserId
//         },
//         process.env.JWT_KEY,
//         { expiresIn: '1h' }
//     );

//     /**
//      * Set newBusiness 
//      */
//     newBusiness = {
//         ...newBusiness,
//         photoINE: photoINE,
//         photoBusiness: photoBusiness
//     }

//     res.json({
//         message: 'CREATION SUCCESS',
//         business: newBusiness,
//         token: token,
//         isCustomer: false,
//         id: newUserId
//     })

// };


const newBusiness = async (req, res, next) => {

    console.log(req.body);
    res.json({message: 'Ok'});
}

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