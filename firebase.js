let firebase;

module.exports = {

    init: firebaseConfig => {
        const fb = require('firebase/app');
        firebase = fb.initializeApp(firebaseConfig);
        return firebase;
    },
    getInstance: () => {
        if (!firebase) {
            throw Error('firebase not initialized');
        }
        return firebase;
    }
}