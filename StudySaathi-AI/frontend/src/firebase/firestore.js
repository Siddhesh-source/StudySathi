import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';

export const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getDocuments = async (collectionName, constraints = []) => {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
};

export const deleteDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

export const subscribeToCollection = (collectionName, callback, constraints = []) => {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
};

export { where, orderBy, limit };
