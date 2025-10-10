import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './QuizNotes.css';
import { database } from '../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { FaArrowLeft, FaPlus, FaEdit, FaTimes } from 'react-icons/fa';

const QuizNotes = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, noteIndex: null });

  useEffect(() => {
    if (!currentUser?.uid || !id) {
      setLoading(false);
      setError("Missing required information");
      return;
    }

    const path = `users/${currentUser.uid}/quizResults/${id}`;
    const quizRef = ref(database, path);
    
    const unsubscribe = onValue(
      quizRef, 
      (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          // Parse notes into array of objects with title and content
          const notesArray = data.notes
            ? data.notes.split('\n\n')
                .filter(note => note.trim())
                .map(note => {
                  try {
                    return JSON.parse(note);
                  } catch {
                    // Handle old format notes
                    return { title: 'Untitled Note', content: note };
                  }
                })
            : [];
          
          setQuizData(data);
          setNotes(notesArray);
          setError(null);
        } else {
          setError("No quiz data found");
        }
        setLoading(false);
      }, 
      (error) => {
        console.error("Firebase error:", error);
        setError("Failed to load quiz data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, id]);

  const validateQuillContent = (content) => {
    const stripped = content.replace(/<[^>]+>/g, '').trim();
    return stripped.length > 0;
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.title.trim() || !validateQuillContent(newNote.content)) {
      return;
    }

    try {
      const updatedNotes = [...notes, { title: newNote.title, content: newNote.content }];
      
      const formattedNotes = updatedNotes.map(note => 
        JSON.stringify({ title: note.title, content: note.content })
      ).join('\n\n');
      
      const quizRef = ref(database, `users/${currentUser.uid}/quizResults/${id}`);
      await update(quizRef, { notes: formattedNotes });

      setNotes(updatedNotes);
      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = (indexToDelete) => {
    setDeleteConfirmation({ show: true, noteIndex: indexToDelete });
  };

  const confirmDelete = async () => {
    try {
      const indexToDelete = deleteConfirmation.noteIndex;
      const updatedNotes = notes.filter((_, index) => index !== indexToDelete);
      
      const formattedNotes = updatedNotes.map(note => 
        JSON.stringify({ title: note.title, content: note.content })
      ).join('\n\n');
      
      const quizRef = ref(database, `users/${currentUser.uid}/quizResults/${id}`);
      await update(quizRef, { notes: formattedNotes });

      setNotes(updatedNotes);
      setDeleteConfirmation({ show: false, noteIndex: null });
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleEditNote = async (e) => {
    e.preventDefault();
    
    if (!editingNote.title.trim() || !validateQuillContent(editingNote.content)) {
      return;
    }

    try {
      const updatedNotes = [...notes];
      updatedNotes[editingNote.index] = {
        title: editingNote.title,
        content: editingNote.content
      };
      
      const formattedNotes = updatedNotes.map(note => 
        JSON.stringify({ title: note.title, content: note.content })
      ).join('\n\n');
      
      const quizRef = ref(database, `users/${currentUser.uid}/quizResults/${id}`);
      await update(quizRef, { notes: formattedNotes });

      setNotes(updatedNotes);
      setEditingNote(null);
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="quiz-notes-page">
        <div className="quiz-notes-container">
          <div className="loading-message">Loading notes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-notes-page">
        <div className="quiz-notes-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="quiz-notes-page">
        <div className="quiz-notes-container">
          <div className="no-notes-message">No quiz data found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-notes-page">
      <div className="quiz-notes-container">
        {/* Header */}
        <div className="quiz-notes-header">
          <div className="header-left">
            <button
              onClick={() => navigate(-1)}
              className="quiz-notes-back-button"
            >
              <FaArrowLeft />
              Back
            </button>
            <h1>{quizData.quizTitle}</h1>
          </div>
          <button 
            className="add-note-btn"
            onClick={() => setIsAddingNote(true)}
          >
            <FaPlus style={{ marginRight: '0.5rem' }} />
            Add Note
          </button>
        </div>

        {/* Add Note Panel */}
        {isAddingNote && (
          <div className="add-note-panel">
            <form onSubmit={handleAddNote}>
              <input
                type="text"
                className="note-title-input"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Enter note title..."
                required
              />
              <div className="quill-container">
                <ReactQuill
                  value={newNote.content}
                  onChange={(content) => setNewNote({ ...newNote, content })}
                  placeholder="Write your note here..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
              <div className="note-actions">
                <button 
                  type="button"
                  className="cancel-note-btn"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote({ title: '', content: '' });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="save-note-btn"
                  disabled={!newNote.title.trim() || !validateQuillContent(newNote.content)}
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div className="quiz-notes-list">
          {notes.length > 0 ? (
            notes.map((note, index) => (
              <div key={index} className="quiz-note-card">
                <div className="note-header">
                  <div className="note-title">{note.title}</div>
                  <div className="note-actions">
                    <button 
                      className="edit-note-btn"
                      onClick={() => setEditingNote({ ...note, index })}
                      title="Edit note"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-note-btn"
                      onClick={() => handleDeleteNote(index)}
                      title="Delete note"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
                <div className="note-content">
                  <ReactQuill 
                    value={note.content}
                    readOnly={true}
                    modules={{ toolbar: false }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="no-notes-message">
              {isAddingNote 
                ? "Add your first note above!" 
                : "No notes yet. Click 'Add Note' to get started!"}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingNote !== null && (
          <div className="edit-note-modal" onClick={() => setEditingNote(null)}>
            <div className="edit-note-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit Note</h3>
              <form onSubmit={handleEditNote}>
                <input
                  type="text"
                  className="note-title-input"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Enter note title..."
                  required
                />
                <div className="quill-container">
                  <ReactQuill
                    value={editingNote.content}
                    onChange={(content) => setEditingNote({ ...editingNote, content })}
                    placeholder="Write your note here..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                  />
                </div>
                <div className="note-actions">
                  <button 
                    type="button"
                    className="cancel-note-btn"
                    onClick={() => setEditingNote(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="save-note-btn"
                    disabled={!editingNote.title.trim() || !validateQuillContent(editingNote.content)}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="delete-modal" onClick={() => setDeleteConfirmation({ show: false, noteIndex: null })}>
            <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Note</h3>
              <p>Are you sure you want to delete this note? This action cannot be undone.</p>
              <div className="delete-modal-actions">
                <button 
                  className="cancel-delete-btn"
                  onClick={() => setDeleteConfirmation({ show: false, noteIndex: null })}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-delete-btn"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizNotes;