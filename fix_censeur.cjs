const fs = require('fs')

let content = fs.readFileSync('src/apps/censeur/CenseurPortal.jsx', 'utf8')

if (!content.includes("import StructureTab")) {
    content = content.replace("import LetterheadSettings", "import StructureTab from './StructureTab.jsx'\nimport LetterheadSettings")
}

if (!content.includes("{ key: 'structure'")) {
    content = content.replace("{ key: 'bulletins'", "{ key: 'structure', label: 'Classes & Matières' },\n  { key: 'bulletins'")
}

if (!content.includes("tab === 'structure'")) {
    content = content.replace("{tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}", "{tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}\n      {tab === 'structure' && <StructureTab />}")
}

fs.writeFileSync('src/apps/censeur/CenseurPortal.jsx', content)
console.log("CenseurPortal fixed.")
