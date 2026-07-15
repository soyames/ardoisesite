import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const WEST_AFRICA_DATA = {
  'Benin': ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Ouidah', 'Bohicon', 'Natitingou'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora'],
  'Cap-Vert': ['Praia', 'Mindelo', 'Santa Maria'],
  'Côte d\'Ivoire': ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa'],
  'Gambie': ['Banjul', 'Serekunda', 'Brikama'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Takoradi'],
  'Guinée': ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia'],
  'Guinée-Bissau': ['Bissau', 'Bafatá', 'Gabú'],
  'Liberia': ['Monrovia', 'Gbarnga', 'Buchanan'],
  'Mali': ['Bamako', 'Sikasso', 'Mopti', 'Koutiala'],
  'Mauritanie': ['Nouakchott', 'Nouadhibou', 'Rosso'],
  'Niger': ['Niamey', 'Zinder', 'Maradi', 'Agadez'],
  'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt'],
  'Sénégal': ['Dakar', 'Thiès', 'Rufisque', 'Saint-Louis', 'Touba'],
  'Sierra Leone': ['Freetown', 'Bo', 'Kenema', 'Makeni'],
  'Togo': ['Lomé', 'Sokodé', 'Kara', 'Kpalimé']
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('parent')
  const [country, setCountry] = useState('Benin')
  const [city, setCity] = useState(WEST_AFRICA_DATA['Benin'][0])

  const handleRegister = (e) => {
    e.preventDefault()
    // Mock register logic
    alert('Inscription réussie !')
    if (role === 'founder') {
      navigate('/install')
    } else if (role === 'teacher') {
      navigate('/teacher-dashboard')
    } else {
      navigate('/teachers')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto mb-4 flex justify-center">
            <img src="/images/ardoise_lockup_horizontal.png" alt="Ardoise Logo" className="h-12 w-auto mix-blend-multiply" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Inscription
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Rejoignez la plateforme éducative
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4 rounded-md shadow-sm">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Je suis un(e)...</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="parent">Parent (Pour trouver un tuteur)</option>
                <option value="teacher">Professeur (Pour donner des cours)</option>
                <option value="founder">Fondateur d'école (Pour installer Ardoise)</option>
              </select>
            </div>

            <div>
              <label htmlFor="name" className="sr-only">Nom complet</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Nom complet"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Numéro de téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Numéro de téléphone"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Adresse Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Adresse Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Mot de passe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pays</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value)
                  setCity(WEST_AFRICA_DATA[e.target.value][0])
                }}
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {Object.keys(WEST_AFRICA_DATA).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {WEST_AFRICA_DATA[country].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              S'inscrire
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-600">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  )
}
