const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.deleteAuthUser = onCall(async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  // Check if the user is a superadmin
  const callerUid = request.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmins can delete users.');
  }

  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError('invalid-argument', 'The function must be called with a "uid" argument.');
  }

  try {
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(uid);
    return { success: true, message: `Successfully deleted user ${uid} from Auth.` };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new HttpsError('internal', 'Error deleting user from Auth.', error.message);
  }
});

const { AccessToken } = require('livekit-server-sdk');

exports.generateLivekitToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }
  
  const { roomName } = request.data;
  if (!roomName) {
    throw new HttpsError('invalid-argument', 'The function must be called with a "roomName" argument.');
  }

  const participantName = request.auth.token.name || request.auth.token.email || request.auth.uid;

  // Use test API keys if env variables are missing for local testing
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: request.auth.uid,
    name: participantName,
  });
  
  at.addGrant({ roomJoin: true, room: roomName });
  
  
  return { token: await at.toJwt() };
});

exports.createChildProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { username, password, firstName, lastName } = request.data;
  
  if (!username || !password || !firstName || !lastName) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  // Ensure it's a valid fake email
  let email = username.trim().toLowerCase();
  if (!email.includes('@')) {
    email = `${email}@student.ardoise.local`;
  }

  try {
    // 1. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: `${firstName} ${lastName}`,
    });

    // 2. Create the user document in Firestore with role 'marketplace_student'
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'marketplace_student',
      parentId: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating child profile:", error);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ce nom d\'utilisateur est déjà pris.');
    }
    throw new HttpsError('internal', 'Erreur lors de la création du profil.', error.message);
  }
});
