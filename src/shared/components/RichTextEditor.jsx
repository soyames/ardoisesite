import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'

// Supported variables that the backend renderer replaces
const VARIABLES = [
  { label: 'Nom de l\'Ecole', value: '[Nom de l\'Ecole]' },
  { label: 'Adresse complete', value: '[Adresse complete de l\'ecole]' },
  { label: 'Telephone', value: '[Numero]' },
  { label: 'Email', value: '[Email]' },
  { label: 'Site Web', value: '[Site Web]' },
  { label: 'RCCM / Immatriculation', value: '[Numero d\'immatriculation]' },
]

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4',
      },
    },
  })

  // Synchronize external value changes if needed (e.g. clicking "Inserer modele")
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const insertVariable = (variableValue) => {
    editor.chain().focus().insertContent(variableValue).run()
  }

  return (
    <div className="rounded-control border border-border bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-muted p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-primary-100 text-primary-700' : 'text-ink-muted hover:bg-surface-hover'}`}
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-primary-100 text-primary-700' : 'text-ink-muted hover:bg-surface-hover'}`}
        >
          <span className="italic">I</span>
        </button>
        
        <div className="w-px h-4 bg-border mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary-100 text-primary-700' : 'text-ink-muted hover:bg-surface-hover'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16"></path></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary-100 text-primary-700' : 'text-ink-muted hover:bg-surface-hover'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary-100 text-primary-700' : 'text-ink-muted hover:bg-surface-hover'}`}
        >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M4 18h16"></path></svg>
        </button>

        <div className="w-px h-4 bg-border mx-1 flex-grow"></div>

        {/* Variables Dropdown */}
        <div className="relative">
          <select 
            onChange={(e) => {
              if (e.target.value) {
                insertVariable(e.target.value)
                e.target.value = "" // Reset dropdown
              }
            }}
            className="text-xs bg-surface border border-border rounded px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">+ Inserer Variable...</option>
            {VARIABLES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="bg-surface text-ink cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
