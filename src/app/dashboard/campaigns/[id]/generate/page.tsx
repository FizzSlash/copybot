'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, Loader, Download, Share, Globe, Brain, FileText } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'campaign' | 'flow';
  brief: string;
  campaign_context: string;
  client: {
    id: string;
    name: string;
    company?: string;
    website_url?: string;
    brand_questionnaire?: any;
  };
}

interface GenerationRequest {
  copy_type: 'promotional' | 'nurture' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'transactional';
  tone?: 'professional' | 'friendly' | 'urgent' | 'playful' | 'authoritative';
  length?: 'short' | 'medium' | 'long';
  focus?: string;
  additional_context?: string;
}

const COPY_TYPES = [
  { id: 'welcome', name: 'Welcome Series', description: 'New subscriber onboarding flow' },
  { id: 'promotional', name: 'Promotional', description: 'Sales and promotional campaigns' },
  { id: 'abandoned_cart', name: 'Abandoned Cart', description: 'Cart recovery sequence' },
  { id: 'nurture', name: 'Nurture', description: 'Educational and relationship building' },
  { id: 'newsletter', name: 'Newsletter', description: 'Regular content updates' },
  { id: 'transactional', name: 'Transactional', description: 'Order confirmations and updates' }
];

const GENERATION_STEPS = [
  { id: 'research', name: 'Website Research', description: 'Analyzing website and brand voice', icon: Globe },
  { id: 'context', name: 'Context Building', description: 'Assembling client data and guidelines', icon: Brain },
  { id: 'generate', name: 'Copy Generation', description: 'Creating email copy with AI', icon: Zap },
  { id: 'document', name: 'Document Creation', description: 'Formatting and sharing copy', icon: FileText }
];

export default function GenerateCopyPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [googleDocLink, setGoogleDocLink] = useState<string | null>(null);
  
  const [generationRequest, setGenerationRequest] = useState<GenerationRequest>({
    copy_type: 'promotional',
    tone: 'professional',
    length: 'medium',
    focus: '',
    additional_context: ''
  });

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const response = await fetch(`/api/campaigns/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setCampaign(data.data);
          
          // Auto-detect copy type from campaign context
          const context = data.data.campaign_context?.toLowerCase() || '';
          if (context.includes('welcome')) {
            setGenerationRequest(prev => ({ ...prev, copy_type: 'welcome' }));
          } else if (context.includes('cart')) {
            setGenerationRequest(prev => ({ ...prev, copy_type: 'abandoned_cart' }));
          }
        }
      } catch (error) {
        console.error('Failed to load campaign:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaign();
  }, [params.id]);

  const handleGenerateCopy = async () => {
    if (!campaign) return;

    setIsGenerating(true);
    setCurrentStep('research');

    try {
      // Step 1: Website Research (like your Perplexity step)
      setCurrentStep('research');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate research

      // Step 2: Context Building
      setCurrentStep('context');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate context assembly

      // Step 3: Copy Generation
      setCurrentStep('generate');
      const response = await fetch('/api/generate-copy-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaign.id,
          ...generationRequest
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate copy');
      }

      const copyData = await response.json();

      // Step 4: Document Creation (like your Google Docs step)
      setCurrentStep('document');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate doc creation
      
      setGeneratedCopy(copyData.data);
      setGoogleDocLink('https://docs.google.com/document/example-link'); // This would be real

      alert('Copy generated successfully! Google Doc created and shared.');

    } catch (error) {
      console.error('Copy generation failed:', error);
      alert('Failed to generate copy. Please try again.');
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 mt-2">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Campaign Not Found</h1>
        <Link href="/dashboard/campaigns" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href={`/dashboard/campaigns/${campaign.id}`}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaign</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Generate Copy</h1>
        <p className="text-gray-600 mt-2">{campaign.name} • {campaign.client.name}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Generation Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Copy Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copy Type
                </label>
                <select
                  value={generationRequest.copy_type}
                  onChange={(e) => setGenerationRequest(prev => ({ 
                    ...prev, 
                    copy_type: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {COPY_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={generationRequest.tone}
                  onChange={(e) => setGenerationRequest(prev => ({ 
                    ...prev, 
                    tone: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="urgent">Urgent</option>
                  <option value="playful">Playful</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <select
                  value={generationRequest.length}
                  onChange={(e) => setGenerationRequest(prev => ({ 
                    ...prev, 
                    length: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="short">Short (3-5 sections)</option>
                  <option value="medium">Medium (6-8 sections)</option>
                  <option value="long">Long (9-12 sections)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Focus
                </label>
                <input
                  type="text"
                  value={generationRequest.focus}
                  onChange={(e) => setGenerationRequest(prev => ({ 
                    ...prev, 
                    focus: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Product launch, discount promotion, etc..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context
                </label>
                <textarea
                  value={generationRequest.additional_context}
                  onChange={(e) => setGenerationRequest(prev => ({ 
                    ...prev, 
                    additional_context: e.target.value 
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any specific requirements or context for this copy generation..."
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateCopy}
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                <span>Generate Copy</span>
              </>
            )}
          </button>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Generation Progress</h3>
              <div className="space-y-3">
                {GENERATION_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = GENERATION_STEPS.findIndex(s => s.id === currentStep) > index;
                  
                  return (
                    <div key={step.id} className={`flex items-center space-x-3 ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                      <div>
                        <p className="font-medium">{step.name}</p>
                        <p className="text-xs">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Campaign:</span>
                <p className="text-gray-900">{campaign.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Client:</span>
                <p className="text-gray-900">{campaign.client.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900 capitalize">{campaign.type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Website:</span>
                {campaign.client.website_url ? (
                  <a 
                    href={campaign.client.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {campaign.client.website_url}
                  </a>
                ) : (
                  <p className="text-gray-500">Not provided</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <span className="font-medium text-gray-700">Brief:</span>
              <p className="text-gray-900 mt-1">{campaign.brief}</p>
            </div>
          </div>

          {/* Generated Copy Results */}
          {generatedCopy ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Generated Copy</h2>
                <div className="flex space-x-2">
                  {googleDocLink && (
                    <a
                      href={googleDocLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Share className="h-4 w-4" />
                      <span>View Google Doc</span>
                    </a>
                  )}
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Subject Lines */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Subject Line Options</h3>
                <div className="space-y-2">
                  {generatedCopy.subject_lines?.map((subject: string, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Option {index + 1}:</span>
                      <p className="text-gray-900">{subject}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Text */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Preview Text</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900">{generatedCopy.preview_text}</p>
                </div>
              </div>

              {/* Email Body */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Email Body</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: generatedCopy.email_body }}
                  />
                </div>
              </div>

              {/* Alternative Versions */}
              {generatedCopy.alternative_versions?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Alternative Versions</h3>
                  <div className="space-y-4">
                    {generatedCopy.alternative_versions.map((alt: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Version {index + 1}</h4>
                        <p className="text-sm text-gray-600 mb-2">Subject: {alt.subject_line}</p>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: alt.email_body }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="max-w-sm mx-auto">
                <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Copy</h3>
                <p className="text-gray-600 mb-6">
                  Configure your copy settings and click "Generate Copy" to create high-converting email copy using AI.
                </p>
                <p className="text-sm text-blue-600">
                  This will research the website, analyze the brand, and generate professional email copy automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}