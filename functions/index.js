const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore;

exports.addUser = functions.https.onRequest(async (req, res) => {
    const { id, firstName, surname, location, radiusPref, employmentStatus, activityLevel, hasChildren, hasDogs, dob, gender, sizePref, avatar } = req.body;

    const writeResult = await db().collection('users').doc(id).set( { firstName, surname, location: new db.GeoPoint(location[0], location[1]), radiusPref, employmentStatus, activityLevel, hasChildren, hasDogs, dob: db.Timestamp.fromDate(new Date(dob)), gender, sizePref, avatar });
    res.json({ result: `User ${firstName} ${surname} added`});
});

exports.addDog = functions.https.onRequest(async (req, res) => {
    const { name, dob, breed, size, goodWithChildren, exerciseLevel, description, goodWithOtherDogs, gender, photos, videos, centre_id, location } = req.body;

    const addedDog = await db().collection('dogs').add({ name, dob: db.Timestamp.fromDate(new Date(dob)), breed, size, goodWithChildren, exerciseLevel, description, goodWithOtherDogs, gender, photos, videos, centre_id, location: new db.GeoPoint(location[0], location[1]) });
    res.json({ result: `Dog with ID ${addedDog.id} added`})
});

exports.getDogs = functions.https.onRequest((req, res) => {
    return db().collection('dogs').get()
    .then((snapshot) => {
        const dogs = snapshot.docs.map(doc => doc.data());
        return res.json({ dogs })
    })
})

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
