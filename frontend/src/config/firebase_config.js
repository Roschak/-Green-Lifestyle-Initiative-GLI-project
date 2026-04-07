// config/firebase_config.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyCDjAOxOlvbcrqB3n--u380WmWK5GA1FGI",
  authDomain:        "gli-project-web.firebaseapp.com",
  projectId:         "gli-project-web",
  storageBucket:     "gli-project-web.firebasestorage.app",
  messagingSenderId: "359526065589",
  appId:             "1:359526065589:web:496796ed75f979c07725fc",
  measurementId:     "G-LYBCC8QMS1"
}

const app = initializeApp(firebaseConfig)

export const auth           = getAuth(app)
export const db             = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()