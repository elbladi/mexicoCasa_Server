
HttpError = require('../util/http-error');
const firebase = require('firebase-admin');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const servAccount = require('../bucketSecure.json')

const bucket = 'catalogocovid2020.appspot.com';

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const BASEPATH = './uploads/images';

firebase.initializeApp({
    credential: firebase.credential.cert(servAccount),
    storageBucket: bucket,
});


const fileUploader = async (role, destinationFile, files) => {

    if (files === null) {
        const defaulImage = 'https://firebasestorage.googleapis.com/v0/b/catalogocovid2020.appspot.com/o/no_image_food.svg?alt=media&token=ad03d09e-b410-477c-b687-84b40c1aca27';
        return defaulImage;
    }
    const child = role ? 'clients' : 'business';
    const id = destinationFile.id;
    const childFolder = destinationFile.childFolder;
    const uuidToken = uuid();
    const file = files.file;
    const storageDestination = `${child}/${id}/${childFolder}/${file.name}`;
    const filePath = `${BASEPATH}/${file.name}`;

    const isFileMoved = await file.mv(filePath)
        .then(() => {
            return true;
        })
        .catch(error => {
            return false;
        });

    if (isFileMoved) {
        const firebaseBucket = firebase.storage().bucket(bucket);

        const url = await firebaseBucket.upload(filePath, {
            resumable: true,
            destination: storageDestination,
            uploadType: "media",
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: uuidToken,
                }
            }
        })
            .then(data => {
                const url = generateUrl(data[0].name, uuidToken);

                fs.unlink(filePath, error => {
                    if (error) {
                        throw new HttpError('Algo salio mal, intente más tarde', 503);
                    }
                });
                return url;

            })
            .catch(error => {
                throw new HttpError('Algo salio mal, intente más tarde', 503);
            });

        return url ? url : null;

    } else {
        return next(new HttpError('Algo salio mal, intente más tarde', 503));
    }


}

const fileExist = async (role, destinationFile, files) => {

    if (files === null || role === null || !destinationFile) {
        throw new HttpError('file, role or destination are empty', 402);
    }
    const child = role ? 'clients' : 'business';
    const id = destinationFile.id;
    const childFolder = destinationFile.childFolder;
    const file = files.file;
    const storageDestination = `${child}/${id}/${childFolder}/${file.name}`;

    const firebaseBucket = firebase.storage().bucket(bucket);

    const urlFile = await firebaseBucket.file(storageDestination).get()
        .then(data => {
            if (data) {
                const uuidToken = uuid();
                const url = generateUrl(data[0].name, uuidToken);
                return {
                    exist: true,
                    url: url,
                }

            } else {
                return {
                    exist: false
                }
            }

        }).catch(error => {
            return {
                exist: false
            }
        });

    return urlFile;

}

const deleteFile = async (url) => {

    const firebaseBucket = firebase.storage().bucket(bucket);

    let nameFile = url.substr(url.indexOf('/o/') + 3);
    nameFile = nameFile.substr(0, nameFile.indexOf('?'))
    nameFile = nameFile.replace(/%20/g, ' ');
    nameFile = nameFile.replace(/%2F/g, '/');

    const isDeleted = await firebaseBucket.file(nameFile).delete()
        .then(file => {
            if (file) {
                return true;
            } else {
                return false;
            }

        }).catch(error => {
            return false;
        });

    return isDeleted;
}

const generateUrl = (dataName, uuidToken) => {

    const fileNameUncoded = encodeURIComponent(dataName);
    const url = "https://firebasestorage.googleapis.com/v0/b/"
        + bucket + "/o/"
        + fileNameUncoded
        + "?alt=media&token=" + uuidToken;

    return url;
}

const getLocationFromUrl = (url) => {
    let nameFile = url.substr(url.indexOf('%2F') + 3, (url.indexOf('?')) - (url.indexOf('%2F') + 3));
    nameFile = nameFile.replace(/%20/g, ' ');
    nameFile = nameFile.replace(/%2F/g, '/');

    return nameFile;
}

module.exports = {
    fileUploader,
    fileExist,
    deleteFile,
    getLocationFromUrl,
}