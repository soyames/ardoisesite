import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useAuth } from '../auth/AuthContext.jsx'
import Spinner from './Spinner.jsx'

/**
 * Renders the LiveKit Video Conference room.
 * Fetches the secure token from the Django backend before connecting.
 */
export default function LiveKitRoomUI() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const [token, setToken] = useState(null)
  const [livekitUrl, setLivekitUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomId) return

    async function fetchToken() {
      try {
        // Must use token passed from parent auth context to call secure backend
        const authHeader = localStorage.getItem('token') 
          ? { Authorization: `Token ${localStorage.getItem('token')}` }
          : {}

        const response = await fetch(`/api/collab/livekit/token/${roomId}/`, {
          headers: { ...authHeader, 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          throw new Error('Impossible de rejoindre la salle de visioconference.')
        }

        const data = await response.json()
        setToken(data.token)
        setLivekitUrl(data.livekitUrl || 'wss://livekit.ardoise.soyames.com') // Ensure it connects to proper endpoint
      } catch (err) {
        setError(err.message)
      }
    }

    fetchToken()
  }, [roomId])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div className="rounded-control bg-danger-50 p-6 shadow">
          <span className="material-symbols-outlined text-4xl text-danger-600">error</span>
          <h2 className="mt-2 text-xl font-bold text-ink">Erreur de Connexion</h2>
          <p className="mt-2 text-ink-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
        <span className="ml-3 text-ink-muted">Preparation de la salle...</span>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-ink">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={livekitUrl}
        data-lk-theme="default"
        style={{ height: '100vh' }}
      >
        {/* The built-in pre-styled video conference grid */}
        <VideoConference />
        {/* The RoomAudioRenderer takes care of track-bound audio */}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
