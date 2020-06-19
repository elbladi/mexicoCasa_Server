const HttpError = require('../util/http-error');
const instance = require('../firebase');
const { fileUploader } = require('../middleware/fileUploader');
const { ROLE } = require('../util/permissions/roles');
require('firebase/firestore');


const gettingProducts = async (idBusiness) => {
    const firebase = instance.getInstance();

    if (idBusiness) {

        const products = await firebase.firestore().collection('products').doc(idBusiness).get()
            .then(doc => {
                if (doc.exists) {
                    return doc.data().products;
                } else {
                    return null;
                }
            }).catch(error => {
                throw new HttpError('Algo salio mal, intente mas tarde', 503);
            });
        return products;
    }
    return null;
}

const updateBusinessProduct = async (idBusiness, products) => {
    const firebase = instance.getInstance();

    const isProductUpdate = await firebase.firestore().collection('products').doc(idBusiness).update(products)
        .then(doc => {
            return true;
        })
        .catch(error => {
            throw new HttpError('Algo salio mal, intente mas tarde', 503);
        });

    return isProductUpdate ? isProductUpdate : false;

}

const addProductNewBusiness = async (idBusiness, products) => {
    const firebase = instance.getInstance();

    if (!idBusiness && !products) {
        throw new HttpError('Algo salio mal, intente mas tarde', 503);
    }
    const isProductAdded = await firebase.firestore().collection('products').doc(idBusiness).set(products)
        .then(doc => {
            return true;

        })
        .catch(error => {
            throw new HttpError('Algo salio mal, intente mas tarde', 503);
        });

    return isProductAdded ? isProductAdded : false;
}

const addProduct = async (req, res, next) => {
    try {
        let body = {}
        Object.keys(req.body).forEach((value, _) => {
            body[value] = JSON.parse(req.body[value]);
        })

        const idBusiness = body.idBusiness;
        const product = {
            name: body.name,
            description: body.desc,
            price: parseFloat(body.price),
            url: '',
        }

        if (idBusiness && product) {

            const fileUrl = await fileUploader(ROLE.BUSINESS, { id: idBusiness, childFolder: 'products' }, req.files);

            if (!fileUrl) {
                return next(new HttpError('Algo salio mal, intente mas tarde', 503));
            }

            product.url = fileUrl;

            const products = await gettingProducts(idBusiness);

            if (products) {

                const productFound = products.find(element => element.name === product.name);

                if (!productFound) {
                    products.unshift(product);

                    const isProductUpdated = updateBusinessProduct(idBusiness, {
                        products: products
                    });

                    if (isProductUpdated) {
                        res.status(201).json({
                            message: 'Se agrego el producto exitosamente',
                        });
                    }

                } else {
                    res.status(406).json({
                        message: "Ya existe un producto con ese nombre"
                    });
                }
            } else {
                const isProductAdded = addProductNewBusiness(idBusiness, {
                    products: [product]
                });

                if (isProductAdded) {
                    res.status(201).json({
                        message: "Se agrego el producto exitosamente",
                    });
                } else {
                    return next(new HttpError('Algo salio mal, intente mas tarde', 503));
                }
            }
        } else {
            res.status(406).json({
                message: "Los campos son requeridos"
            });
        }
    } catch (error) {
        return next(new HttpError('Algo salio mal, intente mas tarde', 503));;
    }

}


const getProducts = async (req, res, next) => {
    const idBusiness = req.params.negId
    try {
        if (idBusiness) {

            const products = await gettingProducts(idBusiness);

            res.status(201).json({
                products: products
            })

        }
    } catch (error) {
        return next(new HttpError('Algo salio mal, intente mas tarde', 503));
    }

}

exports.getProducts = getProducts;
exports.addProduct = addProduct;