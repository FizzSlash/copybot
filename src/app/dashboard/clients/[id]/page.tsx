'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Save, Plus, MessageSquare, Calendar, User, Edit2, Trash2, Check, X } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company: string;
  website_url: string;
  email: string | null;
  brand_questionnaire: any;
  created_at: string;
  updated_at: string;
}

interface ClientNote {
  id: string;
  client_id: string;
  note: string;
  category: 'insight' | 'preference' | 'feedback' | 'general';
  created_by: string;
  created_at: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    website_url: '',
    brand_questionnaire: {
      target_audience: '',
      brand_voice: '',
      brand_personality: [],
      key_messaging: '',
      competitors: [],
      pain_points: [],
      unique_value_props: [],
      content_preferences: '',
      tone_examples: ''
    }
  });

  // New note state
  const [newNote, setNewNote] = useState({ note: '', category: 'general' as const });
  const [addingNote, setAddingNote] = useState(false);

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState({ note: '', category: 'general' as const });
  const [updatingNote, setUpdatingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadNotes();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      console.log('🔄 CLIENT DETAIL: Loading client data for ID:', clientId);
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 CLIENT DETAIL: Loaded client:', data);
        setClient(data.data);
        setFormData({
          name: data.data.name || '',
          company: data.data.company || '',
          email: data.data.email || '',
          website_url: data.data.website_url || '',
          brand_questionnaire: data.data.brand_questionnaire || {
            target_audience: '',
            brand_voice: '',
            brand_personality: [],
            key_messaging: '',
            competitors: [],
            pain_points: [],
            unique_value_props: [],
            content_preferences: '',
            tone_examples: ''
          }
        });
      } else {
        console.error('❌ CLIENT DETAIL: Failed to load client');
        // If client not found, redirect back to clients list
        router.push('/dashboard/clients');
      }
    } catch (error) {
      console.error('💥 CLIENT DETAIL: Error loading client:', error);
      router.push('/dashboard/clients');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      console.log('🔄 CLIENT DETAIL: Loading notes for client:', clientId);
      const response = await fetch(`/api/clients/${clientId}/notes`);
      if (response.ok) {
        const data = await response.json();
        console.log('📝 CLIENT DETAIL: Loaded notes:', data);
        setNotes(data.data || []);
      }
    } catch (error) {
      console.error('💥 CLIENT DETAIL: Error loading notes:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 CLIENT DETAIL: Saving client updates...');
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ CLIENT DETAIL: Client updated successfully');
        setClient(data.data);
        setIsEditing(false);
      } else {
        console.error('❌ CLIENT DETAIL: Failed to update client');
      }
    } catch (error) {
      console.error('💥 CLIENT DETAIL: Error updating client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.note.trim()) return;
    
    setAddingNote(true);
    try {
      console.log('📝 CLIENT DETAIL: Adding new note...');
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          note: newNote.note,
          category: newNote.category
        })
      });

      if (response.ok) {
        console.log('✅ CLIENT DETAIL: Note added successfully');
        setNewNote({ note: '', category: 'general' });
        loadNotes(); // Reload notes
      } else {
        console.error('❌ CLIENT DETAIL: Failed to add note');
      }
    } catch (error) {
      console.error('💥 CLIENT DETAIL: Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleEditNote = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditingNote({ note: note.note, category: note.category as 'general' });
  };

  const handleUpdateNote = async () => {
    if (!editingNote.note.trim() || !editingNoteId) return;
    
    setUpdatingNote(true);
    try {
      console.log('📝 CLIENT DETAIL: Updating note...');
      const response = await fetch(`/api/clients/${clientId}/notes/${editingNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNote)
      });

      if (response.ok) {
        console.log('✅ CLIENT DETAIL: Note updated successfully');
        setEditingNoteId(null);
        setEditingNote({ note: '', category: 'general' });
        loadNotes(); // Reload notes
      } else {
        console.error('❌ CLIENT DETAIL: Failed to update note');
      }
    } catch (error) {
      console.error('💥 CLIENT DETAIL: Error updating note:', error);
    } finally {
      setUpdatingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNote({ note: '', category: 'general' });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    setDeletingNoteId(noteId);
    try {
      console.log('🗑️ CLIENT DETAIL: Deleting note...');
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ CLIENT DETAIL: Note deleted successfully');
        loadNotes(); // Reload notes
      } else {
        console.error('❌ CLIENT DETAIL: Failed to delete note');
      }
    } catch (error) {
      console.error('💥 CLIENT DETAIL: Error deleting note:', error);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'insight': return '💡';
      case 'preference': return '⭐';
      case 'feedback': return '💬';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'preference': return 'bg-purple-100 text-purple-800';
      case 'feedback': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Client not found</h2>
        <Link href="/dashboard/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/clients"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.company}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Client
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Client Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.company}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.email || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  client.website_url ? (
                    <div className="flex items-center text-blue-600 hover:text-blue-800">
                      <Globe className="h-4 w-4 mr-1" />
                      <a href={client.website_url} target="_blank" rel="noopener noreferrer">
                        {client.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-500">Not provided</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Brand Questionnaire */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Guidelines</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                {isEditing ? (
                  <textarea
                    value={formData.brand_questionnaire.target_audience}
                    onChange={(e) => setFormData({
                      ...formData, 
                      brand_questionnaire: {...formData.brand_questionnaire, target_audience: e.target.value}
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.brand_questionnaire?.target_audience || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Voice</label>
                {isEditing ? (
                  <textarea
                    value={formData.brand_questionnaire.brand_voice}
                    onChange={(e) => setFormData({
                      ...formData, 
                      brand_questionnaire: {...formData.brand_questionnaire, brand_voice: e.target.value}
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.brand_questionnaire?.brand_voice || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Messaging</label>
                {isEditing ? (
                  <textarea
                    value={formData.brand_questionnaire.key_messaging}
                    onChange={(e) => setFormData({
                      ...formData, 
                      brand_questionnaire: {...formData.brand_questionnaire, key_messaging: e.target.value}
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.brand_questionnaire?.key_messaging || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Preferences</label>
                {isEditing ? (
                  <textarea
                    value={formData.brand_questionnaire.content_preferences}
                    onChange={(e) => setFormData({
                      ...formData, 
                      brand_questionnaire: {...formData.brand_questionnaire, content_preferences: e.target.value}
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{client.brand_questionnaire?.content_preferences || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone Examples</label>
                {isEditing ? (
                  <textarea
                    value={formData.brand_questionnaire.tone_examples}
                    onChange={(e) => setFormData({
                      ...formData, 
                      brand_questionnaire: {...formData.brand_questionnaire, tone_examples: e.target.value}
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <pre className="text-gray-900 whitespace-pre-wrap font-sans">{client.brand_questionnaire?.tone_examples || 'Not specified'}</pre>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client Notes Sidebar */}
        <div className="space-y-6">
          {/* Add New Note */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Add Note
            </h2>
            
            <div className="space-y-3">
              <div>
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({...newNote, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="insight">Insight</option>
                  <option value="preference">Preference</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              
              <textarea
                value={newNote.note}
                onChange={(e) => setNewNote({...newNote, note: e.target.value})}
                placeholder="Add client feedback, insights, or preferences that can be used in copy generation..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={handleAddNote}
                disabled={!newNote.note.trim() || addingNote}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{addingNote ? 'Adding...' : 'Add Note'}</span>
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Notes</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notes yet. Add your first note above.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {editingNoteId === note.id ? (
                          <select
                            value={editingNote.category}
                            onChange={(e) => setEditingNote({...editingNote, category: e.target.value as any})}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="general">General</option>
                            <option value="insight">Insight</option>
                            <option value="preference">Preference</option>
                            <option value="feedback">Feedback</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(note.category)}`}>
                            <span className="mr-1">{getCategoryIcon(note.category)}</span>
                            {note.category}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(note.created_at)}
                        </span>
                        
                        {editingNoteId === note.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={handleUpdateNote}
                              disabled={updatingNote || !editingNote.note.trim()}
                              className="p-1 text-green-600 hover:text-green-800 disabled:text-gray-400"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updatingNote}
                              className="p-1 text-gray-600 hover:text-gray-800"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditNote(note)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deletingNoteId === note.id}
                              className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <textarea
                        value={editingNote.note}
                        onChange={(e) => setEditingNote({...editingNote, note: e.target.value})}
                        rows={3}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="Edit your note..."
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">{note.note}</p>
                    )}
                    
                    {deletingNoteId === note.id && (
                      <div className="mt-2 text-xs text-gray-500 italic">Deleting...</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Client Info
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <div>
                  <p>Created: {formatDate(client.created_at)}</p>
                  {client.updated_at !== client.created_at && (
                    <p>Updated: {formatDate(client.updated_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}