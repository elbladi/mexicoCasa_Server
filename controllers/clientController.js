//const jwt = require('jsonwebtoken');
const HttpError = require('../util/http-error');
const instance = require('../firebase');
const { distancia, getDayOfWeek } = require('../util/formulaDistancia/distancia')
require('firebase/firestore');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');


const getBusiness = (req, res, next) => {
    const idBusiness = req.params.idBusiness
    if (!idBusiness) {
        return next(new HttpError("Entrada invalida", 400));
    }
    try {
        const firebase = instance.getInstance();
        firebase.firestore().collection('business').doc(idBusiness).
            get()
            .then(doc => {
                if (!doc.exists) {
                    return next(new HttpError("Negocio no encontrado", 404));
                } else {
                    res.json({
                        ...doc.data()
                    })
                }
            })

    } catch (error) {
        new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503);

    };

}

const getBusinesses = (req, res, next) => {
    const lat = req.params.lat
    const lng = req.params.lng
    const date = new Date()
    const currentDay = (getDayOfWeek(date))

    let time = date.getHours() + ":" + date.getMinutes();

    let businesses = [];

    try {
        const firebase = instance.getInstance();
        firebase.firestore().collection('business').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const verificar = {
                        verificado: doc.data().verificado
                    }
                    if (verificar.verificado) {
                        doc.data().schedule.map(schedule => {
                            if (schedule.dia === currentDay) {
                                if (schedule.abierto) {
                                    if ((time <= schedule.horaCerrado)) {
                                        const dist = distancia(lat, lng, doc.data().geolocation.lat, doc.data().geolocation.lng)
                                        if (dist <= 15000) {
                                            const business = {
                                                id: [doc.id],
                                                [doc.id]: {
                                                    ...doc.data(),
                                                    distance: dist,
                                                    schedule: {
                                                        horaAbierto: schedule.horaAbierto,
                                                        horaCerrado: schedule.horaCerrado
                                                    }
                                                },
                                            }
                                            businesses.push(business)
                                        }
                                    }
                                }

                            }
                        })
                    }

                });

                res.json({
                    businesses: businesses
                })
            }).catch(error => {
                console.log(error)
                new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503);
            });
    } catch (error) {
        console.log(error)
        new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503);

    };
}

const checkout = async (req, res, next) => {
    // Guardar en orders de la BD
    let firebase = instance.getInstance();
    let order;
    try {
        order = await firebase.firestore().collection('orders').doc().set(req.body)
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

const getLoggedClient = async (req, res, next) => {
    const clientId = req.params.clientId
    if (!clientId) return next(new HttpError("Cliente no encontrado", 404));
    let firebase = instance.getInstance();
    let client;
    try {
        client = await firebase.firestore().collection('clients').doc(clientId)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
                } else {
                    res.json({
                        client: { ...doc.data() }
                    })
                }
            })


    } catch (error) {
        console.log(error);
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

}

const updateClient = (req, res, next) => {
    const clientId = req.params.clientId
    if (!clientId) return next(new HttpError("Cliente no encontrado", 404));
    let firebase = instance.getInstance();

    try {
        firebase.firestore().collection('clients').doc(clientId).set({
            ...req.body
        }, { merge: true })
            .then(_ => res.status(200).send())
            .catch(_ => next(new HttpError("No se pudo actualizar el Cliente", 503)))
    } catch (error) {
        return next(new HttpError("Algo salio mal. Por favor, intentalo de nuevo", 404));
    }
}

const updatePassword = async (req, res, next) => {
    const clientId = req.params.clientId
    if (!clientId) return next(new HttpError("Cliente no encontrado", 404));
    let firebase = instance.getInstance();

    /**
     * Verify the user exist
     * if it does, get the hashed password
     */
    let userExist;
    try {
        userExist = await firebase.firestore().collection('users').doc(clientId)
            .get()
            .then(doc => {
                if (!doc.exists) return false;
                return doc.data();
            })
    } catch (error) {
        console.log(error)
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

    if (!userExist) return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));

    /**
     * compare password provided by user and the one stored
     */
    let correctPassword;
    try {
        correctPassword = await bcrypt.compare(req.body.current, userExist.password)
            .then(isEqual => {
                if (isEqual) return true;
                else return false;
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

    if (!correctPassword) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

    /**
     * Hash the provided password
     */

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(req.body.newP, 12)
            .then(hash => {
                return hash;
            })
            .catch(err => '')
    } catch (error) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    if (!hashedPassword) {
        return next(new HttpError('Creacion de usuario fallo', 500));
    }

    /**
     * update password in users collection
     */

    try {
        firebase.firestore().collection('users').doc(clientId).set({
            password: hashedPassword
        }, { merge: true })
            .then(_ => res.status(200).send())
            .catch(_ => next(new HttpError("No se pudo actualizar el Cliente", 503)))
    } catch (error) {
        return next(new HttpError("Algo salio mal. Por favor, intentalo de nuevo", 404));
    }
    
}

const getClientNamePhone = async (req, res, next) => {
    const clientId = req.params.clientId
    if (!clientId) return next(new HttpError("Cliente no encontrado", 404));
    let firebase = instance.getInstance();
    let client;
    try {
        client = await firebase.firestore().collection('clients').doc(clientId)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
                } else {
                    res.json({
                        client: { 
                            name: doc.data().name,
                            apellidos: doc.data().apellidos,
                            telefono: doc.data().telefono,
                         }
                    })
                }
            })


    } catch (error) {
        console.log(error);
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

}


exports.getBusinesses = getBusinesses;
exports.getBusiness = getBusiness;
exports.checkout = checkout;
exports.getLoggedClient = getLoggedClient;
exports.updateClient = updateClient;
exports.updatePassword = updatePassword;
exports.getClientNamePhone = getClientNamePhone;
