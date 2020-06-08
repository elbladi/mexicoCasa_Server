const HttpError = require('../util/http-error');
const instance = require('../firebase');
require('firebase/firestore');

const gettingProducts = (idBusiness) => {
    const firebase = instance.getInstance();
    return new Promise((resolver, reject) => {

        firebase.firestore().collection('products').doc(idBusiness).get()
            .then(doc => {
                if (doc.exists) {
                    resolver(doc.data().products);
                } else {
                    resolver(null);
                }
            }).catch(error => {
                reject(new HttpError('Algo salio mal, intente mas tarde', 503));
            });

    });
}

const updateBusinessProduct = (idBusiness, products) => {
    const firebase = instance.getInstance();
    return new Promise((resolver, reject) => {

        firebase.firestore().collection('products').doc(idBusiness).update(products)
            .then(doc => {
                resolver("Producto actualizado exitosamente");
            })
            .catch(error => {
                reject(new HttpError('Algo salio mal, intente mas tarde', 503))
            });

    });
}

const addProductNewBusiness = (idBusiness, products) => {
    return new Promise((resolver, reject) => {
        const firebase = instance.getInstance();

        firebase.firestore().collection('products').doc(idBusiness).set(products)
            .then(doc => {
                if (doc.id) {
                    resolver("Se agrego el producto exitosamente");

                } else {
                    reject(new HttpError('Algo salio mal, intente mas tarde', 503));
                }
            })
            .catch(error => {
                reject(new HttpError('Algo salio mal, intente mas tarde', 503));
            });
    });
}

const addProduct = (req, res, next) => {
    const idBusiness = req.body.idBusiness;
    const product = {
        name: req.body.name,
        description: req.body.desc,
        price: req.body.price
    }
    if (idBusiness && product) {
        gettingProducts(idBusiness)
            .then(products => {
                if (products) {
                    const productFound = products.find(element => element.name === product.name);

                    if (!productFound) {
                        products.unshift(product);
                        updateBusinessProduct(idBusiness, {
                            products: products
                        }).then(message => {
                            res.status(201).json({
                                message: 'Se agrego el producto exitosamente',
                            });
                        }).catch(error => {
                            return next(error);
                        });

                    } else {
                        res.status(406).json({
                            message: "Ya existe un producto con ese nombre"
                        });
                    }
                } else {
                    addProductNewBusiness(idBusiness, {
                        products: [product]
                    }).then(message => {
                        res.status(201).json({
                            message: message
                        });
                    }).catch(error => {
                        return next(error);
                    });
                }
            }).catch(error => {
                return next(error);
            });
    }
}


const getProducts = (req, res, next) => {
    const idBusiness = req.params.negId
    if (idBusiness) {
        gettingProducts(idBusiness)
            .then(products => {
                if (products) {
                    res.status(201).json({
                    products: products
                })
            }
        })
    }
}

exports.getProducts = getProducts;
exports.addProduct = addProduct;