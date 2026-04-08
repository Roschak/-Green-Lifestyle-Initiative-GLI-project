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

// ============ ACTIONS ============
export async function createAction(actionData) {
  const actionsRef = collection(db, 'actions')
  const newAction = {
    ...actionData,
    status: 'pending',
    points_earned: 0,
    created_at: new Date().toISOString()
  }
  const docRef = await addDoc(actionsRef, newAction)
  return { id: docRef.id, ...newAction }
}

export async function getUserActions(userId) {
  const actionsRef = collection(db, 'actions')
  const q = query(actionsRef, where('user_id', '==', userId), orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getAllActions() {
  const actionsRef = collection(db, 'actions')
  const q = query(actionsRef, orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)
  
  const actions = []
  for (const docSnap of snapshot.docs) {
    const action = { id: docSnap.id, ...docSnap.data() }
    const userDoc = await getDoc(doc(db, 'users', action.user_id))
    action.user_name = userDoc.exists() ? userDoc.data().name : 'Unknown'
    actions.push(action)
  }
  return actions
}

export async function verifyAction(actionId, status, pointsEarned = 0, rejectionReason = null) {
  const actionRef = doc(db, 'actions', actionId)
  const actionDoc = await getDoc(actionRef)
  if (!actionDoc.exists()) throw new Error('Action not found')
  
  await updateDoc(actionRef, { status })
  
  if (status === 'approved' && pointsEarned > 0) {
    const userId = actionDoc.data().user_id
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        points: (userDoc.data().points || 0) + pointsEarned,
        monthly_points: (userDoc.data().monthly_points || 0) + pointsEarned
      })
    }
    await updateDoc(actionRef, { points_earned: pointsEarned })
  }
  
  if (status === 'rejected' && rejectionReason) {
    await updateDoc(actionRef, { rejection_reason: rejectionReason })
  }
}

// ============ USER STATS ============
export async function getUserStats(userId) {
  const userData = await getUserData(userId)
  const actions = await getUserActions(userId)
  
  const approved = actions.filter(a => a.status === 'approved')
  const pending = actions.filter(a => a.status === 'pending')
  const rejected = actions.filter(a => a.status === 'rejected')
  
  return {
    name: userData?.name,
    points: userData?.points || 0,
    monthly_points: userData?.monthly_points || 0,
    level: userData?.level || 'Eco-Newbie',
    totalActions: actions.length,
    approved: approved.length,
    pending: pending.length,
    rejected: rejected.length,
    totalPoints: approved.reduce((sum, a) => sum + (a.points_earned || 0), 0)
  }
}

// ============ LEADERBOARD ============
export async function getLeaderboard() {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('role', '==', 'user'), orderBy('monthly_points', 'desc'), limit(10))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    points: doc.data().monthly_points || 0,
    level: doc.data().level
  }))
}

// ============ ADMIN STATS ============
export async function getAdminStats() {
  const usersSnapshot = await getDocs(collection(db, 'users'))
  const actionsSnapshot = await getDocs(collection(db, 'actions'))
  
  const users = usersSnapshot.docs.filter(d => d.data().role === 'user')
  const actions = actionsSnapshot.docs.map(d => d.data())
  
  return {
    totalUsers: users.length,
    totalActions: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    approved: actions.filter(a => a.status === 'approved').length,
    rejected: actions.filter(a => a.status === 'rejected').length,
    onlineUsers: users.filter(u => u.data().status === 'online').length
  }
}

// ============ EVENTS ============
export async function getAllEvents() {
  const eventsRef = collection(db, 'events')
  const q = query(eventsRef, orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)
  
  const events = []
  for (const docSnap of snapshot.docs) {
    const event = { id: docSnap.id, ...docSnap.data() }
    if (event.host_id) {
      const hostDoc = await getDoc(doc(db, 'users', event.host_id))
      event.host_name = hostDoc.exists() ? hostDoc.data().name : 'Unknown'
    }
    events.push(event)
  }
  return events
}

export async function createEvent(eventData) {
  const newEvent = { ...eventData, status: 'roundown', created_at: new Date().toISOString() }
  const docRef = await addDoc(collection(db, 'events'), newEvent)
  return { id: docRef.id, ...newEvent }
}

export async function registerToEvent(registrationData) {
  const existing = await getDocs(query(
    collection(db, 'event_registrations'),
    where('event_id', '==', registrationData.event_id),
    where('email', '==', registrationData.email)
  ))
  if (!existing.empty) throw new Error('Email sudah terdaftar')
  
  const newRegistration = { ...registrationData, proof_status: 'pending', medal_awarded: false, registered_at: new Date().toISOString() }
  const docRef = await addDoc(collection(db, 'event_registrations'), newRegistration)
  return { id: docRef.id, ...newRegistration }
}