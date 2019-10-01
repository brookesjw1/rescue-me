const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const { GeoCollectionReference, GeoFirestore, GeoQuery, GeoQuerySnapshot } = require('geofirestore');
firebase.initializeApp();

const firestore = firebase.firestore();
const geofirestore = new GeoFirestore(firestore);
const usersCollection = geofirestore.collection("users");
const dogsCollection = geofirestore.collection("dogs");

exports.addUser = functions.https.onRequest(async (req, res) => {
    const { id, firstName, surname, location, radiusPref, employmentStatus, activityLevel, hasChildren, hasDogs, dob, gender, sizePref, avatar } = req.body;

    const addedUser = await usersCollection.doc(id).set({
        firstName, surname, radiusPref, employmentStatus, activityLevel, hasChildren, hasDogs, dob: firebase.firestore.Timestamp.fromDate(new Date(dob)), gender, sizePref, avatar, coordinates: new firebase.firestore.GeoPoint(location[0], location[1])
    })
    res.json({ result: `User ${firstName} ${surname} added`})
});

exports.addDog = functions.https.onRequest(async (req, res) => {
    const { name, dob, breed, size, goodWithChildren, exerciseLevel, description, goodWithOtherDogs, gender, photos, videos, centre_id, location } = req.body;

    const addedDogRef = dogsCollection.doc();

    const addedDog = await addedDogRef.set({
        id: addedDogRef.id, name, dob: firebase.firestore.Timestamp.fromDate(new Date(dob)), breed, size, goodWithChildren, exerciseLevel, description, goodWithOtherDogs, gender, photos, videos, centre_id, coordinates: new firebase.firestore.GeoPoint(location[0], location[1])
    })
    
    res.json({ result: `Dog with ID ${addedDogRef.id} added`})
});

exports.getDogs = functions.https.onRequest(async (req, res) => {
    const radius = Number(req.query.radius);
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const hasChildren = req.query.children;
    const hasDogs = req.query.dogs;
    const activityLevel = req.query.activity;
  
    const query = await dogsCollection
      .near({
        center: new firebase.firestore.GeoPoint(lat || 0, lon || 0),
        radius: radius || 100000000000000
      })
      .get();
  
    let dogs = query.docs.map(doc => doc.data());
    if (activityLevel) {
      dogs = dogs
        .filter(dog => dog.exerciseLevel <= activityLevel)
        .sort((a, b) =>
          Math.abs(activityLevel - a.exerciseLevel) >
          Math.abs(activityLevel - b.exerciseLevel)
            ? 1
            : Math.abs(activityLevel - a.exerciseLevel) <
              Math.abs(activityLevel - b.exerciseLevel)
            ? -1
            : 0
        );
    }
  
    if (hasChildren) {
      dogs = dogs.filter(dog => dog.goodWithChildren === true);
    }
    if (hasDogs) {
      dogs = dogs.filter(dog => dog.goodWithOtherDogs === true);
    }
  
    const newDogs = dogs.map(dog => { return {
        name: dog.name,
        dob: dog.dob,
        id: dog.id,
        photos: dog.photos
    }})
  
    return res.json({ dogs: newDogs });
        
})
