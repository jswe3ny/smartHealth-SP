import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "@react-native-firebase/firestore";
import { db } from "./firebase";

export type DocWithId<T> = { id: string; data: T };

const dbRef = (path: string) => doc(db, path);
export const genId = () => doc(collection(db, "_")).id;

export const listenDocWithId = <T>(
  path: string,
  onNext: (val: DocWithId<T> | null) => void,
  onError?: (err: unknown) => void
) => {
  return onSnapshot(
    dbRef(path),
    (snap) =>
      onNext(snap.exists() ? { id: snap.id, data: snap.data() as T } : null),
    (err) => onError?.(err)
  );
};

export const upsert = <T extends object>(path: string, data: Partial<T>) => {
  return setDoc(dbRef(path), data as any, { merge: true });
};
