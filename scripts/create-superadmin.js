const apiKey = "AIzaSyAll1mPxxuvZpK1MG6I5FzFkWAbBK4BoXI"
const projectId = "ardoise-8cbf6"

// Convert JSON object to Firestore document format
function convertToFirestoreFormat(obj) {
  const fields = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') fields[key] = { stringValue: value }
    else if (typeof value === 'number') fields[key] = { integerValue: value.toString() }
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value }
    else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'object') return { mapValue: { fields: convertToFirestoreFormat(item) } }
            if (typeof item === 'string') return { stringValue: item }
            if (typeof item === 'number') return { integerValue: item.toString() }
            return { stringValue: String(item) }
          })
        }
      }
    }
    else if (typeof value === 'object' && value !== null) {
      fields[key] = { mapValue: { fields: convertToFirestoreFormat(value) } }
    }
  }
  return fields
}

async function signUpUser(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  })
  const data = await res.json()
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      console.log(`User ${email} already exists. Skipping auth creation.`)
      const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      })
      const loginData = await loginRes.json()
      return { uid: loginData.localId, token: loginData.idToken }
    }
    throw new Error(`Auth Error: ${data.error.message}`)
  }
  return { uid: data.localId, token: data.idToken }
}

async function writeFirestoreDoc(collection, docId, data, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?documentId=${docId}`
  const firestoreData = { fields: convertToFirestoreFormat(data) }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(firestoreData)
  })
  
  const result = await res.json()
  if (result.error && result.error.status === 'ALREADY_EXISTS') {
    const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(firestoreData)
    })
  } else if (result.error) {
    console.error("Firestore error:", result.error)
  }
}

async function createSuperAdmin() {
  const email = 'superadmin@ardoise.com'
  const password = 'Ardoise2026!'
  console.log(`Creating superadmin: ${email}`)
  const { uid, token } = await signUpUser(email, password)
  
  const firestoreProfile = {
    email: email,
    role: 'superadmin',
    name: 'Admin Principal',
    createdAt: new Date().toISOString()
  }

  await writeFirestoreDoc('users', uid, firestoreProfile, token)
  console.log(`Created superadmin ${email} with password ${password} in Firestore with UID ${uid}`)
}

createSuperAdmin().catch(console.error)
