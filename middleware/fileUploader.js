
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
    const filePath = `./uploads/images/${file.name}`;

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
                fileNameUncoded = encodeURIComponent(data[0].name);
                const url = "https://firebasestorage.googleapis.com/v0/b/"
                    + bucket + "/o/"
                    + fileNameUncoded
                    + "?alt=media&token=" + uuidToken;
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

module.exports = {
    fileUploader,
}