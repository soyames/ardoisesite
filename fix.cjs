const fs = require('fs');
const replacements = [
  { p: /A%coles/g, r: 'Écoles' },
  { p: /A%cole/g, r: 'École' },
  { p: /Acm/g, r: 'ém' },
  { p: /Ac/g, r: 'é' },
  { p: /A"/g, r: 'è' },
  { p: /A\^/g, r: 'ê' },
  { p: /A /g, r: 'à' },
  { p: /A\*/g, r: 'ô' },
  { p: /A%/g, r: 'É' },
  { p: /A\//g, r: 'ë' },
  { p: /A\./g, r: 'î' },
  { p: /A\$/g, r: 'ä' },
  { p: /A-/g, r: 'ï' },
  { p: /beninoises/g, r: 'béninoises' }
];

const files = [
  'src/apps/marketplace/TeacherList.jsx',
  'src/apps/marketplace/SchoolList.jsx',
  'src/shared/constants/subjects.js',
  'src/shared/constants/officialResources.js',
  'src/shared/layout/PublicLayout.jsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    replacements.forEach(rep => {
      content = content.replace(rep.p, rep.r);
    });
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
  }
});
