import { useState, useEffect } from 'react';
import { NoteCard } from './NoteCard';

interface Note {
  id: string;
  text: string;
  x: number;
  y: number;
  audioUrl?: string;
}

interface NoteBoardProps {
  onCreateNote: () => void;
}

export function NoteBoard({ onCreateNote }: NoteBoardProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      text: '',
      // Spawn in upper-middle area where hand is detected (y: 120-300)
      x: Math.random() * (window.innerWidth - 400) + 200,
      y: Math.random() * 180 + 120,
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  useEffect(() => {
    (window as any).__createNote = createNote;
  }, [notes]);

  return (
    <>
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      ))}
    </>
  );
}
