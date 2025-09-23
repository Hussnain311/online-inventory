import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Optional, only for production

const firebaseConfig = {
  apiKey: "AIzaSyB7jMn69wOGiwOAog_1W5xy29lrgfRUgCQ",
  authDomain: "web-inventory-44b06.firebaseapp.com",
  projectId: "web-inventory-44b06",
  storageBucket: "web-inventory-44b06.appspot.com",
  messagingSenderId: "548727376053",
  appId: "1:548727376053:web:e937835b9a6787678616fc",
  measurementId: "G-9C5VD27T49"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to keep users logged in
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// const analytics = getAnalytics(app); // Optional

export { app, auth, db }; 