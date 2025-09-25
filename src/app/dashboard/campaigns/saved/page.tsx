'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ExternalLink, Calendar, User, Clock, Edit, Save, X } from 'lucide-react';

interface SavedCopy {
  id: string;
  campaign_name: string;
  client: string;
  send_date: string;
  subject_lines: string[];
  preview_text: string[];
  email_blocks: any[];
  selected_subject: number;
  selected_preview: number;
  created_at: string;
  airtable_id?: string;
}

export default function SavedCopiesPage() {
  const [savedCopies, setSavedCopies] = useState<SavedCopy[]>([]);
  const [savedFlows, setSavedFlows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'flows'>('campaigns');
  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedCopies();
  }, []);

  const loadSavedCopies = async () => {
    try {
      console.log('🔍 SAVED COPIES: Loading saved copies and flows...');
      
      // Load campaigns
      const campaignsResponse = await fetch('/api/campaigns/saved-copies');
      if (campaignsResponse.ok) {
        const campaignsResult = await campaignsResponse.json();
        const campaigns = (campaignsResult.data || []).filter((item: any) => item.type !== 'flow');
        setSavedCopies(campaigns);
        console.log('✅ SAVED COPIES: Loaded campaigns:', campaigns.length);
      }
      
      // Load flows
      const flowsResponse = await fetch('/api/flows/saved');
      if (flowsResponse.ok) {
        const flowsResult = await flowsResponse.json();
        setSavedFlows(flowsResult.data || []);
        console.log('✅ SAVED COPIES: Loaded flows:', flowsResult.data?.length);
      }
    } catch (error) {
      console.error('❌ SAVED COPIES: Error loading copies:', error);
      setSavedCopies([]);
      setSavedFlows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getShareableUrl = (copyId: string) => {
    return `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/campaigns/view/${copyId}?readonly=true`;
  };

  const getFlowShareableUrl = (flowId: string) => {
    return `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/flows/view/${flowId}?readonly=true`;
  };

  const copyShareableLink = (copyId: string) => {
    const url = getShareableUrl(copyId);
    navigator.clipboard.writeText(url);
    
    // Show simple feedback
    const button = document.getElementById(`copy-btn-${copyId}`);
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        if (button.textContent === 'Copied!') {
          button.textContent = originalText;
        }
      }, 2000);
    }
  };

  const toggleEdit = (copyId: string) => {
    setEditingCopyId(editingCopyId === copyId ? null : copyId);
  };

  const saveCopyChanges = async (copyId: string, updatedData: Partial<SavedCopy>) => {
    try {
      const response = await fetch(`/api/campaigns/copy/${copyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        // Update local state
        setSavedCopies(prev => prev.map(copy => 
          copy.id === copyId ? { ...copy, ...updatedData } : copy
        ));
        setEditingCopyId(null);
        console.log('✅ SAVED COPIES: Copy updated successfully');
      } else {
        console.error('❌ SAVED COPIES: Failed to update copy');
      }
    } catch (error) {
      console.error('❌ SAVED COPIES: Error updating copy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading saved copies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 mb-6">
        <div className="px-6 py-4 border-b border-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Saved Copies</h1>
              <p className="text-gray-300">Finalized email copy and flows ready for client review</p>
            </div>
            <div className="text-sm text-gray-400">
              {savedCopies.length} campaigns • {savedFlows.length} flows
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'campaigns' 
                  ? 'border-purple-400 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              📧 Campaigns ({savedCopies.length})
            </button>
            <button
              onClick={() => setActiveTab('flows')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'flows' 
                  ? 'border-purple-400 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              🔄 Flows ({savedFlows.length})
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Tab Content */}
      {activeTab === 'campaigns' && (
        savedCopies.length === 0 ? (
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Saved Copies Yet</h3>
            <p className="text-gray-300 mb-6">
              Finalized copies will appear here for easy sharing with clients.
            </p>
            <Link
              href="/dashboard/airtable-test"
              className="inline-flex items-center px-4 py-2 bg-purple-gradient text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedCopies.map((copy) => (
              <div key={copy.id} className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 overflow-hidden hover:bg-dark-700/50 transition-all duration-200">
                {/* Copy Header */}
                <div className="p-6 border-b border-dark-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingCopyId === copy.id ? (
                        <input
                          type="text"
                          defaultValue={copy.campaign_name}
                          className="text-lg font-semibold bg-dark-600 text-white rounded px-2 py-1 mb-2 w-full"
                          onBlur={(e) => saveCopyChanges(copy.id, { campaign_name: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveCopyChanges(copy.id, { campaign_name: e.currentTarget.value });
                            }
                          }}
                        />
                      ) : (
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {copy.campaign_name}
                        </h3>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{copy.client}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{copy.send_date}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEdit(copy.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title={editingCopyId === copy.id ? "Stop editing" : "Edit copy"}
                    >
                      {editingCopyId === copy.id ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Copy Preview */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Subject Line:</h4>
                    {editingCopyId === copy.id ? (
                      <input
                        type="text"
                        defaultValue={copy.subject_lines?.[copy.selected_subject] || copy.subject_lines?.[0] || ''}
                        className="bg-dark-600 text-white rounded px-2 py-1 text-sm w-full"
                        onBlur={(e) => {
                          const updatedSubjectLines = [...copy.subject_lines];
                          updatedSubjectLines[copy.selected_subject || 0] = e.target.value;
                          saveCopyChanges(copy.id, { subject_lines: updatedSubjectLines });
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const updatedSubjectLines = [...copy.subject_lines];
                            updatedSubjectLines[copy.selected_subject || 0] = e.currentTarget.value;
                            saveCopyChanges(copy.id, { subject_lines: updatedSubjectLines });
                          }
                        }}
                      />
                    ) : (
                      <p className="text-white text-sm">
                        {copy.subject_lines?.[copy.selected_subject] || copy.subject_lines?.[0] || 'No subject line'}
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Preview Text:</h4>
                    {editingCopyId === copy.id ? (
                      <textarea
                        defaultValue={copy.preview_text?.[copy.selected_preview] || copy.preview_text?.[0] || ''}
                        className="bg-dark-600 text-gray-300 rounded px-2 py-1 text-sm w-full resize-none"
                        rows={2}
                        onBlur={(e) => {
                          const updatedPreviewText = [...copy.preview_text];
                          updatedPreviewText[copy.selected_preview || 0] = e.target.value;
                          saveCopyChanges(copy.id, { preview_text: updatedPreviewText });
                        }}
                      />
                    ) : (
                      <p className="text-gray-300 text-sm">
                        {copy.preview_text?.[copy.selected_preview] || copy.preview_text?.[0] || 'No preview text'}
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Email Blocks:</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 text-sm">
                        {copy.email_blocks?.length || 0} content blocks
                      </p>
                      {editingCopyId === copy.id && (
                        <Link
                          href={`/campaigns/view/${copy.id}?edit=true`}
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit blocks</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Copy Actions */}
                <div className="px-6 py-4 bg-dark-700/30 border-t border-dark-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(copy.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        id={`copy-btn-${copy.id}`}
                        onClick={() => copyShareableLink(copy.id)}
                        className="text-xs px-3 py-1 bg-dark-600 text-gray-300 rounded hover:bg-dark-500 transition-colors"
                      >
                        Copy Link
                      </button>
                      
                      <Link
                        href={getShareableUrl(copy.id)}
                        target="_blank"
                        className="flex items-center space-x-1 text-xs px-3 py-1 bg-purple-gradient text-white rounded hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Flows Tab Content */}
      {activeTab === 'flows' && (
        savedFlows.length === 0 ? (
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Saved Flows Yet</h3>
            <p className="text-gray-300 mb-6">
              Finalized email flows will appear here for easy sharing with clients.
            </p>
            <Link
              href="/dashboard/flows/create"
              className="inline-flex items-center px-4 py-2 bg-purple-gradient text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Create Flow
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedFlows.map((flow) => (
              <div key={flow.id} className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 overflow-hidden hover:bg-dark-700/50 transition-all duration-200">
                {/* Flow Header */}
                <div className="p-6 border-b border-dark-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {flow.flow_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{flow.client}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="uppercase text-xs font-medium px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            {flow.flow_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Preview */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Email Sequence:</h4>
                    <p className="text-white text-sm">
                      {flow.email_count} emails • {flow.offer ? 'Includes offers' : 'No offers'}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Primary Offer:</h4>
                    <p className="text-gray-300 text-sm">
                      {flow.offer || 'No primary offer'}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Email Themes:</h4>
                    <div className="text-gray-300 text-sm space-y-1">
                      {flow.emails?.slice(0, 3).map((email: any, index: number) => (
                        <div key={index} className="text-xs">
                          Email {email.emailNumber}: {email.theme}
                        </div>
                      ))}
                      {flow.emails?.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{flow.emails.length - 3} more emails...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flow Actions */}
                <div className="px-6 py-4 bg-dark-700/30 border-t border-dark-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(flow.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        id={`copy-btn-${flow.id}`}
                        onClick={() => copyShareableLink(flow.id)}
                        className="text-xs px-3 py-1 bg-dark-600 text-gray-300 rounded hover:bg-dark-500 transition-colors"
                      >
                        Copy Link
                      </button>
                      
                      <Link
                        href={`/flows/view/${flow.id}?readonly=true`}
                        target="_blank"
                        className="flex items-center space-x-1 text-xs px-3 py-1 bg-purple-gradient text-white rounded hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View Flow</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}