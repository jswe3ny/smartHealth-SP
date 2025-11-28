import {
  addDoc,
  collection,
  doc,
  FirebaseFirestoreTypes,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  where,
  writeBatch,
} from "@react-native-firebase/firestore";
import { db } from "./firebase";

export type DocWithId<T> = { id: string; data: T };

const docRef = (path: string) => doc(db, path);
const collectionRef = (path: string) => collection(db, path);

export const genId = () => doc(collection(db, "_")).id;

// --- Supporting interfaces for creating dynamic queries ---
export interface WhereClause {
  field: string;
  op: FirebaseFirestoreTypes.WhereFilterOp;
  value: unknown;
}

export interface OrderByClause {
  field: string;
  dir?: "asc" | "desc";
}

export interface QueryOptions {
  where?: WhereClause[];
  orderBy?: OrderByClause[];
  limit?: number;
  startAfter?: unknown; // doc snapshot or field value such as timestamp
}
// For REALTIME Udates
export const listenCollection = <T>(
  path: string,
  options: QueryOptions,
  onNext: (val: DocWithId<T>[]) => void,
  onError?: (err: unknown) => void
) => {
  const constraints: any[] = [];

  // query option builder
  if (options.where) {
    options.where.forEach((w) =>
      constraints.push(where(w.field, w.op, w.value))
    );
  }
  if (options.orderBy) {
    options.orderBy.forEach((o) => constraints.push(orderBy(o.field, o.dir)));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }
  if (options.startAfter) {
    constraints.push(startAfter(options.startAfter));
  }

  const finalQuery = query(collectionRef(path), ...constraints);

  // listens to the query for new docs.
  const unsubscribe = onSnapshot(
    finalQuery,
    (querySnapshot) => {
      const documents = querySnapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          data: doc.data() as T,
        })
      );
      onNext(documents);
    },
    (error) => {
      console.error(`Error listening to collection at path: ${path}`, error);
      onError?.(error);
    }
  );

  return unsubscribe;
};

export const listenDocWithId = <T>(
  path: string,
  onNext: (val: DocWithId<T> | null) => void,
  onError?: (err: unknown) => void
) => {
  return onSnapshot(
    docRef(path),
    (snap) =>
      onNext(snap.exists() ? { id: snap.id, data: snap.data() as T } : null),
    (err) => onError?.(err)
  );
};

// FoR Reglar queries
export const getCollection = async <T>(
  path: string,
  options: QueryOptions
): Promise<DocWithId<T>[]> => {
  const getCollectionRef = collectionRef(path);
  const constraints: any[] = []; // Using any[] to handle the library's type inconsistencies

  // This logic is identical to your listenCollection, which is good!
  if (options.where) {
    options.where.forEach((w) =>
      constraints.push(where(w.field, w.op, w.value))
    );
  }
  if (options.orderBy) {
    options.orderBy.forEach((o) => constraints.push(orderBy(o.field, o.dir)));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }
  // ...and so on for other options...

  const q = query(getCollectionRef, ...constraints);

  // The key difference: use `getDocs` for a one-time fetch.
  const snapshot = await getDocs(q);

  // Map the results into your standard format.
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    data: doc.data() as T,
  }));
};

export const getDocWithId = async <T>(
  path: string
): Promise<DocWithId<T> | null> => {
  const snapshot = await getDoc(docRef(path));

  if (!snapshot.exists()) {
    // It's good practice to return null if the document isn't found.
    return null;
  }

  return {
    id: snapshot.id,
    data: snapshot.data() as T,
  };
};
// export const getDocWithId = async <T>(path:sting): Promise<

export const upsert = <T extends object>(path: string, data: Partial<T>) => {
  return setDoc(docRef(path), data as any, { merge: true });
};

export const removeObjectfFromArray = async (
  path: string,
  arrayName: string,
  objectIdFieldName: string,
  objectId: string
) => {
  try {
    await runTransaction(db, async (removeObjectTransaction) => {
      const docSnapshot = await removeObjectTransaction.get(docRef(path));

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
      removeObjectTransaction.update(docRef(path), {
        [arrayName]: newArray,
      });
    });
  } catch (error) {
    console.log("Error: Object Not RemovedL: ", error);
    throw error;
  }
};

export const deleteDocAndSubcollection = async (
  collectionPath: string,
  docId: string,
  subcollectionName: string
) => {
  const subcollectionPath = `${collectionPath}/${docId}/${subcollectionName}`;
  const subcollectionRef = collection(db, subcollectionPath);

  const snapshot = await getDocs(subcollectionRef);

  const batch = writeBatch(db);

  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });

  const parentDocRef = doc(db, collectionPath, docId);
  batch.delete(parentDocRef);

  await batch.commit();
};

export const add = <T extends object>(path: string, data: T) => {
  return addDoc(collection(db, path), data as any);
};
