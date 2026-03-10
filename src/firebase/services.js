// src/firebase/services.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, where, serverTimestamp
} from "firebase/firestore";
import {
  signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { db, auth } from "./config";

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const createUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// ── CONSUMERS ─────────────────────────────────────────────────────────────────
export const getConsumers = async () => {
  const snap = await getDocs(query(collection(db, "consumers"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addConsumer = async (data) => {
  const ref = await addDoc(collection(db, "consumers"), {
    ...data,
    status: "Active",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const deleteConsumer = async (id) => {
  // Delete all bills for this consumer first
  const billsSnap = await getDocs(query(collection(db, "bills"), where("consumerId", "==", id)));
  const deletes = billsSnap.docs.map(d => deleteDoc(doc(db, "bills", d.id)));
  await Promise.all(deletes);
  await deleteDoc(doc(db, "consumers", id));
};

export const updateConsumerStatus = async (id, status) => {
  await updateDoc(doc(db, "consumers", id), { status });
};

// ── BILLS ─────────────────────────────────────────────────────────────────────
export const getBillsForConsumer = async (consumerId) => {
  const snap = await getDocs(
    query(collection(db, "bills"),
      where("consumerId", "==", consumerId),
      orderBy("createdAt", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllBills = async () => {
  const snap = await getDocs(query(collection(db, "bills"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addBill = async (data) => {
  const ref = await addDoc(collection(db, "bills"), {
    ...data,
    paid: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const markBillPaid = async (billId, paid) => {
  await updateDoc(doc(db, "bills", billId), {
    paid,
    paidAt: paid ? serverTimestamp() : null,
  });
};

// ── SYSTEM USERS (stored in Firestore for role management) ───────────────────
export const getSystemUsers = async () => {
  const snap = await getDocs(collection(db, "systemUsers"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addSystemUser = async (data) => {
  await addDoc(collection(db, "systemUsers"), { ...data, createdAt: serverTimestamp() });
};
