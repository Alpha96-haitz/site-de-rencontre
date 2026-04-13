import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Platform } from "react-native";

// Ces informations proviennent des fichiers google-services.json et GoogleService-Info.plist fournis
const firebaseConfig = Platform.select({
  ios: {
    apiKey: "AIzaSyDcNkZHOMDiy0GLqOPcDhaxYmDMDz6wOeM",
    authDomain: "haitz-rencontre-cbd92.firebaseapp.com",
    projectId: "haitz-rencontre-cbd92",
    storageBucket: "haitz-rencontre-cbd92.firebasestorage.app",
    messagingSenderId: "983085451227",
    appId: "1:983085451227:ios:da162f5bd4d4cf765c89fe"
  },
  android: {
    apiKey: "AIzaSyDuv59vgt1TGbSssJw6rxwpL-FurGfTdB4",
    authDomain: "haitz-rencontre-cbd92.firebaseapp.com",
    projectId: "haitz-rencontre-cbd92",
    storageBucket: "haitz-rencontre-cbd92.firebasestorage.app",
    messagingSenderId: "983085451227",
    appId: "1:983085451227:android:7fb75bb8b1eadc825c89fe"
  },
  default: {
    apiKey: "AIzaSyDuv59vgt1TGbSssJw6rxwpL-FurGfTdB4",
    authDomain: "haitz-rencontre-cbd92.firebaseapp.com",
    projectId: "haitz-rencontre-cbd92",
    storageBucket: "haitz-rencontre-cbd92.firebasestorage.app",
    messagingSenderId: "983085451227",
    appId: "1:983085451227:android:7fb75bb8b1eadc825c89fe"
  }
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
