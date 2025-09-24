'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Download, MessageSquare, Edit, ArrowLeft, X, CheckCircle } from 'lucide-react';

interface EmailBlock {
  type: 'header' | 'subheader' | 'body' | 'pic' | 'cta' | 'product';
  content: string;
  description?: string;
  cta?: string;
  link?: string;
}

interface SavedCopy {
  id: string;
  campaign_name: string;
  client: string;
  send_date: string;
  subject_lines: string[];
  preview_text: string[];
  email_blocks: EmailBlock[];
  selected_subject: number;
  selected_preview: number;
  created_at: string;
  airtable_id?: string;
}

export default function ShareableCopyView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const copyId = params.id as string;
  const autoEdit = searchParams.get('edit') === 'true';
  const isReadonly = searchParams.get('readonly') === 'true';
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [editedCopyData, setEditedCopyData] = useState<SavedCopy | null>(null);
  
  const [copyData, setCopyData] = useState<SavedCopy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  useEffect(() => {
    loadCopyData();
  }, [copyId]);

  useEffect(() => {
    if (copyData && !editedCopyData) {
      setEditedCopyData(copyData);
    }
  }, [copyData, editedCopyData]);

  const loadCopyData = async () => {
    try {
      console.log('🔍 COPY VIEW: Loading copy data for:', copyId);
      
      const response = await fetch(`/api/campaigns/copy/${copyId}`);
      if (response.ok) {
        const data = await response.json();
        setCopyData(data);
        setEditedCopyData(data);
        console.log('✅ COPY VIEW: Copy data loaded:', data);
      } else {
        throw new Error('Failed to load copy data');
      }
    } catch (error) {
      console.error('❌ COPY VIEW: Error loading copy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCopyChanges = async () => {
    if (!editedCopyData) return;
    
    try {
      console.log('💾 COPY VIEW: Saving changes...');
      
      const response = await fetch(`/api/campaigns/copy/${copyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedCopyData)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setCopyData(updatedData);
        setIsEditing(false);
        console.log('✅ COPY VIEW: Changes saved successfully');
        
        // Show success feedback
        alert('✅ Changes saved successfully!');
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (error) {
      console.error('❌ COPY VIEW: Error saving changes:', error);
      alert('❌ Error saving changes. Please try again.');
    }
  };

  const renderEditableBlockContent = (block: EmailBlock, index: number) => {
    if (!editedCopyData) return null;

    const updateBlock = (updates: Partial<EmailBlock>) => {
      const newBlocks = [...editedCopyData.email_blocks];
      newBlocks[index] = { ...block, ...updates };
      setEditedCopyData({ ...editedCopyData, email_blocks: newBlocks });
    };

    switch (block.type) {
      case 'product':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content || ''}
              onChange={(e) => updateBlock({ content: e.target.value })}
              placeholder="Product name..."
              className="w-full px-2 py-1 text-sm font-semibold bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
            />
            <textarea
              value={block.description || ''}
              onChange={(e) => updateBlock({ description: e.target.value })}
              placeholder="Product description..."
              rows={2}
              className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0"
            />
            <input
              type="text"
              value={block.cta || ''}
              onChange={(e) => updateBlock({ cta: e.target.value })}
              placeholder="CTA text..."
              className="w-full px-2 py-1 text-sm text-purple-400 font-medium bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
            />
            <input
              type="url"
              value={block.link || ''}
              onChange={(e) => updateBlock({ link: e.target.value })}
              placeholder="Product URL..."
              className="w-full px-2 py-1 text-xs text-gray-400 bg-transparent border-0 focus:ring-0"
            />
          </div>
        );
      case 'cta':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content || ''}
              onChange={(e) => updateBlock({ content: e.target.value })}
              placeholder="CTA text..."
              className="w-full px-2 py-1 text-sm text-purple-400 font-medium bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
            />
            <input
              type="url"
              value={block.link || ''}
              onChange={(e) => updateBlock({ link: e.target.value })}
              placeholder="Link URL..."
              className="w-full px-2 py-1 text-xs text-gray-400 bg-transparent border-0 focus:ring-0"
            />
          </div>
        );
      default:
        return (
          <textarea
            value={block.content || ''}
            onChange={(e) => updateBlock({ content: e.target.value })}
            placeholder={`Enter ${block.type} content...`}
            rows={block.type === 'header' ? 1 : block.type === 'subheader' ? 1 : 3}
            className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0"
          />
        );
    }
  };

  const renderBlockContent = (block: EmailBlock) => {
    switch (block.type) {
      case 'product':
        return (
          <div>
            <div className="font-semibold text-white mb-1">{block.content}</div>
            {block.description && (
              <div className="text-white text-sm mb-2">{block.description}</div>
            )}
            {block.cta && (
              <div className="text-purple-400 text-sm font-medium">{block.cta}</div>
            )}
            {block.link && (
              <div className="text-gray-400 text-xs mt-1">{block.link}</div>
            )}
          </div>
        );
      case 'cta':
        return (
          <div>
            <div className="text-purple-400 font-medium">{block.content}</div>
            {block.link && (
              <div className="text-gray-400 text-xs mt-1">{block.link}</div>
            )}
          </div>
        );
      case 'pic':
        return (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded p-3">
            <div className="text-yellow-800 text-sm">📷 {block.content}</div>
          </div>
        );
      default:
        return <div>{block.content}</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-700/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading copy...</p>
        </div>
      </div>
    );
  }

  if (!copyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-700/30">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Copy Not Found</h1>
          <p className="text-white mb-4">This copy link may be invalid or expired.</p>
          <Link href="/dashboard" className="text-purple-400 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 border-b border-dark-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isReadonly && (
                <Link href="/dashboard/airtable-test" className="text-white hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{copyData.campaign_name}</h1>
                <p className="text-sm text-white">{copyData.client} • {copyData.send_date}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isReadonly && (
                <>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedCopyData(copyData); // Reset changes
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm border border-dark-600 rounded-lg hover:bg-dark-700/30"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                      
                      <button
                        onClick={saveCopyChanges}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Save Changes</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm border border-dark-600 rounded-lg hover:bg-dark-700/30"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Copy</span>
                    </button>
                  )}
                  
                  <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-gradient text-white rounded-lg hover:opacity-90">
                    <MessageSquare className="h-4 w-4" />
                    <span>Add Comment</span>
                  </button>
                </>
              )}
              
              <button className="flex items-center space-x-2 px-3 py-2 text-sm border border-dark-600 rounded-lg hover:bg-dark-700/30">
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              
              <button 
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-dark-600 rounded-lg hover:bg-dark-700/30"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow-sm">
          {/* Email Headers */}
          <div className="p-6 border-b border-dark-700/50">
            <div className="mb-4">
              <h2 className="font-semibold text-white mb-2">Subject Line:</h2>
              <div className="text-lg font-medium text-white">
                {copyData.subject_lines[copyData.selected_subject]}
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold text-white mb-2">Preview Text:</h2>
              <div className="text-white">
                {copyData.preview_text[copyData.selected_preview]}
              </div>
            </div>
          </div>

          {/* Email Content Blocks */}
          <div className="p-6">
            <h2 className="font-semibold text-white mb-4">Email Content:</h2>
            
            <div className="border border-dark-600 rounded-lg overflow-hidden">
              {(isEditing ? editedCopyData : copyData)?.email_blocks.map((block, index) => (
                <div
                  key={index}
                  className={`flex border-b border-dark-700/50 last:border-b-0 ${index % 2 === 0 ? 'bg-dark-800/50 backdrop-blur-xl border border-dark-700/50' : 'bg-dark-700/30'}`}
                >
                  <div className="w-32 p-4 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm uppercase">
                    {isEditing ? (
                      <select
                        value={block.type}
                        onChange={(e) => {
                          if (!editedCopyData) return;
                          const newBlocks = [...editedCopyData.email_blocks];
                          newBlocks[index] = { ...block, type: e.target.value as any };
                          setEditedCopyData({ ...editedCopyData, email_blocks: newBlocks });
                        }}
                        className="text-xs bg-transparent border-0 focus:ring-0 font-semibold text-white uppercase w-full"
                      >
                        <option value="header">HEADER</option>
                        <option value="subheader">SUBHEADER</option>
                        <option value="body">BODY</option>
                        <option value="pic">PIC</option>
                        <option value="cta">CTA</option>
                        <option value="product">PRODUCT</option>
                      </select>
                    ) : (
                      block.type
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    {isEditing ? renderEditableBlockContent(block, index) : renderBlockContent(block)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Options */}
          {!isReadonly && (
            <div className="p-6 border-t border-dark-700/50 bg-dark-700/30">
              <h3 className="font-medium text-white mb-3">Alternative Options</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Subject Lines:</h4>
                  <div className="space-y-1">
                    {copyData.subject_lines.map((subject, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          index === copyData.selected_subject
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-white'
                        }`}
                      >
                        {index === copyData.selected_subject && '✓ '}{subject}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Preview Text:</h4>
                  <div className="space-y-1">
                    {copyData.preview_text.map((preview, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          index === copyData.selected_preview
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-white'
                        }`}
                      >
                        {index === copyData.selected_preview && '✓ '}{preview}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-dark-700/50 bg-dark-700/30 text-center">
            <p className="text-xs text-gray-400">
              Generated by CopyBot on {new Date(copyData.created_at).toLocaleDateString()} • 
              <span className="ml-1 text-purple-400">copybot.yourcompany.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}