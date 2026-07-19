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
