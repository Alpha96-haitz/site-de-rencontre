import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
const hostUri = Constants.expoConfig?.hostUri || '';
const host = hostUri?.split(':')?.[0] || '';
const localApiFromExpo = host ? `http://${host}:5000/api` : '';
const localSocketFromExpo = host ? `http://${host}:5000` : '';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  localApiFromExpo ||
  extra.apiUrl ||
  'https://site-de-rencontre-backend.onrender.com/api';

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  localSocketFromExpo ||
  extra.socketUrl ||
  'https://site-de-rencontre-backend.onrender.com';

export const GOOGLE_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleWebClientId || '983085451227-rug9j32g5bagcfnqvpq8olpcqvl037gs.apps.googleusercontent.com',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId || '983085451227-rug9j32g5bagcfnqvpq8olpcqvl037gs.apps.googleusercontent.com',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleAndroidClientId || '983085451227-7fb75bb8b1eadc825c89fe.apps.googleusercontent.com',
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || extra.googleExpoClientId || '983085451227-rug9j32g5bagcfnqvpq8olpcqvl037gs.apps.googleusercontent.com'
};
