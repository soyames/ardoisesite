import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

// TipTap Editor
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function MarketplaceStudentPortal() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'tutoring_contracts'), where('studentId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const data = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setContracts(data)
      setLoading(false)
    }, (err) => { console.error('tutoring_contracts read failed:', err); setLoading(false) })
    return () => unsub()
  }, [user?.uid])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mon Espace Soutien Scolaire</h1>
        <p className="mt-1 text-sm text-ink-muted">Retrouvez vos cours de tutorat et vos devoirs.</p>
      </div>

      <div className="mb-6 flex space-x-1 rounded-control bg-surface-raised p-1 shadow-sm ring-1 ring-border sm:w-max">
        {['overview', 'assignments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-control px-4 py-2 text-sm font-medium ${
              activeTab === tab ? 'bg-surface text-ink shadow ring-1 ring-border' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab === 'overview' ? 'Mes Cours & Visio' : 'Espace Devoirs'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {loading && <div className="flex justify-center py-10"><Spinner /></div>}
          {!loading && contracts.length === 0 && (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-ink-muted">Vous n'avez aucun cours de tutorat assigné pour le moment.</p>
              </CardBody>
            </Card>
          )}
          {!loading && contracts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.map(contract => (
                <Card key={contract.id} className="border border-border">
                  <CardBody>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-ink">Tuteur : {contract.teacherName}</h3>
                        <p className="text-sm text-ink-muted">Commence le : {contract.startDate} &bull; {contract.hoursPerWeek}h/semaine</p>
                      </div>
                      <Badge tone={contract.status === 'active' ? 'success' : 'neutral'}>
                        {contract.status === 'active' ? 'Actif' : contract.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                      <Link
                        to={`/live-room/contract-${contract.id}`}
                        className="rounded-control bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-700 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">video_call</span>
                        Rejoindre l'appel
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <AdvancedAssignmentPanel />
      )}
    </div>
  )
}

function AdvancedAssignmentPanel() {
  const [submitted, setSubmitted] = useState(false)
  const [tool, setTool] = useState('text') // text, calc, graph, draw
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Saisissez votre réponse ici. Utilisez les outils ci-dessus pour la calculatrice, les graphiques ou le dessin géométrique...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[400px] p-4 bg-surface',
      },
    },
  })

  return (
    <Card className="border border-border">
      <CardHeader 
        title="Outils de Devoir Intégrés" 
        subtitle="Rédigez, calculez et dessinez directement sur la plateforme. Aucun fichier à télécharger ou envoyer." 
      />
      <CardBody>
        {submitted ? (
          <div className="rounded-control bg-success-50 p-6 text-success-700 text-center">
            <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
            <p className="font-bold text-lg">Travail soumis avec succès !</p>
            <p className="text-sm mt-1">Votre tuteur recevra une notification pour vous corriger.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-control bg-surface-raised p-4 ring-1 ring-border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-ink">Mathématiques : Fonctions et Géométrie</h3>
                  <p className="text-sm text-ink-muted mt-1">A rendre pour le prochain cours. 1) Tracez f(x) = x². 2) Résolvez l'équation.</p>
                </div>
                <Badge tone="warning">À rendre</Badge>
              </div>
            </div>
            
            <div className="rounded-control border border-border bg-surface overflow-hidden shadow-sm">
              {/* Toolbar */}
              <div className="border-b border-border bg-surface-raised p-2 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setTool('text')} className={`px-3 py-1.5 text-sm rounded-control font-bold flex items-center gap-1 transition ${tool === 'text' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-surface ring-1 ring-border hover:bg-surface-raised'}`}>
                    <span className="material-symbols-outlined text-[16px]">text_fields</span> Rédaction
                  </button>
                  <button onClick={() => setTool('calc')} className={`px-3 py-1.5 text-sm rounded-control font-bold flex items-center gap-1 transition ${tool === 'calc' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-surface ring-1 ring-border hover:bg-surface-raised'}`}>
                    <span className="material-symbols-outlined text-[16px]">calculate</span> Calculatrice
                  </button>
                  <button onClick={() => setTool('graph')} className={`px-3 py-1.5 text-sm rounded-control font-bold flex items-center gap-1 transition ${tool === 'graph' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-surface ring-1 ring-border hover:bg-surface-raised'}`}>
                    <span className="material-symbols-outlined text-[16px]">show_chart</span> Graphique
                  </button>
                  <button onClick={() => setTool('draw')} className={`px-3 py-1.5 text-sm rounded-control font-bold flex items-center gap-1 transition ${tool === 'draw' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-surface ring-1 ring-border hover:bg-surface-raised'}`}>
                    <span className="material-symbols-outlined text-[16px]">draw</span> Dessin
                  </button>
                </div>
                
                {tool === 'text' && (
                  <div className="flex gap-1 border-l border-border pl-2">
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-sm rounded bg-surface ring-1 ring-border font-bold hover:bg-surface-raised">B</button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-sm rounded bg-surface ring-1 ring-border italic hover:bg-surface-raised">I</button>
                    <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="px-2 py-1 text-sm rounded bg-surface ring-1 ring-border font-mono hover:bg-surface-raised">Code</button>
                  </div>
                )}
              </div>
              
              {/* Workspace Area */}
              <div className="min-h-[400px] relative">
                {tool === 'text' && (
                  <EditorContent editor={editor} className="h-full" />
                )}
                
                {tool === 'calc' && (
                  <iframe src="https://www.desmos.com/scientific?lang=fr" className="w-full h-[400px] border-0" title="Calculatrice Scientifique"></iframe>
                )}
                
                {tool === 'graph' && (
                  <iframe src="https://www.desmos.com/calculator?lang=fr" className="w-full h-[400px] border-0" title="Graphique"></iframe>
                )}
                
                {tool === 'draw' && (
                  <SimpleDrawingBoard />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="rounded-control bg-surface px-4 py-2 text-sm font-bold text-ink hover:bg-surface-raised ring-1 ring-border">
                Sauvegarder le brouillon
              </button>
              <button onClick={() => setSubmitted(true)} className="rounded-control bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 shadow-sm">
                Soumettre le travail
              </button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function SimpleDrawingBoard() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    // Fill background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = color
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.closePath()
      setIsDrawing(false)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="p-4 bg-surface h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-ink-muted">Couleur:</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
        </div>
        <button onClick={clearCanvas} className="text-sm px-3 py-1 bg-surface-raised rounded ring-1 ring-border hover:bg-danger-50 hover:text-danger-700">Effacer tout</button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={340}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full bg-white ring-1 ring-border rounded cursor-crosshair touch-none"
        style={{ height: '340px' }}
      />
    </div>
  )
}

