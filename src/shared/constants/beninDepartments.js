/**
 * Benin's 12 administrative departments, each with its communes (matching
 * FRANCOPHONE_AFRICA_DATA['Benin'] in locations.js). Used to bucket a
 * school/teacher's `city` field into a department for the marketplace's
 * region map (BeninMap.jsx) - no schema change needed since every school
 * and teacher record already carries a city string.
 */
export const BENIN_DEPARTMENTS = {
  Alibori: ['Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Malanville', 'Segbana'],
  Atacora: ['Boukoumbé', 'Cobly', 'Kérou', 'Kouandé', 'Matéri', 'Natitingou', 'Péhunco', 'Tanguiéta', 'Toucountouna'],
  Atlantique: ['Abomey-Calavi', 'Allada', 'Kpomassè', 'Ouidah', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè'],
  Borgou: ['Bembéréké', 'Kalalé', "N'Dali", 'Nikki', 'Parakou', 'Pèrèrè', 'Sinendé', 'Tchaourou'],
  Collines: ['Bantè', 'Dassa-Zoumè', 'Glazoué', 'Ouèssè', 'Savalou', 'Savè'],
  Couffo: ['Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin'],
  Donga: ['Bassila', 'Copargo', 'Djougou', 'Ouaké'],
  Littoral: ['Cotonou'],
  Mono: ['Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé', 'Lokossa'],
  Ouémé: ['Adjarra', 'Adjohoun', 'Aguégués', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Porto-Novo', 'Sèmè-Kpodji'],
  Plateau: ['Adja-Ouèrè', 'Ifangni', 'Kétou', 'Pobè', 'Sakété'],
  Zou: ['Abomey', 'Agbangnizoun', 'Bohicon', 'Covè', 'Djidja', 'Ouinhi', 'Za-Kpota', 'Zagnanado', 'Zogbodomey'],
}

const CITY_TO_DEPARTMENT = Object.entries(BENIN_DEPARTMENTS).reduce((acc, [dept, cities]) => {
  cities.forEach((city) => { acc[city.toLowerCase()] = dept })
  return acc
}, {})

export function departmentForCity(city) {
  if (!city) return null
  return CITY_TO_DEPARTMENT[city.trim().toLowerCase()] || null
}
