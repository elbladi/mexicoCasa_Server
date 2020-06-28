const HttpError = require('../util/http-error');
const instance = require('../firebase');
require('firebase/firestore');
const { v4: uuid } = require('uuid');
const { fileUploader } = require('../middleware/fileUploader');
const { ROLE } = require('../util/permissions/roles');

// const fb = require('firebase/app');
// const x = fb.initializeApp(firebaseConfig);
// x.firestore().collection('orders').doc().get().then

const getFinished = (req, res, next) => {

    const negocioId = req.params.negId;
    const firebase = instance.getInstance();
    let readyOrders = {};
    try {
        firebase.firestore().collection('orders')
            .where('negocioId', '==', negocioId)
            .where('stage', '==', 'readyOrders')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    res.json(
                        {
                            message: 'EMPTY ORDER',
                            readyOrders: {}
                        }
                    )
                } else {
                    snapshot.forEach(doc => {

                        const received = {
                            ...readyOrders,
                            [doc.data().clientId]: { ...doc.data(), orderId: doc.id }
                        }
                        readyOrders = received;
                    });
                    res.json({
                        message: 'SEND ORDERS',
                        readyOrders: readyOrders
                    })
                }
            })
            .catch(err => {
                return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }
}

const getPreparando = (req, res, next) => {

    const negocioId = req.params.negId;
    const firebase = instance.getInstance();
    let prepareOrders = {};

    try {
        firebase.firestore().collection('orders')
            .where('negocioId', '==', negocioId)
            .where('stage', '==', 'prepareOrders')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    res.json({
                        message: 'EMPTY ORDER',
                        prepareOrders: {}
                    })
                } else {
                    snapshot.forEach(doc => {

                        const received = {
                            ...prepareOrders,
                            [doc.data().clientId]: { ...doc.data(), orderId: doc.id }
                        }
                        prepareOrders = received;
                    });
                    res.json({
                        message: 'SEND ORDERS',
                        prepareOrders: prepareOrders
                    })
                }
            })
            .catch(err => {
                return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }
}

const getPedidos = (req, res, next) => {

    const negocioId = req.params.negId;
    const firebase = instance.getInstance();

    let receivedOrders = {};
    try {
        firebase.firestore().collection('orders')
            .where('negocioId', '==', negocioId)
            .where('stage', '==', 'receivedOrders')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    res.json({
                        message: 'EMPTY ORDER',
                        receivedOrders: {}
                    })
                } else {
                    snapshot.forEach(doc => {

                        const received = {
                            ...receivedOrders,
                            [doc.data().clientId]: { ...doc.data(), orderId: doc.id }
                        }
                        receivedOrders = received;
                    });
                    res.json({
                        message: 'SEND ORDERS',
                        receivedOrders: receivedOrders
                    })
                }
            })
            .catch(err => {
                return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
            })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }
}

const updateStage = (req, res, next) => {

    const orderId = req.body.orders;
    const stage = req.body.stage;
    const firebase = instance.getInstance();
    try {
        orderId.forEach(order => {
            firebase.firestore().collection('orders').doc(order).update({
                stage: stage
            })
                .then(_ => { })
                .catch(err => next(new HttpError('Algo salio mal al intentar mover el pedido. Por favor, intentalo de nuevo', 503)))
        });
        res.json({
            message: "ALL ORDERS UPDATED",
        })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503))
    }

}

const getProducts = (id) => {
    return new Promise((resolved, error) => {
        const firebase = instance.getInstance();
        try {
            firebase.firestore().collection('products').doc(id)
                .get()
                .then(doc => {
                    if (!doc.exists) {
                        resolved('No products added');
                    } else {
                        resolved(doc.data());
                    }
                })
                .catch(() => {
                    error();
                })
        } catch (error) {
            throw error;
        }
    })
}

const getNegocioDetails = (req, res, next) => {

    const negocioId = req.params.negId;
    const firebase = instance.getInstance();
    try {
        firebase.firestore().collection('business').doc(negocioId)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
                } else {
                    let negocioDetails = { ...doc.data() };
                    getProducts(negocioId)
                        .then(resp => {
                            if (resp === 'No products added') {
                                res.json({
                                    products: [],
                                    details: negocioDetails
                                })
                            } else {
                                // const negocio = {
                                //     details: negocioDetails,
                                //     ...resp
                                // }
                                res.json({
                                    products: resp.products,
                                    details: negocioDetails
                                })
                            }
                        })
                        .catch(err => {
                            return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
                        })
                }
            })

    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503));
    }

}

const updateBusinessWithPhoto = async (req, res, next) => {

    let body = {}
    Object.keys(req.body).forEach((value, _) => {
        body[value] = JSON.parse(req.body[value]);
    })

    const idBusiness = req.params.negId;

    try {
        const fileUrl = await fileUploader(ROLE.BUSINESS, { id: idBusiness, childFolder: 'prueba' }, req.files);

        if (!fileUrl) {
            return next(new HttpError('Algo salio mal, intente mas tarde', 503));
        }

        const firebase = instance.getInstance();
        firebase.firestore().collection('business').doc(idBusiness).set({
            photoBusiness: fileUrl,
            businessDesc: body.businessDesc,
            businessName: body.businessName
        }, { merge: true })

        res.json({ imageUrl: fileUrl });

    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503))
    }

}

const updateBusinessWithoutPhoto = async (req, res, next) => {

    if (req.body.businessDesc === '' || req.body.businessName === '') {
        return next(new HttpError('Entrada invalida. Por favor, revise sus datos', 403))
    }

    const idBusiness = req.params.negId;

    try {
        const firebase = instance.getInstance();
        firebase.firestore().collection('business').doc(idBusiness).set({
            businessDesc: req.body.businessDesc,
            businessName: req.body.businessName
        }, { merge: true })

        res.status(200).send();
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503))
    }
}

const updateBusiness = async (req, res, next) => {
    const idBusiness = req.params.negId;
    if (!idBusiness) return next(new HttpError('ID de negocio invalido', 503))

    const firebase = instance.getInstance();
    try {
        firebase.firestore().collection('business').doc(idBusiness).set({
            ...req.body
        }, { merge: true })

        res.status(200).send()

    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503))
    }


}

exports.getPedidos = getPedidos;
exports.getPreparando = getPreparando;
exports.getFinished = getFinished;
exports.updateStage = updateStage;
exports.getNegocioDetails = getNegocioDetails;
exports.updateBusinessWithPhoto = updateBusinessWithPhoto;
exports.updateBusinessWithoutPhoto = updateBusinessWithoutPhoto;
exports.updateBusiness = updateBusiness;
//exports.nuevaFuncion = nuevaFuncion;