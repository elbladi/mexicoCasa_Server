const instance = require('../firebase');
require('firebase/firestore');


const getFinished = (req, res, next) => {

    const idBusiness = req.params.negId;
    const firebase = instance.getInstance();
    let readyOrders = {};
    try {
        firebase.firestore().collection('orders')
            .where('idBusiness', '==', idBusiness)
            .where('stage', '==', 'readyOrders')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    res.status(204).json(
                        {
                            readyOrders: {}
                        }
                    )
                } else {
                    snapshot.forEach(doc => {

                        const received = {
                            [doc.id]: { ...doc.data(), orderId: doc.id },
                            ...readyOrders
                        }
                        readyOrders = received;
                    });
                    res.status(201).json({
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

    const idBusiness = req.params.negId;
    const firebase = instance.getInstance();
    let prepareOrders = {};

    try {
        firebase.firestore().collection('orders')
            .where('idBusiness', '==', idBusiness)
            .where('stage', '==', 'prepareOrders')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    res.status(204).json({
                        prepareOrders: {}
                    })
                } else {
                    snapshot.forEach(doc => {

                        const received = {
                            [doc.id]: { ...doc.data(), orderId: doc.id },
                            ...prepareOrders
                        }
                        prepareOrders = received;
                    });
                    res.status(201).json({
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

    const idBusiness = req.params.negId;
    const firebase = instance.getInstance();

    let receivedOrders = {};
    try {
        firebase.firestore().collection('orders')
            .where('idBusiness', '==', idBusiness)
            .where('stage', '==', 'receivedOrders')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    res.status(204).json({
                        receivedOrders: {}
                    })
                } else {
                    snapshot.forEach(doc => {

                        const received = {
                            [doc.id]: { ...doc.data(), orderId: doc.id },
                            ...receivedOrders
                        }
                        receivedOrders = received;
                    });
                    res.status(201).json({
                        receivedOrders: receivedOrders,
                    });


                }
            })
            .catch(err => {
                console.log(err)
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
        res.status(201).json({
            message: "Las ordenes estan en preparación",
        })
    } catch (error) {
        return next(new HttpError('Algo salio mal. Por favor, intentalo de nuevo', 503))
    }

}

module.exports = {
    getPedidos,
    getPreparando,
    getFinished,
    updateStage,
}