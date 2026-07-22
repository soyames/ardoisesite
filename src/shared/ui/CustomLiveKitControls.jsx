import React, { useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';

export default function CustomLiveKitControls() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);

  const toggleLowBandwidth = async () => {
    const newState = !isLowBandwidth;
    setIsLowBandwidth(newState);
    
    if (newState) {
      if (localParticipant?.isCameraEnabled) {
        await localParticipant.setCameraEnabled(false);
      }
    }
  };

  const handleFileShare = () => {
    alert("Fonctionnalité de partage de fichiers en cours de développement.");
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <button 
        onClick={toggleLowBandwidth}
        className={`px-4 py-2 rounded font-medium shadow-sm transition-colors ${isLowBandwidth ? 'bg-warning-500 text-white hover:bg-warning-600' : 'bg-surface text-ink hover:bg-surface-hover'}`}
      >
        <span className="material-symbols-outlined align-middle mr-2">
          {isLowBandwidth ? 'signal_cellular_connected_no_internet_0_bar' : 'signal_cellular_4_bar'}
        </span>
        {isLowBandwidth ? 'Mode Bas Débit Actif' : 'Activer Bas Débit'}
      </button>
      
      <button 
        onClick={handleFileShare}
        className="px-4 py-2 bg-primary-600 text-white rounded font-medium shadow-sm hover:bg-primary-700 transition-colors"
      >
        <span className="material-symbols-outlined align-middle mr-2">attach_file</span>
        Partager Fichier
      </button>
    </div>
  );
}
