import { useState } from 'react'
import { Link } from 'react-router-dom'

const TEACHERS_DATA = [
  { id: 1, name: 'Dr. Jean Dupont', subject: 'Mathématiques', city: 'Cotonou', rating: 4.9, price: '15 000 F / mois', image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80', description: 'Docteur en mathématiques appliquées, 10 ans d\'expérience.' },
  { id: 2, name: 'Marie Mensah', subject: 'SVT', city: 'Abomey-Calavi', rating: 4.8, price: '12 000 F / mois', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', description: 'Professeur certifiée, excellente approche pédagogique.' },
  { id: 3, name: 'Paul Kossi', subject: 'Philosophie', city: 'Porto-Novo', rating: 5.0, price: '10 000 F / mois', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80', description: 'Spécialiste de la préparation au Baccalauréat.' },
  { id: 4, name: 'Amina Diallo', subject: 'Physique-Chimie', city: 'Cotonou', rating: 4.7, price: '13 000 F / mois', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', description: 'Rend les sciences accessibles avec des exemples concrets.' },
]

export default function TeacherList() {
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('Toutes')

  const filteredTeachers = TEACHERS_DATA.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(search.toLowerCase()) || teacher.city.toLowerCase().includes(search.toLowerCase())
    const matchesSubject = subjectFilter === 'Toutes' || teacher.subject === subjectFilter
    return matchesSearch && matchesSubject
  })

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Tuteurs à Domicile
            </h2>
            <p className="mt-3 max-w-2xl text-xl text-slate-500">
              Des professeurs certifiés et évalués par les parents pour accompagner votre enfant vers la réussite.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom ou ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
          />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full sm:max-w-xs rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
          >
            <option value="Toutes">Toutes les matières</option>
            <option value="Mathématiques">Mathématiques</option>
            <option value="Physique-Chimie">Physique-Chimie</option>
            <option value="SVT">SVT</option>
            <option value="Philosophie">Philosophie</option>
          </select>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTeachers.map((teacher) => (
            <Link key={teacher.id} to={`/teachers/${teacher.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl hover:-translate-y-1 hover:ring-indigo-200">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-200">
                <img src={teacher.image} alt={teacher.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600">{teacher.subject}</p>
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <span className="text-yellow-400">★</span> {teacher.rating}
                    </div>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {teacher.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{teacher.city}</p>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">{teacher.description}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="text-sm font-bold text-slate-900">
                    {teacher.price}
                  </div>
                  <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-500">Profil &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
          {filteredTeachers.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-lg text-slate-500">Aucun tuteur ne correspond à vos critères.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

