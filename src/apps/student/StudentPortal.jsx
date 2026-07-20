import { useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

// TipTap Editor
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function StudentPortal() {
  const { user } = useAuth()
  const enrollment = useApiGet('/api/students/my-enrollment/')
  const [activeTab, setActiveTab] = useState('overview')

  if (enrollment.loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>
  }
  if (!enrollment.data || !enrollment.data.id) {
    return <EmptyState title="Aucune inscription" description="Votre compte n'est lie a aucun dossier scolaire actif." />
  }

  const enr = enrollment.data
  const student = enr.student

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Espace Eleve</h1>
          <p className="text-ink-muted">
            {student.first_name} {student.last_name} | {enr.classroom?.label || 'Sans classe'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex space-x-1 rounded-control bg-surface-raised p-1 shadow-sm ring-1 ring-border sm:w-max">
        {['overview', 'assignments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-control px-4 py-2 text-sm font-medium ${
              activeTab === tab ? 'bg-surface text-ink shadow ring-1 ring-border' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab === 'overview' ? 'Vue d\'ensemble' : 'Devoirs & Soumissions'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader title="Informations Personnelles" />
            <CardBody>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-ink-muted">Matricule</dt>
                  <dd className="font-medium text-ink">{student.registration_number}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Genre</dt>
                  <dd className="font-medium text-ink">{student.gender}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'assignments' && (
        <AssignmentPanel />
      )}
    </div>
  )
}

function AssignmentPanel() {
  const [submitted, setSubmitted] = useState(false)
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Saisissez votre reponse ici. Vous pouvez utiliser le format texte enrichi pour les equations et formules...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  const submitHomework = () => {
    // const html = editor.getHTML()
    // In a real implementation, this POSTs to /api/academics/assignments/submissions/
    setSubmitted(true)
  }

  return (
    <Card>
      <CardHeader 
        title="Devoirs & Evaluations" 
        subtitle="Rendez vos devoirs directement en ligne sans telecharger de fichier." 
      />
      <CardBody>
        {submitted ? (
          <div className="rounded-control bg-success-50 p-4 text-success-700">
            <p className="font-bold">Devoir soumis avec succes !</p>
            <p className="text-sm mt-1">Votre professeur recevra une notification.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-control bg-surface-raised p-4 ring-1 ring-border">
              <h3 className="font-bold text-ink">Devoir de Mathematiques - Exercice 4 (Demo)</h3>
              <p className="text-sm text-ink-muted mt-1">A rendre avant le 25 Juillet. Demontrez le theoreme de Pythagore.</p>
            </div>
            
            <div className="rounded-control border border-border bg-surface overflow-hidden">
              <div className="border-b border-border bg-surface-raised p-2 flex gap-2">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-sm rounded bg-surface ring-1 ring-border font-bold hover:bg-surface-raised">B</button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-sm rounded bg-surface ring-1 ring-border italic hover:bg-surface-raised">I</button>
                <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="px-2 py-1 text-sm rounded bg-surface ring-1 ring-border font-mono hover:bg-surface-raised">Code</button>
              </div>
              <EditorContent editor={editor} />
            </div>

            <div className="flex justify-end">
              <button onClick={submitHomework} className="rounded-control bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
                Soumettre le devoir
              </button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
