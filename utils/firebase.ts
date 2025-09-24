import { getFirestore } from "@react-native-firebase/firestore";

export const db = getFirestore();

// enable emulators during local dev
// const USE_EMULATORS = process.env.EXPO_PUBLIC_USE_EMULATORS === "true";
// if (__DEV__ && USE_EMULATORS) {
//   try { connectFirestoreEmulator(db, "localhost", 8080); } catch {}
// }
