import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
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

//Todo add delete helper
export const removeObjectfFromArray = async (
  path: string,
  arrayName: string,
  objectIdFieldName: string,
  objectId: string
) => {
  try {
    await runTransaction(db, async (removeObjectTransaction) => {
      const docSnapshot = await removeObjectTransaction.get(dbRef(path));

      if (!docSnapshot) {
        throw "Document Not Found";
      }

      const currentArray = docSnapshot.data()?.[arrayName];

      // Create New array without passed object
      const newArray = currentArray.filter(
        // creates new array by filtering each object in array and ommitting the one with the passed id
        (item: { [objectKey: string]: unknown }) =>
          item && item[objectIdFieldName] !== objectId
      );
      removeObjectTransaction.update(dbRef(path), {
        [arrayName]: newArray,
      });
    });
  } catch (error) {
    console.log("Error: Object Not RemovedL: ", error);
    throw error;
  }
};
