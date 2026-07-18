import { useState } from 'react'
import MessagesPanel from './MessagesPanel.jsx'
import TasksPanel from './TasksPanel.jsx'
import DocumentsPanel from './DocumentsPanel.jsx'

const TABS = [
  { key: 'messages', label: 'Messages' },
  { key: 'tasks', label: 'Taches' },
  { key: 'documents', label: 'Documents' },
]

/**
 * Internal staff collaboration - messaging, shared documents, and task
 * follow-up between colleagues at the same school (never a parent or
 * student, see ardoise/apps/collab/models.py's module docstring for
 * why). Mounted once at /portal/collab and reused across every staff
 * portal, same as AppShell itself - a Founder and a Librarian share
 * this exact screen, not a role-specific rebuild.
 */
export default function CollabHub() {
  const [tab, setTab] = useState('messages')

  return (
    <div className="flex h-full flex-col space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Collaboration</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Messagerie et taches avec vos collegues de l'etablissement.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-b-2 border-primary-600 text-primary-700' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'messages' && <MessagesPanel />}
        {tab === 'tasks' && <TasksPanel />}
        {tab === 'documents' && <DocumentsPanel />}
      </div>
    </div>
  )
}
