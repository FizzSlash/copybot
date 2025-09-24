'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Download, ArrowLeft, Eye, Edit } from 'lucide-react';

interface EmailBlock {
  type: 'header' | 'subheader' | 'body' | 'pic' | 'cta' | 'product';
  content: string;
  description?: string;
  cta?: string;
  link?: string;
}

interface FlowEmail {
  emailNumber: number;
  day: number;
  theme: string;
  copyData: {
    subject_lines: string[];
    preview_text: string[];
    email_blocks: EmailBlock[];
  };
  hasOffer: boolean;
}

interface SavedFlow {
  id: string;
  flow_name: string;
  client: string;
  flow_type: string;
  email_count: number;
  offer: string;
  emails: FlowEmail[];
  created_at: string;
}

export default function FlowView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const flowId = params.id as string;
  const isReadonly = searchParams.get('readonly') === 'true';
  
  const [flowData, setFlowData] = useState<SavedFlow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEmailIndex, setActiveEmailIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  useEffect(() => {
    loadFlowData();
  }, [flowId]);

  const loadFlowData = async () => {
    try {
      console.log('🔍 FLOW VIEW: Loading flow data for:', flowId);
      
      const response = await fetch(`/api/flows/copy/${flowId}`);
      if (response.ok) {
        const data = await response.json();
        setFlowData(data);
        console.log('✅ FLOW VIEW: Flow data loaded:', data);
      } else {
        throw new Error('Failed to load flow data');
      }
    } catch (error) {
      console.error('❌ FLOW VIEW: Error loading flow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBlockContent = (block: EmailBlock) => {
    switch (block.type) {
      case 'product':
        return (
          <div>
            <div className="font-semibold text-gray-900 mb-1">{block.content}</div>
            {block.description && (
              <div className="text-gray-600 text-sm mb-2">{block.description}</div>
            )}
            {block.cta && (
              <div className="text-blue-600 text-sm font-medium">{block.cta}</div>
            )}
            {block.link && (
              <div className="text-gray-500 text-xs mt-1">{block.link}</div>
            )}
          </div>
        );
      case 'cta':
        return (
          <div>
            <div className="text-blue-600 font-medium">{block.content}</div>
            {block.link && (
              <div className="text-gray-500 text-xs mt-1">{block.link}</div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flow...</p>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Flow Not Found</h1>
          <p className="text-gray-600 mb-4">This flow link may be invalid or expired.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeEmail = flowData.emails[activeEmailIndex];
  
  // Handle emails that might not have complete copyData
  const hasCompleteData = activeEmail?.copyData?.subject_lines && activeEmail?.copyData?.email_blocks;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isReadonly && (
                <Link href="/dashboard/campaigns/saved" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{flowData.flow_name}</h1>
                <p className="text-sm text-gray-600">
                  {flowData.client} • {flowData.email_count} emails • 
                  <span className="ml-1 uppercase text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {flowData.flow_type}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isReadonly && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      viewMode === 'preview' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      viewMode === 'edit' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                </div>
              )}
              
              <button className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              
              <button 
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-1">
            {flowData.emails.map((email, index) => (
              <button
                key={index}
                onClick={() => setActiveEmailIndex(index)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeEmailIndex === index 
                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <div>Email {email.emailNumber}</div>
                <div className="text-xs text-gray-500">Day {email.day}</div>
                {email.hasOffer && <span className="text-green-600 text-xs">🎁</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Email Headers */}
          <div className="p-6 border-b border-gray-200">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{activeEmail.theme}</h2>
              <div className="text-sm text-gray-500">
                Day {activeEmail.day} • 
                {activeEmail.hasOffer ? ' 🎁 Includes Offer' : ' No Offer'}
                {!hasCompleteData && (
                  <span className="ml-2 text-orange-600">⚠️ Email content not yet generated</span>
                )}
              </div>
            </div>
            
            {hasCompleteData ? (
              viewMode === 'preview' ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Subject Line:</h3>
                    <div className="text-lg font-medium text-gray-800">
                      {activeEmail.copyData.subject_lines[0]}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Preview Text:</h3>
                    <div className="text-gray-600">
                      {activeEmail.copyData.preview_text[0]}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Subject Lines:</h3>
                    <div className="space-y-2">
                      {activeEmail.copyData.subject_lines.map((subject, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="radio" name="subject" defaultChecked={index === 0} className="text-blue-600" />
                          <input
                            type="text"
                            value={subject}
                            onChange={() => {/* TODO: Update subject */}}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Preview Text:</h3>
                    <div className="space-y-2">
                      {activeEmail.copyData.preview_text.map((preview, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="radio" name="preview" defaultChecked={index === 0} className="text-blue-600" />
                          <input
                            type="text"
                            value={preview}
                            onChange={() => {/* TODO: Update preview */}}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-orange-800 text-sm">
                  ⚠️ This email is part of the flow strategy but content hasn't been generated yet.
                </div>
              </div>
            )}
          </div>

          {/* Email Content Blocks */}
          {hasCompleteData && (
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Email Content:</h3>
              
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {activeEmail.copyData.email_blocks.map((block, index) => (
                  <div
                    key={index}
                    className={`flex border-b border-gray-200 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div className="w-32 p-4 bg-gray-100 border-r border-gray-200 font-semibold text-amber-200 text-sm uppercase">
                      {block.type}
                    </div>
                    <div className="flex-1 p-4">
                      {renderBlockContent(block)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flow Info Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              {flowData.flow_type.toUpperCase()} FLOW • Email {activeEmail.emailNumber} of {flowData.email_count} • 
              Generated by CopyBot on {new Date(flowData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}