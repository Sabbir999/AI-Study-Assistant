// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";

// import { getAuth } from "firebase/auth"; //for Auh by Aniruddah
// import { getDatabase } from "firebase/database"; //for database by Aniruddah



// const firebaseConfig = {
//   apiKey: "AIzaSyDO487WJ7K3drZhvULWtt6Q8buAIPXhbPw",
//   authDomain: "ai-assisted-study-companion.firebaseapp.com",
//   projectId: "ai-assisted-study-companion",
//   databaseURL:"https://ai-assisted-study-companion-default-rtdb.firebaseio.com",
//   storageBucket: "ai-assisted-study-companion.firebasestorage.app",
//   messagingSenderId: "460164372498",
//   appId: "1:460164372498:web:61acebcfb76ef4e086a0cb",
//   measurementId: "G-EZSY57CGTP"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const database = getDatabase(app); //for databse by Aniruddah






import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // Import storage
/*
const firebaseConfig = {
  apiKey: "AIzaSyDO487WJ7K3drZhvULWtt6Q8buAIPXhbPw",
  authDomain: "ai-assisted-study-companion.firebaseapp.com",
  projectId: "ai-assisted-study-companion",
  databaseURL:"https://ai-assisted-study-companion-default-rtdb.firebaseio.com",
  storageBucket: "ai-assisted-study-companion.firebasestorage.app",
  messagingSenderId: "460164372498",
  appId: "1:460164372498:web:61acebcfb76ef4e086a0cb",
  measurementId: "G-EZSY57CGTP"
};
*/
const firebaseConfig = {
  apiKey: "AIzaSyCrthTl7CH2KwRNAWY0mAc3m8JWTXEqmHk",
  authDomain: "educompanion-857da.firebaseapp.com",
  projectId: "educompanion-857da",
  databaseURL: "https://educompanion-857da-default-rtdb.firebaseio.com",
  storageBucket: "educompanion-857da.firebasestorage.app",
  messagingSenderId: "505874338849",
  appId: "1:505874338849:web:d2c99f32efb7cc704e3f60",
  measurementId: "G-4MH5B5P9NH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app); // Initialize storage

export { auth, database, storage }; // Export storage

// This file should contain your Firebase config
// Let me see this file to confirm it's the same project
