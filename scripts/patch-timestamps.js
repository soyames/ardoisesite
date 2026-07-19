const apiKey = "AIzaSyAll1mPxxuvZpK1MG6I5FzFkWAbBK4BoXI"
const projectId = "ardoise-8cbf6"

async function fetchFirestoreCollection(collectionName) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`
  const res = await fetch(url)
  const data = await res.json()
  return data.documents || []
}

async function updateDocumentField(name, fieldName, fieldValue) {
  const url = `https://firestore.googleapis.com/v1/${name}?updateMask.fieldPaths=${fieldName}`
  const payload = {
    fields: {
      [fieldName]: { stringValue: fieldValue }
    }
  }
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

async function patchTimestamps() {
  console.log("Patching missing createdAt timestamps...")
  const timestamp = new Date().toISOString()
  
  const collectionsToPatch = ['schools', 'users']
  
  for (const collection of collectionsToPatch) {
    console.log(`Checking ${collection}...`)
    const docs = await fetchFirestoreCollection(collection)
    let patchedCount = 0
    for (const doc of docs) {
      if (!doc.fields.createdAt) {
        await updateDocumentField(doc.name, 'createdAt', timestamp)
        patchedCount++
      }
    }
    console.log(`Patched ${patchedCount} documents in ${collection}.`)
  }
  
  console.log("Patch complete!")
}

patchTimestamps().catch(console.error)
