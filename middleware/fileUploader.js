
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


const fileUploader = (role, destination, files) => {
    return new Promise((resolver, reject) => {
        if (files === null) {
            reject(new HttpError('No hay un archivo a subir', 406));
        }
        const child = role ? 'clients' : 'business';
        const id = destination.id;
        const childFolder = destination.childFolder;
        const uuidToken = uuid();
        const file = files.file;
        const destination = `${child}/${id}/${childFolder}/${file.name}`;
        const filePath = `./uploads/images/${file.name}`;

        file.mv(filePath)
            .then(() => {
                const firebaseBucket = firebase.storage().bucket(bucket);
                firebaseBucket.upload(filePath, {
                    resumable: true,
                    destination: destination,
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
                        resolver(url);
                        fs.unlink(filePath, error => {
                            if (error) {
                                console.log(error)
                                reject(error);
                            }
                        });

                    })
                    .catch(error => {
                        console.log(error)
                        reject(new HttpError('Algo salio mal, intente más tarde', 503));
                    });
            })
            .catch(error => {
                console.log(error)

                reject(new HttpError('Algo salio mal, intente más tarde', 503));
            });
    });

}

module.exports = {
    fileUploader,
}