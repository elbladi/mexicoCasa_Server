const HttpError = require('../util/http-error');
const instance = require('../firebase');
const { fileUploader } = require('../middleware/fileUploader');
const { ROLE } = require('../util/permissions/roles');
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
    const firebase = instance.getInstance();
    return new Promise((resolver, reject) => {

        if (!idBusiness && !products) {
            reject(new HttpError('Algo salio mal, intente mas tarde', 503));
        }
        firebase.firestore().collection('products').doc(idBusiness).set(products)
            .then(doc => {
                resolver("Se agrego el producto exitosamente");

            })
            .catch(error => {
                console.log(error);
                reject(new HttpError('Algo salio mal, intente mas tarde', 503));
            });
    });
}

const addProduct = (req, res, next) => {
    const idBusiness = req.body.idBusiness;
    const product = {
        name: req.body.name,
        description: req.body.desc,
        price: parseFloat(req.body.price),
        url: '',
    }
    if (idBusiness && product) {
        fileUploader(ROLE.BUSINESS, { id: idBusiness, childFolder: 'products' }, req.files)
            .then(fileUrl => {
                if (!fileUrl) {
                    return next(new HttpError('Algo salio mal, intente mas tarde', 503));
                }

                product.url = fileUrl;

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
                                    console.log("error")
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
                                console.log(error);
                                return next(error);
                            });
                        }
                    }).catch(error => {
                        console.log(error)
                        return next(error);
                    });
            })
            .catch(error => {
                console.log(error)
                return next(error);

            });
    } else {
        res.status(406).json({
            message: "Los campos son requeridos"
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