
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp,
  onSnapshot,
  QueryConstraint,
  DocumentData
} from "firebase/firestore";
import { db } from "./client";

// General types
export type FirestoreTimestamp = Timestamp;

// Create a new document with auto-generated ID
export const createDocument = async (
  collectionName: string, 
  data: Record<string, any>
) => {
  const collectionRef = collection(db, collectionName);
  const docRef = await addDoc(collectionRef, {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return docRef.id;
};

// Create or update a document with specific ID
export const setDocument = async (
  collectionName: string,
  documentId: string,
  data: Record<string, any>,
  merge = true
) => {
  const docRef = doc(db, collectionName, documentId);
  await setDoc(
    docRef, 
    {
      ...data,
      updated_at: serverTimestamp()
    }, 
    { merge }
  );
  return documentId;
};

// Get a document by ID
export const getDocument = async (
  collectionName: string,
  documentId: string
) => {
  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  
  return null;
};

// Update a document
export const updateDocument = async (
  collectionName: string,
  documentId: string,
  data: Record<string, any>
) => {
  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp()
  });
  return documentId;
};

// Delete a document
export const deleteDocument = async (
  collectionName: string,
  documentId: string
) => {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
  return documentId;
};

// Query documents
export const queryDocuments = async (
  collectionName: string,
  conditions: Array<{
    field: string;
    operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "array-contains-any" | "not-in";
    value: any;
  }>,
  orderByField?: string,
  orderDirection?: "asc" | "desc",
  limitCount?: number
) => {
  const collectionRef = collection(db, collectionName);
  
  // Build query with conditions
  const queryConstraints: QueryConstraint[] = [];
  
  // Add conditions
  if (conditions.length > 0) {
    conditions.forEach(({ field, operator, value }) => {
      queryConstraints.push(where(field, operator, value));
    });
  }
  
  // Add ordering if specified
  if (orderByField) {
    queryConstraints.push(orderBy(orderByField, orderDirection || "asc"));
  }
  
  // Add limit if specified
  if (limitCount) {
    queryConstraints.push(limit(limitCount));
  }
  
  const q = query(collectionRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Subscribe to document changes
export const subscribeToDocument = (
  collectionName: string,
  documentId: string,
  onNext: (data: Record<string, any> | null) => void
) => {
  const docRef = doc(db, collectionName, documentId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      onNext({ id: doc.id, ...doc.data() });
    } else {
      onNext(null);
    }
  });
};

// Subscribe to query changes
export const subscribeToQuery = (
  collectionName: string,
  conditions: Array<{
    field: string;
    operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "array-contains-any" | "not-in";
    value: any;
  }>,
  onNext: (data: Array<Record<string, any>>) => void,
  orderByField?: string,
  orderDirection?: "asc" | "desc",
  limitCount?: number
) => {
  const collectionRef = collection(db, collectionName);
  
  // Build query with conditions
  const queryConstraints: QueryConstraint[] = [];
  
  // Add conditions
  if (conditions.length > 0) {
    conditions.forEach(({ field, operator, value }) => {
      queryConstraints.push(where(field, operator, value));
    });
  }
  
  // Add ordering if specified
  if (orderByField) {
    queryConstraints.push(orderBy(orderByField, orderDirection || "asc"));
  }
  
  // Add limit if specified
  if (limitCount) {
    queryConstraints.push(limit(limitCount));
  }
  
  const q = query(collectionRef, ...queryConstraints);
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onNext(documents);
  });
};
