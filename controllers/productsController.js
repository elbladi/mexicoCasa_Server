const HttpError = require('../util/http-error');
const instance = require('../firebase');
const { fileUploader, fileExist, deleteFile, getLocationFromUrl } = require('../middleware/fileUploader');
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

const updateProduct = async (req, res, next) => {
    try {

        let body = {};
        Object.keys(req.body).forEach((value, _) => {
            body[value] = JSON.parse(req.body[value]);
        });

        const idBusiness = body.idBusiness;
        const originalNameProduct = body.originalNameProduct;
        const updateInfo = {
            name: body.name,
            desc: body.desc,
            price: parseFloat(body.price),
            url: '',
        }

        if (updateInfo && originalNameProduct && idBusiness) {

            if (!body.file && req.files) {

                const isFile = await fileExist(ROLE.BUSINESS, { id: idBusiness, childFolder: 'products' }, req.files);

                if (!isFile.exist) {

                    const fileUrl = await fileUploader(ROLE.BUSINESS, { id: idBusiness, childFolder: 'products' }, req.files);

                    if (!fileUrl) {
                        return next(new HttpError('Algo salio mal, intente mas tarde', 503));
                    }

                    updateInfo.url = fileUrl;

                } else {
                    return next(new HttpError('La imagen ya es usada en otro producto', 406));
                }

            } else {
                updateInfo.url = body.file;
            }

            const products = await gettingProducts(idBusiness);

            let productIndex;
            let dbImageUrl;
            products.forEach((prod, index) => {

                if (prod.name === originalNameProduct) {
                    productIndex = index;
                    dbImageUrl = prod.url;
                }
            });

            if (dbImageUrl && updateInfo.url && (getLocationFromUrl(dbImageUrl) !== getLocationFromUrl(updateInfo.url))) {
                await deleteFile(dbImageUrl);

            }

            products[productIndex] = updateInfo;

            const isProductUpdated = await updateBusinessProduct(idBusiness, {
                products: products
            });

            if (isProductUpdated) {
                res.status(201).json({
                    message: 'Se actualizó el producto exitosamente',
                    url: updateInfo.url,
                });
            }
        } else {
            res.status(406).json({
                message: "Los campos son requeridos"
            });
        }
    } catch (error) {
        return next(new HttpError('Algo salio mal, intente mas tarde', 503));
    }
}

const deleteProduct = async (req, res, next) => {
    try {
        const idBusiness = req.body.idBusiness;
        const name = req.body.name;
        const url = req.body.url;

        if (idBusiness && name && url) {
            const fileDeleted = await deleteFile(url);

            if (fileDeleted) {
                const firebaseCollection = instance.getInstance().firestore().collection('products');

                const products = await gettingProducts(idBusiness);

                const newProducts = products.filter(prod => prod.name !== name);

                const isProductUpdated = await updateBusinessProduct(idBusiness, {
                    products: newProducts
                });

                if (isProductUpdated) {
                    res.status(201).json({
                        message: 'Se elimino el producto exitosamente',
                    });
                }

            } else {
                return next(new HttpError('Algo salio mal, intente mas tarde', 503));
            }

        } else {
            res.status(406).json({
                message: "Los campos son requeridos"
            });
        }
    } catch (error) {
        return next(new HttpError('Algo salio mal, intente mas tarde', 503));
    };
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
            desc: body.desc,
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

                    const isProductUpdated = await updateBusinessProduct(idBusiness, {
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
        return next(new HttpError('Algo salio mal, intente mas tarde', 503));
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

module.exports = {
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
}