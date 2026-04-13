# HAITZ-RENCONTRE Mobile (Expo)

Application mobile React Native (Expo) connectee au backend existant.

## Fonctionnalites
- Auth: inscription, connexion, Google login, JWT (AsyncStorage)
- Accueil: feed, likes, commentaires
- Profil: consultation, edition, upload photo/couverture
- Matching: decouverte type swipe, like/dislike, match
- Messagerie: temps reel Socket.io, fallback HTTP, typing indicator, unread
- Recherche utilisateurs
- Notifications: likes, matchs, messages

## Variables d'environnement
Tu peux soit modifier `app.json` > `expo.extra`, soit utiliser:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SOCKET_URL`
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Lancer
```bash
cd mobile
npm install
npm run start
```

## Stack
- Expo
- React Navigation
- Axios
- Socket.io-client
- AsyncStorage
- Expo Image Picker
