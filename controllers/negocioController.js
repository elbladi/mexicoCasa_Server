const HttpError = require('../util/http-error');
const instance = require('../firebase');
require('firebase/firestore');
const { v4: uuid } = require('uuid');

// const fb = require('firebase/app');
// const x = fb.initializeApp(firebaseConfig);
// x.firestore().collection('orders').doc().update({
//     stage: "prepareOrders"
// })
// .then(x => x).t

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
                console.log('Error getting documents', err);
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
                console.log('Error getting documents', err);
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
                console.log('Error getting documents', err);
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
            message: "ALL ORDERS UPDATED"
        })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503))
    }

}


exports.getPedidos = getPedidos;
exports.getPreparando = getPreparando;
exports.getFinished = getFinished;
exports.updateStage = updateStage;
exports.nuevaFuncion = nuevaFuncion;