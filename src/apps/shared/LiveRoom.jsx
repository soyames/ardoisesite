import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { auth, functions } from '../../shared/api/firebase.js';
import { httpsCallable } from 'firebase/functions';
import Spinner from '../../shared/ui/Spinner.jsx';

export function LiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [serverUrl, setServerUrl] = useState(
    import.meta.env.VITE_LIVEKIT_URL || 'wss://ardoise-odne3lfq.livekit.cloud'
  );

  useEffect(() => {
    async function fetchToken() {
      try {
        if (!auth.currentUser) {
          setError("Vous devez être connecté pour rejoindre un appel.");
          return;
        }

        const generateLivekitToken = httpsCallable(functions, 'generateLivekitToken');
        const response = await generateLivekitToken({ roomName: roomId });
        
        if (response.data && response.data.token) {
          setToken(response.data.token);
        } else {
          setError("Impossible de générer le jeton d'accès.");
        }
      } catch (err) {
        console.error("Token fetch error:", err);
        setError("Erreur lors de la connexion au salon vidéo: " + err.message);
      }
    }

    fetchToken();
  }, [roomId]);

  if (error) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center bg-surface p-6 text-center">
        <div className="rounded-card bg-danger-50 p-8 shadow-card border border-danger-100 max-w-md">
          <span className="material-symbols-outlined text-5xl text-danger-500 mb-4">error</span>
          <h2 className="text-xl font-bold text-danger-900 mb-2">Erreur de connexion</h2>
          <p className="text-danger-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-control bg-primary-600 px-4 py-2 font-semibold text-white transition hover:bg-primary-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center bg-surface">
        <Spinner className="h-10 w-10 text-primary-600" />
        <p className="mt-4 font-medium text-ink-muted">Préparation de votre salle vidéo...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-ink" data-lk-theme="default">
      <div className="bg-ink-muted p-4 flex justify-between items-center shrink-0">
        <h2 className="text-white font-semibold">Ardoise Visio - Salon: {roomId}</h2>
        <button 
          onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white transition flex items-center gap-1 text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
          Quitter l'appel
        </button>
      </div>
      <div className="flex-1 relative h-full">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          onDisconnected={() => navigate(-1)}
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
