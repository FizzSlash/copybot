'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, Loader, Download, Share, Globe, Brain, FileText, CheckCircle, Edit3, Copy, Eye, Edit, GripVertical } from 'lucide-react';
import { useNotifications } from '@/components/NotificationSystem';

interface CampaignContext {
  airtableId: string;
  campaignName: string;
  client: string;
  sendDate: string;
  notes: string;
  stage: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  brand_questionnaire: any;
  website_url?: string;
}

interface GenerationRequest {
  copy_type: 'promotional' | 'educational';
  tone?: 'designed' | 'plain';
  length?: 'short' | 'medium' | 'long';
  focus?: string;
  additional_context?: string;
}

interface CampaignStrategy {
  campaignType: 'promotional' | 'educational';
  primaryGoal: string;
  targetAudience: string;
  contentBlocks: {
    type: 'hero' | 'testimonials' | 'collection' | 'product' | 'social-proof' | 'urgency' | 'contact' | 'offer' | 'story' | 'education';
    description: string;
    count?: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

interface EmailBlock {
  type: 'header' | 'subheader' | 'body' | 'pic' | 'cta' | 'product' | 'collection';
  content: string;
  title?: string;
  description?: string;
  link?: string;
  cta?: string;
  // Collection-specific properties
  layout?: 'grid-2x2' | 'grid-3x1' | 'grid-2x3' | 'carousel';
  products?: {
    title: string;
    description: string;
    image_instruction: string;
    cta: string;
    link: string;
  }[];
}

interface GeneratedCopy {
  subject_lines: string[];
  preview_text: string[];
  email_blocks: EmailBlock[];
}

interface ABTestVariant {
  id: string;
  name: string;
  subject_lines: string[];
  preview_text: string[];
  email_blocks: EmailBlock[];
}

const COPY_TYPES = [
  { id: 'promotional', name: 'Promotional', description: 'Sales and promotional campaigns' },
  { id: 'educational', name: 'Educational', description: 'Informational content and guides' }
];

const COPY_FORMATS = [
  { id: 'designed', name: 'Designed (blocks)', description: 'Structured email with multiple sections' },
  { id: 'plain', name: 'Plain Text', description: 'Simple text-based email' }
];

const EMAIL_LENGTHS = [
  { id: 'short', name: 'Short Email', description: '5-8 blocks' },
  { id: 'medium', name: 'Medium Email', description: '8-12 blocks' },
  { id: 'long', name: 'Long Email', description: '12-15 blocks' }
];

const GENERATION_STEPS = [
  { id: 'setup', name: 'Campaign Setup', description: 'Loading campaign and client data', icon: Globe },
  { id: 'context', name: 'Context Building', description: 'Assembling brand guidelines and notes', icon: Brain },
  { id: 'generate', name: 'Copy Generation', description: 'Creating personalized email copy', icon: Zap },
  { id: 'document', name: 'Google Doc Creation', description: 'Formatting and sharing copy', icon: FileText },
  { id: 'sync', name: 'Airtable Sync', description: 'Updating copy link in Airtable', icon: CheckCircle }
];

// Email Preview Component - Table Structure
function EmailPreview({ copy, selectedSubject, selectedPreview }: {
  copy: GeneratedCopy;
  selectedSubject: number;
  selectedPreview: number;
}) {
  if (!copy) return null;

  const renderBlockContent = (block: EmailBlock) => {
    switch (block.type) {
      case 'product':
        return (
          <div>
            <div className="font-semibold text-white mb-1">{block.content}</div>
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
      default:
        return <div>{block.content}</div>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Email Headers */}
      <div className="mb-6">
        <div className="text-lg font-semibold text-white mb-2">
          Subject Line: {copy.subject_lines?.[selectedSubject] || copy.subject_lines?.[0] || 'No subject line'}
        </div>
        <div className="text-gray-600">
          Preview text: {copy.preview_text?.[selectedPreview] || copy.preview_text?.[0] || 'No preview text'}
        </div>
      </div>

      {/* Email Content Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {copy.email_blocks?.map((block, index) => (
          <div key={index} className={`flex border-b border-dark-700/50 ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'} last:border-b-0`}>
            <div className="w-32 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm uppercase">
              {block.type}
            </div>
            <div className="flex-1 p-3 text-sm">
              {renderBlockContent(block)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerateAirtableCopyPageContent() {
  const searchParams = useSearchParams();
  const [campaignContext, setCampaignContext] = useState<CampaignContext | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [editedCopy, setEditedCopy] = useState<GeneratedCopy | null>(null);
  const [abTestVariants, setAbTestVariants] = useState<ABTestVariant[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // AI Revision states
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  
  // Campaign Strategy states
  const [campaignStrategy, setCampaignStrategy] = useState<CampaignStrategy | null>(null);
  const [showStrategyConfig, setShowStrategyConfig] = useState(false);
  const [activeVariant, setActiveVariant] = useState<'original' | string>('original');
  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  
  // Selected options
  const [selectedSubject, setSelectedSubject] = useState(0);
  const [selectedPreview, setSelectedPreview] = useState(0);
  
  // UI states
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [allClients, setAllClients] = useState<any[] | null>(null);
  
  // Notifications
  const { showSuccess, showError, showInfo, NotificationSystem } = useNotifications();

  const [generationRequest, setGenerationRequest] = useState<GenerationRequest>({
    copy_type: 'promotional',
    tone: 'designed',
    length: 'medium',
    focus: '',
    additional_context: ''
  });

  useEffect(() => {
    // Load campaign context from URL parameters
    const context: CampaignContext = {
      airtableId: searchParams.get('airtableId') || '',
      campaignName: searchParams.get('campaignName') || '',
      client: searchParams.get('client') || '',
      sendDate: searchParams.get('sendDate') || '',
      notes: searchParams.get('notes') || '',
      stage: searchParams.get('stage') || ''
    };
    
    setCampaignContext(context);
    console.log('🔄 COPY GEN: Campaign context loaded:', context);
    
    // Load client data
    loadClientData(context.client);
  }, [searchParams]);

  const loadClientData = async (clientName: string) => {
    try {
      console.log('🔄 COPY GEN: Loading client data for:', clientName);
      
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clientsResponse = await response.json();
        const clients = clientsResponse.data || clientsResponse; // Handle nested data structure
        console.log('✅ COPY GEN: Full client response:', clientsResponse);
        console.log('✅ COPY GEN: Loaded clients array:', clients?.length);
        setAllClients(clients); // Store all clients for dropdown
        
        const matchingClient = clients.find((c: Client) => 
          c.name?.toLowerCase() === clientName?.toLowerCase() ||
          c.company?.toLowerCase() === clientName?.toLowerCase() ||
          clientName?.toLowerCase().includes(c.name?.toLowerCase() || '') ||
          clientName?.toLowerCase().includes(c.company?.toLowerCase() || '')
        );
        
        if (matchingClient) {
          setClient(matchingClient);
          console.log('✅ COPY GEN: Found matching client:', matchingClient.name);
        } else {
          console.log('⚠️ COPY GEN: No matching client found, will use basic context');
          setClient(null);
        }
      } else {
        console.error('❌ COPY GEN: Failed to fetch clients:', response.status);
        setAllClients([]);
      }
    } catch (error) {
      console.error('❌ COPY GEN: Error loading client data:', error);
      setAllClients([]);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCopy = async () => {
    if (!campaignContext) return;
    
    setIsGenerating(true);
    setCurrentStep('setup');
    
    try {
      console.log('🧠 COPY GEN: Building context...');
      setCurrentStep('context');
      
      // Scrape website for real product data if available
      let scrapedContent = null;
      if (client?.website_url) {
        try {
          console.log('🔍 COPY GEN: Scraping website for product data...');
          const scrapeResponse = await fetch('/api/scrape-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: client.website_url,
              focus: 'products and specifications'
            })
          });
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            scrapedContent = scrapeData.content;
            console.log('✅ COPY GEN: Website data scraped successfully');
          }
        } catch (scrapeError) {
          console.log('⚠️ COPY GEN: Website scraping failed, proceeding without real-time data');
        }
      }
      
      const context = {
        campaign: {
          name: campaignContext.campaignName,
          client: campaignContext.client,
          sendDate: campaignContext.sendDate,
          notes: `${campaignContext.notes}${campaignStrategy ? `\n\nCAMPAIGN STRATEGY:\nGoal: ${campaignStrategy.primaryGoal}\nAudience: ${campaignStrategy.targetAudience}\n\nCONTENT BLOCKS STRATEGY:\n${campaignStrategy.contentBlocks.map(block => `- ${block.type.toUpperCase()}: ${block.description}${block.count ? ` (${block.count} items)` : ''} [${block.priority} priority]`).join('\n')}` : ''}`,
          stage: campaignContext.stage
        },
        client: client ? {
          name: client.name,
          company: client.company,
          website: client.website_url,
          brandGuidelines: client.brand_questionnaire
        } : null,
        scrapedContent: scrapedContent,
        generationRequest
      };
      
      console.log('🤖 COPY GEN: Generating copy with Claude...');
      setCurrentStep('generate');
      
      const copyResponse = await fetch('/api/generate-copy-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_context: JSON.stringify(context),
          copy_type: generationRequest.copy_type,
          tone: generationRequest.tone,
          length: generationRequest.length,
          focus: generationRequest.focus,
          additional_context: generationRequest.additional_context,
          scraped_content: scrapedContent
        })
      });

      if (copyResponse.ok) {
        const copyData = await copyResponse.json();
        console.log('📊 COPY GEN: Received copy data:', copyData.data);
        
        // Clean the data to ensure arrays
        const cleanedData = {
          subject_lines: Array.isArray(copyData.data.subject_lines) ? copyData.data.subject_lines : [copyData.data.subject_lines || 'Generated Subject'],
          preview_text: Array.isArray(copyData.data.preview_text) ? copyData.data.preview_text : [copyData.data.preview_text || 'Generated Preview'],
          email_blocks: Array.isArray(copyData.data.email_blocks) ? copyData.data.email_blocks : []
        };
        
        console.log('✅ COPY GEN: Cleaned copy data:', cleanedData);
        
        setGeneratedCopy(cleanedData);
        setEditedCopy(cleanedData);
        console.log('✅ COPY GEN: Copy generated successfully');
      } else {
        const errorData = await copyResponse.json();
        console.error('❌ COPY GEN: API error response:', errorData);
        throw new Error('Failed to generate copy');
      }
    } catch (error) {
      console.error('💥 COPY GEN: Error generating copy:', error);
      console.error('🔍 COPY GEN: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        type: typeof error
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
      console.log('🏁 COPY GEN: Generation completed');
    }
  };

  // AI Revision handler for campaigns
  const handleCopyRevision = async () => {
    if (!revisionText.trim() || !editedCopy || !campaignContext) return;
    
    setIsRegenerating(true);
    setShowRevisionPrompt(false);
    
    try {
      console.log('🔄 CAMPAIGN REVISION: Revising copy with feedback:', revisionText);
      
      const revisionResponse = await fetch('/api/generate-copy-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_context: JSON.stringify({
            campaign: {
              name: campaignContext.campaignName,
              client: campaignContext.client,
              sendDate: campaignContext.sendDate,
              notes: `${campaignContext.notes}${campaignStrategy ? `\n\nCAMPAIGN STRATEGY:\nGoal: ${campaignStrategy.primaryGoal}\nAudience: ${campaignStrategy.targetAudience}\n\nCONTENT BLOCKS STRATEGY:\n${campaignStrategy.contentBlocks.map(block => `- ${block.type.toUpperCase()}: ${block.description}${block.count ? ` (${block.count} items)` : ''} [${block.priority} priority]`).join('\n')}` : ''}`,
              stage: campaignContext.stage
            },
            client: client ? {
              name: client.name,
              company: client.company,
              website: client.website_url,
              brandGuidelines: client.brand_questionnaire
            } : null
          }),
          copy_type: generationRequest.copy_type,
          tone: generationRequest.tone,
          length: generationRequest.length,
          focus: generationRequest.focus,
          additional_context: generationRequest.additional_context,
          revision_feedback: revisionText,
          current_copy: editedCopy,
          feedback_mode: true
        }),
      });

      if (!revisionResponse.ok) {
        throw new Error('Failed to generate revised copy');
      }

      const revisedCopy = await revisionResponse.json();
      console.log('✅ CAMPAIGN REVISION: Copy revised successfully');
      
      // Validate response structure
      if (!revisedCopy.subject_lines || !revisedCopy.preview_text || !revisedCopy.email_blocks) {
        throw new Error('Invalid response structure from AI revision');
      }
      
      setEditedCopy(revisedCopy);
      setRevisionText('');
      
      console.log('✅ CAMPAIGN REVISION: Copy updated successfully');
    } catch (error) {
      console.error('❌ CAMPAIGN REVISION: Error:', error);
      setShowRevisionPrompt(true);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;
    
    const currentCopy = activeVariant === 'original' ? editedCopy : abTestVariants.find(v => v.id === activeVariant);
    if (!currentCopy) return;
    
    const newBlocks = [...currentCopy.email_blocks];
    const draggedBlock = newBlocks[draggedIndex];
    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlock);
    
    if (activeVariant === 'original') {
      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
    } else {
      setAbTestVariants(prev => prev.map(v => 
        v.id === activeVariant ? { ...v, email_blocks: newBlocks } : v
      ));
    }
    
    setDraggedIndex(null);
  };

  const finalizeCopy = async () => {
    if (!editedCopy || !campaignContext) return;
    
    setIsGenerating(true);
    setCurrentStep('finalize');
    
    try {
      console.log('🔄 COPY GEN: Finalizing copy...');
        console.log('📊 COPY GEN: Selected subject:', editedCopy.subject_lines?.[selectedSubject]);
        console.log('📊 COPY GEN: Selected preview:', editedCopy.preview_text?.[selectedPreview]);
      console.log('📊 COPY GEN: Email blocks:', editedCopy.email_blocks?.length);
      
      const finalizeResponse = await fetch('/api/finalize-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copyData: editedCopy,
          campaignInfo: campaignContext,
          selectedSubject: selectedSubject,
          selectedPreview: selectedPreview
        })
      });

      if (finalizeResponse.ok) {
        const result = await finalizeResponse.json();
        console.log('✅ COPY GEN: Copy finalized successfully!');
        setGoogleDocUrl(result.shareableUrl);
        setShowFinalizeConfirm(false);
        
        // Copy link to clipboard
        navigator.clipboard.writeText(result.shareableUrl);
        
        // Show branded success notification
        showSuccess(
          '🎉 Copy Finalized Successfully!',
          `Stage updated to "Design QA" • Link copied to clipboard`,
          {
            label: 'Open Shareable Link',
            onClick: () => window.open(result.shareableUrl, '_blank')
          }
        );
      } else {
        throw new Error('Failed to finalize copy');
      }
    } catch (error) {
      console.error('❌ COPY GEN: Error finalizing copy:', error);
      showError('Finalization Failed', 'Unable to finalize copy. Please try again.');
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaignContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Campaign not found</p>
          <Link href="/dashboard/airtable-test" className="text-blue-600 hover:text-blue-700">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="flex h-screen">
        {/* Left Column - Settings & Campaign Info */}
        <div className="w-96 bg-dark-800/50 backdrop-blur-xl border-r border-dark-700/50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/airtable-test"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white leading-tight">{campaignContext.campaignName}</h1>
                <p className="text-sm text-gray-600">{campaignContext.client}</p>
              </div>
            </div>

            {/* Campaign Context */}
            <div className="border border-dark-700/50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Campaign Details</h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-gray-300">Client:</span>
                  <span className="ml-2 text-white">{campaignContext.client}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Send Date:</span>
                  <span className="ml-2 text-white">{campaignContext.sendDate}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Current Stage:</span>
                  <span className="ml-2 text-white">{campaignContext.stage || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Client in CopyBot:</span>
                  {client ? (
                    <span className="ml-2 text-green-600">
                      ✅ {client.name} ({client.company}) {client.website_url && '🌐'}
                    </span>
                  ) : (
                    <div className="mt-2">
                      <span className="ml-2 text-orange-600 block mb-2">⚠️ Auto-detection failed - select manually:</span>
                      <select
                        value={selectedClientId || ''}
                        onChange={(e) => {
                          const clientId = e.target.value;
                          setSelectedClientId(clientId);
                          if (clientId && allClients) {
                            const foundClient = allClients.find((c: any) => c.id === clientId);
                            setClient(foundClient || null);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Select a client...</option>
                        {allClients && Array.isArray(allClients) ? allClients.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.company || c.name} {c.website_url ? '(🌐 has website)' : '(no website)'}
                          </option>
                        )) : (
                          <option disabled>Loading clients...</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              {campaignContext.notes && (
                <div className="mt-3">
                  <span className="font-medium text-gray-300">Campaign Notes:</span>
                  <p className="mt-1 text-white text-xs bg-dark-700/30 p-2 rounded">{campaignContext.notes}</p>
                </div>
              )}
            </div>

            {/* Generation Form */}
            <div className="border border-dark-700/50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Copy Generation Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Campaign Type</label>
                  <select
                    value={generationRequest.copy_type}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, copy_type: e.target.value as any }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COPY_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Copy Format</label>
                  <select
                    value={generationRequest.tone}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, tone: e.target.value as any }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COPY_FORMATS.map(format => (
                      <option key={format.id} value={format.id}>
                        {format.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Email Length</label>
                  <select
                    value={generationRequest.length}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, length: e.target.value as any }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {EMAIL_LENGTHS.map(length => (
                      <option key={length.id} value={length.id}>
                        {length.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Additional Context</label>
                  <textarea
                    value={generationRequest.additional_context}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, additional_context: e.target.value }))}
                    placeholder="Products, offers, athletes, results..."
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="text-xs text-gray-500 bg-dark-700/30 p-2 rounded">
                  <div className="font-medium mb-1">Auto-populated:</div>
                  <div>• Tone & brand voice from client brief</div>
                  <div>• Focus from campaign notes</div>
                  <div>• {client?.website_url ? '✅ Website will be scraped for real product data' : '⚠️ No website - using general themes only'}</div>
                </div>

                {/* Campaign Strategy Configuration */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">Content Strategy</h3>
                    <button
                      onClick={() => setShowStrategyConfig(!showStrategyConfig)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {showStrategyConfig ? 'Hide' : 'Configure'} Strategy
                    </button>
                  </div>
                  
                  {showStrategyConfig && (
                    <div className="space-y-4 p-4 bg-dark-700/30 rounded-lg border border-dark-600">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-2">Primary Goal</label>
                        <input
                          type="text"
                          value={campaignStrategy?.primaryGoal || ''}
                          onChange={(e) => setCampaignStrategy(prev => ({ 
                            ...prev, 
                            campaignType: prev?.campaignType || 'promotional',
                            targetAudience: prev?.targetAudience || '',
                            contentBlocks: prev?.contentBlocks || [],
                            primaryGoal: e.target.value 
                          }))}
                          placeholder="e.g., Drive holiday sales, Launch new product, Build brand awareness"
                          className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-2">Target Audience</label>
                        <input
                          type="text"
                          value={campaignStrategy?.targetAudience || ''}
                          onChange={(e) => setCampaignStrategy(prev => ({ 
                            ...prev, 
                            campaignType: prev?.campaignType || 'promotional',
                            primaryGoal: prev?.primaryGoal || '',
                            contentBlocks: prev?.contentBlocks || [],
                            targetAudience: e.target.value 
                          }))}
                          placeholder="e.g., Existing customers, New prospects, Returning visitors"
                          className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-white"
                        />
                      </div>

                      {/* Content Blocks Editor */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-300">Content Blocks</label>
                          <button
                            onClick={() => {
                              const currentBlocks = campaignStrategy?.contentBlocks || [];
                              setCampaignStrategy(prev => ({ 
                                ...prev, 
                                campaignType: prev?.campaignType || 'promotional',
                                primaryGoal: prev?.primaryGoal || '',
                                targetAudience: prev?.targetAudience || '',
                                contentBlocks: [...currentBlocks, {
                                  type: 'hero',
                                  description: 'New content block',
                                  priority: 'medium'
                                }]
                              }));
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            + Add Block
                          </button>
                        </div>
                        
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {(campaignStrategy?.contentBlocks || []).map((block, blockIndex) => (
                            <div key={blockIndex} className="flex items-center space-x-2 text-xs">
                              <select
                                value={block.type}
                                onChange={(e) => {
                                  const currentBlocks = [...(campaignStrategy?.contentBlocks || [])];
                                  currentBlocks[blockIndex] = { ...block, type: e.target.value as any };
                                  setCampaignStrategy(prev => ({ ...prev!, contentBlocks: currentBlocks }));
                                }}
                                className="bg-dark-800 border border-dark-600 rounded px-1 py-0.5 text-white"
                              >
                                <option value="hero">Hero</option>
                                <option value="testimonials">Testimonials</option>
                                <option value="collection">Collection</option>
                                <option value="product">Product</option>
                                <option value="social-proof">Social Proof</option>
                                <option value="urgency">Urgency</option>
                                <option value="contact">Contact</option>
                                <option value="offer">Offer</option>
                                <option value="story">Story</option>
                                <option value="education">Education</option>
                              </select>
                              
                              <input
                                type="text"
                                placeholder="Description..."
                                value={block.description}
                                onChange={(e) => {
                                  const currentBlocks = [...(campaignStrategy?.contentBlocks || [])];
                                  currentBlocks[blockIndex] = { ...block, description: e.target.value };
                                  setCampaignStrategy(prev => ({ ...prev!, contentBlocks: currentBlocks }));
                                }}
                                className="flex-1 px-1 py-0.5 bg-dark-800 border border-dark-600 rounded text-white"
                              />
                              
                              {(['testimonials', 'product', 'social-proof'].includes(block.type)) && (
                                <input
                                  type="number"
                                  placeholder="#"
                                  value={block.count || ''}
                                  onChange={(e) => {
                                    const currentBlocks = [...(campaignStrategy?.contentBlocks || [])];
                                    currentBlocks[blockIndex] = { ...block, count: parseInt(e.target.value) || undefined };
                                    setCampaignStrategy(prev => ({ ...prev!, contentBlocks: currentBlocks }));
                                  }}
                                  className="w-12 px-1 py-0.5 bg-dark-800 border border-dark-600 rounded text-white"
                                  min="1"
                                  max="10"
                                />
                              )}
                              
                              <button
                                onClick={() => {
                                  const currentBlocks = campaignStrategy?.contentBlocks || [];
                                  setCampaignStrategy(prev => ({ 
                                    ...prev!, 
                                    contentBlocks: currentBlocks.filter((_, i) => i !== blockIndex)
                                  }));
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Generate Button */}
            {!isGenerating && !editedCopy && (
              <button
                onClick={generateCopy}
                disabled={isGenerating}
                className="w-full bg-purple-gradient hover:opacity-90 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-opacity shadow-lg"
              >
                Generate Email Copy
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Copy Editor/Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Generation Progress */}
          {isGenerating && (
            <div className="p-6 bg-dark-800/50 backdrop-blur-xl border-b border-dark-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Generating Copy...</h2>
              <div className="space-y-3">
                {GENERATION_STEPS.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = GENERATION_STEPS.findIndex(s => s.id === currentStep) > index;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className={`flex items-center space-x-3 p-2 rounded ${
                      isActive ? 'bg-blue-50' : isCompleted ? 'bg-green-50' : 'bg-dark-700/30'
                    }`}>
                      <div className={`flex-shrink-0 ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {isActive ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${
                          isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-300'
                        }`}>
                          {step.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Copy Editor Interface */}
          {editedCopy && !isGenerating && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header with View Toggle */}
              <div className="p-6 border-b border-dark-700/50 bg-dark-800/50 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-white">Email Copy</h2>
                    <div className="flex items-center bg-dark-600 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors flex items-center space-x-1 ${
                          viewMode === 'preview' ? 'bg-purple-gradient text-white shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors flex items-center space-x-1 ${
                          viewMode === 'edit' ? 'bg-purple-gradient text-white shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Blocks</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowRevisionPrompt(true)}
                      disabled={isRegenerating}
                      className="px-3 py-2 bg-purple-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isRegenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Revising...</span>
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4" />
                          <span>Revise with AI</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowFinalizeConfirm(true)}
                      disabled={isGenerating}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                    >
                      {isGenerating && currentStep === 'finalize' ? (
                        <>📄 Creating Google Doc...</>
                      ) : (
                        <>📄 Finalize Copy</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === 'preview' ? (
                  /* Preview Mode */
                  <EmailPreview 
                    copy={editedCopy}
                    selectedSubject={selectedSubject}
                    selectedPreview={selectedPreview}
                  />
                ) : (
                  /* Edit Mode - Table Format */
                  <div className="p-6 max-w-4xl mx-auto">
                    {/* Subject Lines */}
                    <div className="mb-6">
                      <h3 className="font-medium text-white mb-3">Subject Lines</h3>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {editedCopy.subject_lines?.map((subject, index) => (
                          <div key={index} className={`flex border-b border-dark-700/50 last:border-b-0 ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'}`}>
                            <div className="w-20 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm flex items-center">
                              <input
                                type="radio"
                                name="subject"
                                checked={selectedSubject === index}
                                onChange={() => setSelectedSubject(index)}
                                className="text-blue-600"
                              />
                            </div>
                            <div className="flex-1 p-0">
                              <input
                                type="text"
                                value={subject}
                                onChange={(e) => {
                                  const newSubjects = [...editedCopy.subject_lines];
                                  newSubjects[index] = e.target.value;
                                  setEditedCopy(prev => prev ? { ...prev, subject_lines: newSubjects } : null);
                                }}
                                className="w-full h-full px-3 py-3 border-0 focus:ring-0 text-sm bg-transparent"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preview Text */}
                    <div className="mb-6">
                      <h3 className="font-medium text-white mb-3">Preview Text</h3>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {editedCopy.preview_text?.map((preview, index) => (
                          <div key={index} className={`flex border-b border-dark-700/50 last:border-b-0 ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'}`}>
                            <div className="w-20 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm flex items-center">
                              <input
                                type="radio"
                                name="preview"
                                checked={selectedPreview === index}
                                onChange={() => setSelectedPreview(index)}
                                className="text-blue-600"
                              />
                            </div>
                            <div className="flex-1 p-0">
                              <input
                                type="text"
                                value={preview}
                                onChange={(e) => {
                                  const newPreviews = [...editedCopy.preview_text];
                                  newPreviews[index] = e.target.value;
                                  setEditedCopy(prev => prev ? { ...prev, preview_text: newPreviews } : null);
                                }}
                                className="w-full h-full px-3 py-3 border-0 focus:ring-0 text-sm bg-transparent"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Email Content Blocks - Table Format */}
                    <div>
                      <h3 className="font-medium text-white mb-3">Email Content Blocks</h3>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {editedCopy.email_blocks?.map((block, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(index)}
                            className={`flex border-b border-dark-700/50 last:border-b-0 cursor-move hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'}`}
                          >
                            <div className="w-32 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <select
                                  value={block.type}
                                  onChange={(e) => {
                                    const newBlocks = [...editedCopy.email_blocks];
                                    newBlocks[index] = { ...block, type: e.target.value as any };
                                    setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                  }}
                                  className="text-xs bg-transparent border-0 focus:ring-0 font-semibold text-gray-300 uppercase"
                                >
                                  <option value="header">HEADER</option>
                                  <option value="subheader">SUBHEADER</option>
                                  <option value="body">BODY</option>
                                  <option value="pic">PIC</option>
                                  <option value="cta">CTA</option>
                                  <option value="product">PRODUCT</option>
                                  <option value="collection">COLLECTION</option>
                                </select>
                              </div>
                              <button
                                onClick={() => {
                                  const newBlocks = editedCopy.email_blocks.filter((_, i) => i !== index);
                                  setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                }}
                                className="text-red-600 hover:text-red-800 text-xs mt-1"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="flex-1 p-3">
                              {block.type === 'pic' ? (
                                <div className="space-y-2">
                                  <textarea
                                    placeholder="Image instructions (e.g., 'Ask Timmy for race photos')"
                                    value={block.content || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, content: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    rows={2}
                                    className="w-full px-2 py-1 border border-amber-500/50 rounded text-sm bg-amber-500/20 text-amber-100 resize-none"
                                  />
                                </div>
                              ) : block.type === 'product' ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Product name..."
                                    value={block.content || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, content: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    className="w-full px-2 py-1 text-sm font-semibold bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
                                  />
                                  <textarea
                                    placeholder="Product description..."
                                    value={block.description || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, description: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    rows={2}
                                    className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0"
                                  />
                                  <input
                                    type="text"
                                    placeholder="CTA text..."
                                    value={block.cta || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, cta: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    className="w-full px-2 py-1 text-sm text-blue-600 font-medium bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
                                  />
                                  <input
                                    type="url"
                                    placeholder="Product URL..."
                                    value={block.link || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, link: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    className="w-full px-2 py-1 text-xs text-gray-500 bg-transparent border-0 focus:ring-0"
                                  />
                                </div>
                              ) : block.type === 'cta' ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="CTA text..."
                                    value={block.content || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, content: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    className="w-full px-2 py-1 text-sm text-blue-600 font-medium bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
                                  />
                                  <input
                                    type="url"
                                    placeholder="Link URL..."
                                    value={block.link || ''}
                                    onChange={(e) => {
                                      const newBlocks = [...editedCopy.email_blocks];
                                      newBlocks[index] = { ...block, link: e.target.value };
                                      setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                    }}
                                    className="w-full px-2 py-1 text-xs text-gray-500 bg-transparent border-0 focus:ring-0"
                                  />
                                </div>
                              ) : block.type === 'collection' ? (
                                <div className="space-y-4">
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Collection title..."
                                      value={block.content || ''}
                                      onChange={(e) => {
                                        const newBlocks = [...editedCopy.email_blocks];
                                        newBlocks[index] = { ...block, content: e.target.value };
                                        setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                      }}
                                      className="w-full px-2 py-1 text-sm font-semibold bg-transparent border-0 border-b border-dark-700/50 focus:ring-0 focus:border-blue-500"
                                    />
                                    <textarea
                                      placeholder="Collection description..."
                                      value={block.description || ''}
                                      onChange={(e) => {
                                        const newBlocks = [...editedCopy.email_blocks];
                                        newBlocks[index] = { ...block, description: e.target.value };
                                        setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                      }}
                                      rows={2}
                                      className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0 mt-2"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="text-xs text-gray-400 mb-2 block">Layout:</label>
                                    <select
                                      value={block.layout || 'grid-2x2'}
                                      onChange={(e) => {
                                        const newBlocks = [...editedCopy.email_blocks];
                                        newBlocks[index] = { ...block, layout: e.target.value as any };
                                        setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                      }}
                                      className="text-xs bg-dark-700 border border-dark-600 rounded px-2 py-1 text-white"
                                    >
                                      <option value="grid-2x2">2x2 Grid</option>
                                      <option value="grid-3x1">3x1 Row</option>
                                      <option value="grid-2x3">2x3 Grid</option>
                                      <option value="carousel">Carousel</option>
                                    </select>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-xs text-gray-400">Products ({(block.products || []).length}):</label>
                                      <button
                                        onClick={() => {
                                          const newBlocks = [...editedCopy.email_blocks];
                                          const currentProducts = block.products || [];
                                          newBlocks[index] = { 
                                            ...block, 
                                            products: [...currentProducts, {
                                              title: '',
                                              description: '',
                                              image_instruction: '',
                                              cta: '',
                                              link: ''
                                            }]
                                          };
                                          setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                      >
                                        + Add Product
                                      </button>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                      {(block.products || []).map((product, productIndex) => (
                                        <div key={productIndex} className="border border-dark-600 rounded p-3 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Product {productIndex + 1}</span>
                                            <button
                                              onClick={() => {
                                                const newBlocks = [...editedCopy.email_blocks];
                                                const currentProducts = block.products || [];
                                                newBlocks[index] = { 
                                                  ...block, 
                                                  products: currentProducts.filter((_, i) => i !== productIndex)
                                                };
                                                setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                              }}
                                              className="text-xs text-red-400 hover:text-red-300"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                          <input
                                            type="text"
                                            placeholder="Product name..."
                                            value={product.title}
                                            onChange={(e) => {
                                              const newBlocks = [...editedCopy.email_blocks];
                                              const currentProducts = [...(block.products || [])];
                                              currentProducts[productIndex] = { ...product, title: e.target.value };
                                              newBlocks[index] = { ...block, products: currentProducts };
                                              setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                            }}
                                            className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-white"
                                          />
                                          <textarea
                                            placeholder="Product description..."
                                            value={product.description}
                                            onChange={(e) => {
                                              const newBlocks = [...editedCopy.email_blocks];
                                              const currentProducts = [...(block.products || [])];
                                              currentProducts[productIndex] = { ...product, description: e.target.value };
                                              newBlocks[index] = { ...block, products: currentProducts };
                                              setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                            }}
                                            rows={2}
                                            className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-white resize-none"
                                          />
                                          <input
                                            type="text"
                                            placeholder="Image instructions..."
                                            value={product.image_instruction}
                                            onChange={(e) => {
                                              const newBlocks = [...editedCopy.email_blocks];
                                              const currentProducts = [...(block.products || [])];
                                              currentProducts[productIndex] = { ...product, image_instruction: e.target.value };
                                              newBlocks[index] = { ...block, products: currentProducts };
                                              setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                            }}
                                            className="w-full px-2 py-1 text-xs bg-amber-500/20 border border-amber-500/50 rounded text-amber-100"
                                          />
                                          <div className="grid grid-cols-2 gap-2">
                                            <input
                                              type="text"
                                              placeholder="CTA text..."
                                              value={product.cta}
                                              onChange={(e) => {
                                                const newBlocks = [...editedCopy.email_blocks];
                                                const currentProducts = [...(block.products || [])];
                                                currentProducts[productIndex] = { ...product, cta: e.target.value };
                                                newBlocks[index] = { ...block, products: currentProducts };
                                                setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                              }}
                                              className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-blue-400"
                                            />
                                            <input
                                              type="url"
                                              placeholder="Product URL..."
                                              value={product.link}
                                              onChange={(e) => {
                                                const newBlocks = [...editedCopy.email_blocks];
                                                const currentProducts = [...(block.products || [])];
                                                currentProducts[productIndex] = { ...product, link: e.target.value };
                                                newBlocks[index] = { ...block, products: currentProducts };
                                                setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                              }}
                                              className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-gray-400"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-dark-700">
                                    <label className="text-xs text-gray-400 mb-2 block">Collection CTA (optional):</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        placeholder="Collection CTA text..."
                                        value={block.cta || ''}
                                        onChange={(e) => {
                                          const newBlocks = [...editedCopy.email_blocks];
                                          newBlocks[index] = { ...block, cta: e.target.value };
                                          setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                        }}
                                        className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-blue-400"
                                      />
                                      <input
                                        type="url"
                                        placeholder="Collection URL..."
                                        value={block.link || ''}
                                        onChange={(e) => {
                                          const newBlocks = [...editedCopy.email_blocks];
                                          newBlocks[index] = { ...block, link: e.target.value };
                                          setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                        }}
                                        className="w-full px-2 py-1 text-xs bg-dark-800 border border-dark-600 rounded text-gray-400"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <textarea
                                  placeholder={`Enter ${block.type} content...`}
                                  value={block.content || ''}
                                  onChange={(e) => {
                                    const newBlocks = [...editedCopy.email_blocks];
                                    newBlocks[index] = { ...block, content: e.target.value };
                                    setEditedCopy(prev => prev ? { ...prev, email_blocks: newBlocks } : null);
                                  }}
                                  rows={block.type === 'header' ? 1 : block.type === 'subheader' ? 1 : 3}
                                  className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Add Block Row */}
                        <div className="flex bg-dark-700/30 border-t-2 border-dashed border-gray-300">
                          <div className="w-32 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm uppercase text-center">
                            NEW
                          </div>
                          <div className="flex-1 p-3">
                            <button
                              onClick={() => {
                                const newBlock: EmailBlock = {
                                  type: 'body',
                                  content: ''
                                };
                                setEditedCopy(prev => prev ? {
                                  ...prev,
                                  email_blocks: [...prev.email_blocks, newBlock]
                                } : null);
                              }}
                              className="w-full text-left text-gray-500 hover:text-gray-300 text-sm transition-colors"
                            >
                              + Add Content Block
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finalize Confirmation */}
          {showFinalizeConfirm && editedCopy && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6">
              <div className="bg-dark-800/50 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-white mb-4">Ready to Finalize?</h3>
                <p className="text-gray-600 mb-6">
                  This will create a Google Doc with your copy and update the Airtable record.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowFinalizeConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-300 hover:bg-dark-700/30"
                  >
                    Keep Editing
                  </button>
                  <button
                    onClick={finalizeCopy}
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {isGenerating && currentStep === 'finalize' ? (
                      'Creating Doc...'
                    ) : (
                      'Finalize & Share'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification System */}
          <NotificationSystem />

          {/* Empty State */}
          {!editedCopy && !isGenerating && (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="text-gray-400 mb-4">
                  <FileText className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to Generate Copy</h3>
                <p className="text-gray-600 mb-4">
                  Configure your settings on the left and click "Generate Email Copy" to create your campaign content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Revision Modal */}
      {showRevisionPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-dark-800 backdrop-blur-xl border border-dark-700 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Revise Copy with AI
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Tell the AI what you'd like to change about this email copy. Be specific about your requirements.
            </p>
            
            <textarea
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="e.g., 'I need 3 reviews instead of 1' or 'Add more urgency' or 'Focus on the premium products'"
              className="w-full p-3 border border-dark-600 rounded-lg bg-dark-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows={4}
            />
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowRevisionPrompt(false);
                  setRevisionText('');
                }}
                className="px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-600/50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCopyRevision}
                disabled={!revisionText.trim() || isRegenerating}
                className="px-4 py-2 bg-purple-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isRegenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Revising...</span>
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    <span>Revise Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function GenerateAirtableCopyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-dark-800 via-dark-900 to-purple-900/20">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading campaign generator...</p>
          </div>
        </div>
      </div>
    }>
      <GenerateAirtableCopyPageContent />
    </Suspense>
  );
}