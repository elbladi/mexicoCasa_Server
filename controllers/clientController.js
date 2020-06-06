//const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const instance = require('../firebase');
require('firebase/firestore');
const { v4: uuid } = require('uuid');

// const fb = require('firebase/app');
// const x = fb.initializeApp(firebaseConfig);

// x.firestore().collection('orders').doc(orderId).set()
const getBusinesses = (req, res, next) => {

    let businesses = {};
    try {
        const firebase = instance.getInstance();
        // const userId = req.params.userId;
        firebase.firestore().collection('business').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const business = {
                        [doc.id]: { ...doc.data() }
                    }
                    businesses = business
                });
                res.json({
                    message: 'We have the businesses',
                    businesses: businesses
                })
            }).catch(error => {
                new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503);
            });

    } catch (error) {
        new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503);

    };
}

const newClient = (req, res, next) => {

};

const checkout = async (req, res, next) => {
    // Guardar en orders de la BD
    let firebase = instance.getInstance();
    let order;
    try {
        const orderId = uuid();
        console.log(req.body);
        order = await firebase.firestore().collection('orders').doc(orderId).set(req.body)
            .then(_ => { })
            .catch(error => next(new HttpError(error.message, 503)))
    } catch (error) {
        order = true;
        return next(new HttpError(error.message, 503));
    }

    if (order) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 500));
    }

    //Si se guardo bien, avisar al negocio que se creo una nueva orden.

    res.json({
        message: "Order received by Business"
    })

}
exports.getBusinesses = getBusinesses;
exports.newClient = newClient;
exports.checkout = checkout;