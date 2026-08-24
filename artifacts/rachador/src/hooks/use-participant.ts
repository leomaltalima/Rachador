import { useState, useCallback } from 'react';

export function useParticipant(grupoId: number) {
  const key = `rachador_participante_${grupoId}`;
  
  const [participanteId, setParticipanteId] = useState<number | null>(() => {
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  });

  const saveParticipanteId = useCallback((id: number) => {
    localStorage.setItem(key, id.toString());
    setParticipanteId(id);
  }, [key]);

  return { participanteId, saveParticipanteId };
}
