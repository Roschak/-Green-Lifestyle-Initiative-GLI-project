// src/services/firestoreService.js(jaangan di hapus)
import { db } from '../config/firebase_config';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

// Get user role from Firestore
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'user';
    }
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

// Get full user data from Firestore
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Create new user in Firestore (after registration)
export async function createUserInFirestore(uid, userData) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: userData.role || 'user',
      provider: userData.provider || 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
}

// Update user data
export async function updateUserData(uid, updates) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

// Check if user is admin
export async function isAdmin(uid) {
  const role = await getUserRole(uid);
  return role === 'admin';
}

// Get user by email (for admin functions)
export async function getUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}