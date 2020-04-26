const fs = require('fs');
const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const { validationResult } = require('express-validator');

const instance = require('../firebase');
require('firebase/firestore');
require('firebase/storage');

// const client = {
//     id: 'id',
//     name: 'Pancho',
//     apellidos: 'Gonzalez Salgado',
//     email: 'test@test.com',
//     password: 'laPassword',
//     telefono: 8442736598,
//     direccion: 'calle valencia #345 col. Zaragoza',
//     Referencia: '',
//     fotoINE: 'url de la foto',
//     pedidoActual: [
//         {
//             negocio: 'nombre del negocio',
//             name: 'Amborguesa',
//             amount: 1,
//             costo: 43,
//             fecha: 'timestamp o fecha'
//         }
//     ],
//     verificado: false
// }

const newClient = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(
            new HttpError('Error, Por favor revisa tus datos de entrada', 422)
        );
    }

    console.log(req.body);

    try {
        let firebase = instance.getInstance();

        const newUser = {
            ...req.body,
            verificado: false
        }

        await firebase.firestore().collection('clients').doc(newUser.id).set(newUser)
            .then(_ => { })
            .catch(error => next(new HttpError(error.message, 500)))

    } catch (error) {
        return next(new HttpError(error.message, 500));
    }

    res.json({ message: 'CREATION SUCCESS' });
};
const newBusiness = (req, res, next) => {

};

exports.newClient = newClient;
exports.newBusiness = newBusiness;