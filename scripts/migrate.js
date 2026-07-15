

const apiKey = "AIzaSyAll1mPxxuvZpK1MG6I5FzFkWAbBK4BoXI"
const projectId = "ardoise-8cbf6"

const mockDb = {
  users: {
    parent: {
      email: 'parent@ardoise.com',
      password: 'Ardoise2026!',
      role: 'parent',
      name: 'Jean Dupont',
      phone: '+229 90 00 00 00',
    },
    teacher: {
      email: 'teacher@ardoise.com',
      password: 'Ardoise2026!',
      role: 'teacher',
      name: 'Marie Kouadio',
      phone: '+225 01 02 03 04',
      experiences: [
        { id: 1, employer: 'Lycée Classique', role: 'Professeur de Français', start: '2018', end: '2023', description: 'Enseignement de la littérature aux classes de terminale.' }
      ]
    },
    founder: {
      email: 'founder@ardoise.com',
      password: 'Ardoise2026!',
      role: 'founder',
      name: 'M. le Directeur',
      phone: '+229 95 00 00 00',
      schoolId: 1
    }
  },

  schools: {
    1: { id: 1, name: 'Complexe Scolaire La Liberté', city: 'Abomey-Calavi', cycle: 'Primaire & Secondaire', successRate: 98, internalRate: 95, image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80', description: 'Une école d\'excellence reconnue pour sa rigueur et ses résultats aux examens nationaux.', students: 1200, teachers: 85, established: 2005, isFull: false },
    2: { id: 2, name: 'Collège Catholique Père Aupiais', city: 'Cotonou', cycle: 'Secondaire', successRate: 95, internalRate: 92, image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1200&q=80', description: 'Un cadre d\'apprentissage prestigieux au cœur de Cotonou.', students: 2500, teachers: 150, established: 1960, isFull: false },
    3: { id: 3, name: 'Lycée Béhanzin', city: 'Porto-Novo', cycle: 'Secondaire', successRate: 92, internalRate: 88, image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1200&q=80', description: 'Lycée historique de la capitale offrant une formation solide.', students: 3000, teachers: 200, established: 1950, isFull: true },
  },

  jobs: [
    { id: 101, schoolId: 1, title: 'Professeur de Mathématiques (Terminale)', type: 'Temps Plein', posted: 'Il y a 2 jours' },
    { id: 102, schoolId: 1, title: 'Surveillant Général Adjoint', type: 'Temps Plein', posted: 'Il y a 1 semaine' },
  ]
}

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
      // Try to login to get UID
      const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      })
      const loginData = await loginRes.json()
      return loginData.localId
    }
    throw new Error(`Auth Error: ${data.error.message}`)
  }
  return data.localId // This is the UID
}

async function writeFirestoreDoc(collection, docId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?documentId=${docId}`
  const firestoreData = { fields: convertToFirestoreFormat(data) }
  
  const res = await fetch(url, {
    method: 'POST', // POST with documentId creates. Or PATCH to update if exists.
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(firestoreData)
  })
  
  const result = await res.json()
  if (result.error && result.error.status === 'ALREADY_EXISTS') {
    // If it exists, use PATCH
    const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData)
    })
  } else if (result.error) {
    console.error("Firestore error:", result.error)
  }
}

async function migrate() {
  console.log("Starting migration...")

  // 1. Users
  for (const [key, user] of Object.entries(mockDb.users)) {
    console.log(`Creating user: ${user.email}`)
    const uid = await signUpUser(user.email, user.password)
    
    // Remove password from the data we store in Firestore
    const firestoreProfile = { ...user }
    delete firestoreProfile.password
    firestoreProfile.createdAt = new Date().toISOString()

    await writeFirestoreDoc('users', uid, firestoreProfile)
    console.log(`Created user ${user.email} in Firestore with UID ${uid}`)
  }

  // 2. Schools
  for (const [id, school] of Object.entries(mockDb.schools)) {
    console.log(`Migrating school: ${school.name}`)
    await writeFirestoreDoc('schools', id.toString(), school)
  }

  // 3. Jobs
  for (const job of mockDb.jobs) {
    console.log(`Migrating job: ${job.title}`)
    await writeFirestoreDoc('jobs', job.id.toString(), job)
  }

  console.log("Migration complete!")
}

migrate().catch(console.error)
