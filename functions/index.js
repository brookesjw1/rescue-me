const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const { GeoCollectionReference, GeoFirestore, GeoQuery, GeoQuerySnapshot } = require('geofirestore');
// const cors = require('cors')({ origin: true });
const paypal = require('paypal-rest-sdk');
firebase.initializeApp();

paypal.configure({
  mode: 'sandbox',
  client_id: functions.config().paypal.client_id,
  client_secret: functions.config().paypal.client_secret
})

const firestore = firebase.firestore();
const geofirestore = new GeoFirestore(firestore);
const usersCollection = geofirestore.collection("users");
const dogsCollection = geofirestore.collection("dogs");
const paymentsCollection = firestore.collection("payments");

exports.pay = functions.https.onRequest((req, res) => {
  const payReq = JSON.stringify({
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: `https://us-central1-rescuemetest-4a629.cloudfunctions.net/process`,
      cancel_url: `https://us-central1-rescuemetest-4a629.cloudfunctions.net/cancel`
    },
    transactions: [{
      amount: {
        total: Number(req.query.amount),
        currency: 'GBP'
      },
      description: 'This is the payment transaction description', 
    }]
  });
  
  paypal.payment.create(payReq, (error, payment) => {
    const links = {};
    if (error) {
      res.status('500').json({ error })
    } else {
      payment.links.forEach((linkObj) => {
        links[linkObj.rel] = {
          href: linkObj.href,
          method: linkObj.method
        };
      });
      if (links.hasOwnProperty('approval_url')) {
        res.redirect(302, links.approval_url.href);
      } else {
        res.status('500').json({ msg: 'ending point 2'});
      }
    }
  });
});

exports.process = functions.https.onRequest((req, res) => {
  const paymentId = req.query.paymentId;
  const payerId = {
    payer_id: req.query.PayerID
  };
  return paypal.payment.execute(paymentId, payerId, (error, payment) => {
    if (error) {
      return res.status('500').json({ error })
    } else {
      if (payment.state === 'approved') {
        const date = Date.now();
        return paymentsCollection.add({ 'paid': true, 'date': date}).then(() => {
          return res.send('<title>success</title>')
        })
       
      } else {
        return res.status(200).json({ msg: 'not approved'})
      }
    }
  });
});

exports.cancel = functions.https.onRequest((req, res) => {
  res.send('<title>cancel</title>')
});


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
  
    if (hasChildren === 'true') {
      dogs = dogs.filter(dog => dog.goodWithChildren === true);
    }
    if (hasDogs === 'true') {
      dogs = dogs.filter(dog => dog.goodWithOtherDogs === true);
    }
  
    const newDogs = dogs.map(dog => { return {
        name: dog.name,
        dob: dog.dob,
        id: dog.id,
        photos: dog.photos
    }})
  
    return res.set('Access-Control-Allow-Origin', '*').json({ dogs: newDogs });
        
})
