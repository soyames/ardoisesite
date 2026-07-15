// A simple in-memory database to allow testing flows without a backend.
// In a real app, this would be handled by the Django backend.

export const mockDb = {
  users: {
    parent: {
      id: 10,
      username: 'parent',
      role: 'parent',
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      phone: '+229 90 00 00 00',
    },
    teacher: {
      id: 20,
      username: 'teacher',
      role: 'teacher',
      name: 'Marie Kouadio',
      email: 'marie.k@example.com',
      phone: '+225 01 02 03 04',
      experiences: [
        { id: 1, employer: 'Lycée Classique', role: 'Professeur de Français', start: '2018', end: '2023', description: 'Enseignement de la littérature aux classes de terminale.' }
      ]
    },
    founder: {
      id: 30,
      username: 'founder',
      role: 'founder',
      name: 'M. le Directeur',
      email: 'founder@ardoise.com',
      phone: '+229 95 00 00 00',
      schoolId: 1 // Link to the first school
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
  ],

  enrollments: [], // { id, schoolId, parentId, parentName, parentPhone, childName, childAge, childClass, status: 'pending'|'accepted'|'rejected', date }
  applications: [] // { id, jobId, teacherId, teacherName, email, status: 'pending'|'accepted'|'rejected', date }
}

// Helper methods to read/write state
let nextId = 1000

export const mockApi = {
  getSchools: () => Object.values(mockDb.schools),
  getSchool: (id) => mockDb.schools[id],
  setSchoolCapacity: (id, isFull) => {
    if (mockDb.schools[id]) mockDb.schools[id].isFull = isFull
  },

  getJobs: () => mockDb.jobs,
  getJob: (id) => mockDb.jobs.find(j => j.id === parseInt(id)),

  // Enrollments
  createEnrollment: (data) => {
    const newReq = { ...data, id: nextId++, status: 'pending', date: new Date().toISOString() }
    mockDb.enrollments.push(newReq)
    return newReq
  },
  getEnrollmentsForSchool: (schoolId) => mockDb.enrollments.filter(e => e.schoolId === schoolId),
  updateEnrollmentStatus: (id, status) => {
    const req = mockDb.enrollments.find(e => e.id === id)
    if (req) req.status = status
  },

  // Job Applications
  createApplication: (data) => {
    const newApp = { ...data, id: nextId++, status: 'pending', date: new Date().toISOString() }
    mockDb.applications.push(newApp)
    return newApp
  },
  getApplicationsForSchool: (schoolId) => {
    // Find all jobs for this school, then find all applications for those jobs
    const jobsForSchool = mockDb.jobs.filter(j => j.schoolId === schoolId).map(j => j.id)
    return mockDb.applications.filter(a => jobsForSchool.includes(a.jobId))
  },
  updateApplicationStatus: (id, status) => {
    const req = mockDb.applications.find(e => e.id === id)
    if (req) req.status = status
  },
  
  // Teachers
  addExperience: (teacherId, exp) => {
    const teacher = Object.values(mockDb.users).find(u => u.id === teacherId)
    if (teacher) {
      if (!teacher.experiences) teacher.experiences = []
      teacher.experiences.push({ ...exp, id: nextId++ })
    }
  },
  addEducation: (teacherId, edu) => {
    const teacher = Object.values(mockDb.users).find(u => u.id === teacherId)
    if (teacher) {
      if (!teacher.education) teacher.education = []
      teacher.education.push({ ...edu, id: nextId++ })
    }
  }
}
