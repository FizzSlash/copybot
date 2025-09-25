'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Zap, CheckCircle, Edit, Eye, MessageSquare } from 'lucide-react';

interface FlowStrategy {
  flowType: string;
  emailCount: number;
  offer: string;
  client: string;
  scrapedInsights: string[];
  emailStrategies: {
    emailNumber: number;
    day: number;
    theme: string;
    focus: string;
    hasOffer: boolean;
    offerType?: string;
    products: string;
    keyMessage: string;
  }[];
}

interface Client {
  id: string;
  name: string;
  company: string;
  website_url?: string;
  brand_questionnaire?: any;
}

const FLOW_TYPES = [
  { 
    id: 'welcome', 
    name: 'Welcome Series', 
    description: 'Introduce new subscribers to your brand',
    defaultEmails: 7,
    defaultDays: 14,
    offerStrategy: 'All emails include offers'
  },
  { 
    id: 'abandoned_checkout', 
    name: 'Abandoned Checkout', 
    description: 'Recover abandoned shopping carts',
    defaultEmails: 4,
    defaultDays: 7,
    offerStrategy: 'Offers in emails 3-4 only'
  },
  { 
    id: 'browse_abandonment', 
    name: 'Browse Abandonment', 
    description: 'Re-engage browsers who didn\'t purchase',
    defaultEmails: 4,
    defaultDays: 5,
    offerStrategy: 'Offers in emails 3-4 only'
  },
  { 
    id: 'post_purchase', 
    name: 'Post-Purchase', 
    description: 'Nurture new customers and encourage repeat purchases',
    defaultEmails: 4,
    defaultDays: 30,
    offerStrategy: 'Offers in emails 3-4 only'
  },
  { 
    id: 'winback', 
    name: 'Winback Campaign', 
    description: 'Re-engage inactive customers',
    defaultEmails: 4,
    defaultDays: 10,
    offerStrategy: 'Offers in emails 3-4 only'
  }
];

export default function FlowBuilderPage() {
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'strategy' | 'review' | 'execution'>('setup');
  const [selectedFlowType, setSelectedFlowType] = useState('welcome');
  const [emailCount, setEmailCount] = useState(7);
  const [offer, setOffer] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [proposedStrategy, setProposedStrategy] = useState<FlowStrategy | null>(null);
  const [editedStrategy, setEditedStrategy] = useState<FlowStrategy | null>(null);
  const [editingEmailIndex, setEditingEmailIndex] = useState<number | null>(null);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  const [generatedFlow, setGeneratedFlow] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState<{current: number, total: number} | null>(null);
  const [activeEmailIndex, setActiveEmailIndex] = useState(0);
  const [emailViewMode, setEmailViewMode] = useState<'preview' | 'edit'>('preview');
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [revisionEmailIndex, setRevisionEmailIndex] = useState<number | null>(null);
  const [revisionText, setRevisionText] = useState('');
  const [isRevising, setIsRevising] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Update email count when flow type changes
    const flowType = FLOW_TYPES.find(f => f.id === selectedFlowType);
    if (flowType) {
      setEmailCount(flowType.defaultEmails);
    }
  }, [selectedFlowType]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clientsResponse = await response.json();
        const clients = clientsResponse.data || clientsResponse;
        setAllClients(clients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const generateFlowStrategy = async () => {
    if (!selectedClient || !offer.trim()) {
      alert('Please select a client and enter an offer before generating strategy.');
      return;
    }

    setIsGeneratingStrategy(true);
    setCurrentPhase('strategy');

    try {
      console.log('🧠 FLOWS: Generating strategy...');
      
      const response = await fetch('/api/flows/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowType: selectedFlowType,
          emailCount: emailCount,
          offer: offer,
          client: selectedClient
        })
      });

      if (response.ok) {
        const strategy = await response.json();
        setProposedStrategy(strategy.data);
        setEditedStrategy(strategy.data);
        setCurrentPhase('review');
        console.log('✅ FLOWS: Strategy generated successfully');
      } else {
        throw new Error('Failed to generate strategy');
      }
    } catch (error) {
      console.error('❌ FLOWS: Strategy generation error:', error);
      alert('Error generating strategy. Please try again.');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const generateFlowEmails = async () => {
    if (!editedStrategy) return;

    setIsGeneratingEmails(true);
    setCurrentPhase('execution');
    setGenerationProgress({ current: 0, total: editedStrategy.emailStrategies.length });

    try {
      console.log('⚡ FLOWS: Generating all flow emails...');
      
      // Generate emails one by one with progress tracking
      const generatedEmails = [];
      
      for (let i = 0; i < editedStrategy.emailStrategies.length; i++) {
        const emailStrategy = editedStrategy.emailStrategies[i];
        
        console.log(`📧 FLOWS: Generating email ${i + 1}/${editedStrategy.emailStrategies.length}`);
        setGenerationProgress({ current: i + 1, total: editedStrategy.emailStrategies.length });
        
        try {
          // Build flow context for differentiation
          const otherEmails = editedStrategy.emailStrategies
            .filter((_, index) => index !== i)
            .map(email => `Email ${email.emailNumber}: ${email.theme} (Focus: ${email.focus})`)
            .join('\n');
          
          const previousEmails = editedStrategy.emailStrategies
            .slice(0, i)
            .map(email => `${email.theme}: ${email.focus}`)
            .join(', ');
          
          const upcomingEmails = editedStrategy.emailStrategies
            .slice(i + 1)
            .map(email => `${email.theme}: ${email.focus}`)
            .join(', ');

          const emailResponse = await fetch('/api/generate-copy-simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_context: JSON.stringify({
                campaign: {
                  name: `${editedStrategy.flowType} - Email ${emailStrategy.emailNumber}: ${emailStrategy.theme}`,
                  client: editedStrategy.client,
                  sendDate: `Day ${emailStrategy.day}`,
                  notes: `${emailStrategy.focus}. Key message: ${emailStrategy.keyMessage}. Products to feature: ${emailStrategy.products}. ${emailStrategy.hasOffer ? `Include offer: ${emailStrategy.offerType || editedStrategy.offer}` : 'No offer in this email.'}`
                },
                client: selectedClient ? {
                  name: selectedClient.name,
                  company: selectedClient.company,
                  website: selectedClient.website_url,
                  brandGuidelines: selectedClient.brand_questionnaire
                } : null
              }),
              copy_type: 'promotional',
              tone: 'designed',
              length: 'medium',
              focus: emailStrategy.focus,
              additional_context: `${emailStrategy.hasOffer ? `This email should include the offer: ${editedStrategy.offer}` : 'This email should NOT include any offers - focus on building trust and value.'}`,
              flow_context: {
                flowType: editedStrategy.flowType,
                totalEmails: editedStrategy.emailStrategies.length,
                currentEmailNumber: emailStrategy.emailNumber,
                otherEmailSummaries: otherEmails,
                previousEmails: previousEmails,
                upcomingEmails: upcomingEmails,
                uniqueFocus: emailStrategy.focus
              }
            })
          });

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            generatedEmails.push({
              emailNumber: emailStrategy.emailNumber,
              day: emailStrategy.day,
              theme: emailStrategy.theme,
              strategy: emailStrategy,
              copyData: emailData.data,
              hasOffer: emailStrategy.hasOffer
            });
            console.log(`✅ FLOWS: Email ${i + 1} generated successfully`);
          } else {
            throw new Error(`Failed to generate email ${i + 1}`);
          }
        } catch (emailError) {
          console.error(`❌ FLOWS: Error generating email ${i + 1}:`, emailError);
          // Add fallback email so flow doesn't break
          generatedEmails.push({
            emailNumber: emailStrategy.emailNumber,
            day: emailStrategy.day,
            theme: emailStrategy.theme,
            strategy: emailStrategy,
            copyData: {
              subject_lines: [`${emailStrategy.theme} - ${editedStrategy.client}`],
              preview_text: [emailStrategy.keyMessage],
              email_blocks: [
                { type: 'header', content: emailStrategy.theme },
                { type: 'body', content: emailStrategy.focus },
                { type: 'cta', content: 'Learn More', link: '#' }
              ]
            },
            hasOffer: emailStrategy.hasOffer,
            error: 'Generation failed - using fallback content'
          });
        }
      }
      
      const flowData = {
        id: `flow_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        strategy: editedStrategy,
        emails: generatedEmails,
        created_at: new Date().toISOString()
      };
      
      setGeneratedFlow(flowData);
      setGenerationProgress(null);
      console.log('✅ FLOWS: All emails generated successfully');
      
    } catch (error) {
      console.error('❌ FLOWS: Email generation error:', error);
      alert('Error generating flow emails. Please try again.');
      setGenerationProgress(null);
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  const updateEmailStrategy = (index: number, updates: any) => {
    if (!editedStrategy) return;
    
    const newStrategies = [...editedStrategy.emailStrategies];
    newStrategies[index] = { ...newStrategies[index], ...updates };
    setEditedStrategy({ ...editedStrategy, emailStrategies: newStrategies });
  };

  const finalizeFlow = async () => {
    if (!generatedFlow || !selectedClient) return;

    try {
      console.log('📄 FLOWS: Finalizing flow...');
      
      const response = await fetch('/api/flows/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowData: generatedFlow,
          client: selectedClient
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FLOWS: Flow finalized successfully!');
        
        // Copy link to clipboard
        navigator.clipboard.writeText(result.shareableUrl);
        
        // Show success and redirect
        const userChoice = confirm(`✅ Flow finalized!\n\n🔗 Shareable Link: ${result.shareableUrl}\n📋 Saved to your flows library!\n\nClick OK to open the flow view, or Cancel to continue editing.`);
        
        if (userChoice) {
          window.open(result.shareableUrl, '_blank');
        }
      } else {
        throw new Error('Failed to finalize flow');
      }
    } catch (error) {
      console.error('❌ FLOWS: Finalization error:', error);
      alert('Error finalizing flow. Please try again.');
    }
  };

  const handleEmailRevision = async () => {
    if (!revisionText.trim() || revisionEmailIndex === null || !generatedFlow) return;
    
    setIsRevising(true);
    setShowRevisionPrompt(false);
    
    try {
      console.log(`🔄 FLOW REVISION: Revising email ${revisionEmailIndex + 1} with feedback:`, revisionText);
      
      const emailToRevise = generatedFlow.emails[revisionEmailIndex];
      
      const revisionResponse = await fetch('/api/generate-copy-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_context: JSON.stringify({
            campaign: { name: `${selectedClient?.name} - ${FLOW_TYPES.find(f => f.id === selectedFlowType)?.name} Flow Email ${revisionEmailIndex + 1}` },
            client: selectedClient?.name,
            notes: offer
          }),
          copy_type: 'promotional',
          tone: 'designed',
          length: 'medium',
          additional_context: `Flow Email ${revisionEmailIndex + 1} - ${emailToRevise.theme}`,
          revision_feedback: revisionText,
          current_copy: emailToRevise.copyData,
          feedback_mode: true,
          flow_context: {
            flowType: selectedFlowType,
            emailNumber: revisionEmailIndex + 1,
            totalEmails: emailCount,
            theme: emailToRevise.theme,
            strategy: emailToRevise.strategy
          }
        }),
      });

      if (!revisionResponse.ok) {
        throw new Error('Failed to generate revised email');
      }

      const revisedCopy = await revisionResponse.json();
      console.log(`✅ FLOW REVISION: Email ${revisionEmailIndex + 1} revised successfully`);
      
      // Validate response structure
      if (!revisedCopy.subject_lines || !revisedCopy.preview_text || !revisedCopy.email_blocks) {
        throw new Error('Invalid response structure from AI revision');
      }
      
      // Update the specific email in the flow
      const updatedFlow = { ...generatedFlow };
      updatedFlow.emails[revisionEmailIndex] = {
        ...updatedFlow.emails[revisionEmailIndex],
        copyData: revisedCopy
      };
      setGeneratedFlow(updatedFlow);
      setRevisionText('');
      setRevisionEmailIndex(null);
      
      console.log('✅ FLOW REVISION: Email copy updated successfully');
    } catch (error) {
      console.error('❌ FLOW REVISION: Error:', error);
      setShowRevisionPrompt(true);
    } finally {
      setIsRevising(false);
    }
  };

  const selectedFlowConfig = FLOW_TYPES.find(f => f.id === selectedFlowType);

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 mb-6">
          <div className="px-6 py-4 border-b border-dark-700/50">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Flow Builder</h1>
                <p className="text-gray-300">Strategic email flow creation with AI-powered insights</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center space-x-2 ${currentPhase === 'setup' ? 'text-blue-600' : currentPhase === 'strategy' || currentPhase === 'review' || currentPhase === 'execution' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentPhase === 'setup' ? 'bg-blue-100 text-blue-600' : currentPhase === 'strategy' || currentPhase === 'review' || currentPhase === 'execution' ? 'bg-green-100 text-green-600' : 'bg-dark-600 text-gray-400'}`}>
                  1
                </div>
                <span className="font-medium">Setup</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${currentPhase === 'strategy' ? 'text-blue-600' : currentPhase === 'review' || currentPhase === 'execution' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentPhase === 'strategy' ? 'bg-blue-100 text-blue-600' : currentPhase === 'review' || currentPhase === 'execution' ? 'bg-green-100 text-green-600' : 'bg-dark-600 text-gray-400'}`}>
                  <Brain className="h-4 w-4" />
                </div>
                <span className="font-medium">Strategy</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${currentPhase === 'review' ? 'text-blue-600' : currentPhase === 'execution' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentPhase === 'review' ? 'bg-blue-100 text-blue-600' : currentPhase === 'execution' ? 'bg-green-100 text-green-600' : 'bg-dark-600 text-gray-400'}`}>
                  <Edit className="h-4 w-4" />
                </div>
                <span className="font-medium">Review</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${currentPhase === 'execution' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentPhase === 'execution' ? 'bg-blue-100 text-blue-600' : 'bg-dark-600 text-gray-400'}`}>
                  <Zap className="h-4 w-4" />
                </div>
                <span className="font-medium">Generate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 1: Setup */}
        {currentPhase === 'setup' && (
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Flow Configuration</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Flow Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Flow Type</label>
                <div className="space-y-3">
                  {FLOW_TYPES.map(flowType => (
                    <label key={flowType.id} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="flowType"
                        value={flowType.id}
                        checked={selectedFlowType === flowType.id}
                        onChange={(e) => setSelectedFlowType(e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-white">{flowType.name}</div>
                        <div className="text-sm text-gray-300">{flowType.description}</div>
                        <div className="text-xs text-purple-400 mt-1">
                          {flowType.defaultEmails} emails • {flowType.offerStrategy}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
                  <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      const client = allClients.find(c => c.id === e.target.value);
                      setSelectedClient(client || null);
                    }}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a client...</option>
                    {allClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.company || client.name} {client.website_url ? '(🌐 has website)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedClient?.website_url && (
                    <div className="text-xs text-green-600 mt-1">
                      ✅ Website will be analyzed for strategic insights
                    </div>
                  )}
                </div>

                {/* Email Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Emails
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={emailCount}
                    onChange={(e) => setEmailCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-300 mt-1">
                    Recommended: {selectedFlowConfig?.defaultEmails} emails for {selectedFlowConfig?.name}
                  </div>
                </div>

                {/* Offer */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Offer
                  </label>
                  <textarea
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="e.g., 15% off first order + free shipping"
                    rows={2}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-300 mt-1">
                    {selectedFlowConfig?.offerStrategy}
                  </div>
                </div>

                {/* Generate Strategy Button */}
                <button
                  onClick={generateFlowStrategy}
                  disabled={!selectedClient || !offer.trim() || isGeneratingStrategy}
                  className="w-full bg-purple-gradient text-white py-3 px-4 rounded-lg hover:opacity-90 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isGeneratingStrategy ? (
                    <>🧠 Analyzing Website & Building Strategy...</>
                  ) : (
                    <>🧠 Generate Flow Strategy</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Strategy Review */}
        {currentPhase === 'review' && proposedStrategy && (
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Flow Strategy Preview</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentPhase('setup')}
                  className="px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700/30"
                >
                  ← Back to Setup
                </button>
                <button
                  onClick={generateFlowEmails}
                  disabled={isGeneratingEmails}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                >
                  {isGeneratingEmails ? 'Generating Emails...' : 'Generate Flow Emails →'}
                </button>
              </div>
            </div>

            {/* Strategy Overview */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Strategic Insights</h3>
              <div className="text-sm text-blue-800">
                <div className="font-medium">{selectedClient?.company} - {selectedFlowConfig?.name}</div>
                <div>{emailCount} emails over {selectedFlowConfig?.defaultDays} days</div>
                <div className="mt-2">
                  <span className="font-medium">Key Insights:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {proposedStrategy.scrapedInsights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Email Strategy Timeline */}
            <div className="space-y-4">
                <h3 className="font-medium text-white">Email Strategy Timeline</h3>
              
              {proposedStrategy.emailStrategies.map((emailStrategy, index) => (
                  <div key={index} className="border border-dark-700/50 rounded-lg p-4 bg-dark-700/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {emailStrategy.emailNumber}
                          </div>
                          <div>
                            <div className="font-medium text-white">{emailStrategy.theme}</div>
                            <div className="text-sm text-gray-300">Day {emailStrategy.day}</div>
                          </div>
                        </div>
                        {emailStrategy.hasOffer && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            🎁 Includes Offer
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium text-gray-300">Focus:</span> {emailStrategy.focus}</div>
                        <div><span className="font-medium text-gray-300">Products:</span> {emailStrategy.products}</div>
                        <div><span className="font-medium text-gray-300">Key Message:</span> {emailStrategy.keyMessage}</div>
                        {emailStrategy.hasOffer && (
                          <div><span className="font-medium text-gray-300">Offer Type:</span> {emailStrategy.offerType}</div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setEditingEmailIndex(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Offer Configuration */}
            <div className="mt-6 p-4 bg-amber-500/20 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Offer Strategy</h3>
              <div className="text-sm text-yellow-800">
                <div className="font-medium">Primary Offer: {offer}</div>
                <div className="mt-1">
                  {selectedFlowType === 'welcome' 
                    ? `Offer variations included in all ${emailCount} emails`
                    : `Offer introduced in emails ${Math.max(1, emailCount - 1)} and ${emailCount}`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Strategy Edit Modal */}
        {editingEmailIndex !== null && editedStrategy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
        <div className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-dark-700">
          <h3 className="text-lg font-semibold text-white mb-4">
                Edit Email {editedStrategy.emailStrategies[editingEmailIndex].emailNumber} Strategy
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Theme</label>
                  <input
                    type="text"
                    value={editedStrategy.emailStrategies[editingEmailIndex].theme}
                    onChange={(e) => updateEmailStrategy(editingEmailIndex, { theme: e.target.value })}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Focus & Strategy</label>
                  <textarea
                    value={editedStrategy.emailStrategies[editingEmailIndex].focus}
                    onChange={(e) => updateEmailStrategy(editingEmailIndex, { focus: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Key Message</label>
                  <textarea
                    value={editedStrategy.emailStrategies[editingEmailIndex].keyMessage}
                    onChange={(e) => updateEmailStrategy(editingEmailIndex, { keyMessage: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Products to Feature</label>
                  <input
                    type="text"
                    value={editedStrategy.emailStrategies[editingEmailIndex].products}
                    onChange={(e) => updateEmailStrategy(editingEmailIndex, { products: e.target.value })}
                    className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={editedStrategy.emailStrategies[editingEmailIndex].hasOffer}
                    onChange={(e) => updateEmailStrategy(editingEmailIndex, { hasOffer: e.target.checked })}
                    className="text-blue-600"
                  />
                  <label className="text-sm font-medium text-gray-300">Include offer in this email</label>
                </div>
                
                {editedStrategy.emailStrategies[editingEmailIndex].hasOffer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Offer Type</label>
                    <input
                      type="text"
                      value={editedStrategy.emailStrategies[editingEmailIndex].offerType || ''}
                      onChange={(e) => updateEmailStrategy(editingEmailIndex, { offerType: e.target.value })}
                      placeholder="e.g., Welcome discount, Limited-time offer"
                      className="w-full px-3 py-2 border border-dark-600 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setEditingEmailIndex(null)}
                  className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setEditingEmailIndex(null)}
                  className="flex-1 px-4 py-2 bg-purple-gradient text-white rounded-lg hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Generation Progress */}
        {currentPhase === 'execution' && isGeneratingEmails && generationProgress && (
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Generating Flow Emails</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: {generationProgress.current} of {generationProgress.total} emails</span>
                <span>{Math.round((generationProgress.current / generationProgress.total) * 100)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-gradient h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-400">
                Currently generating: Email {generationProgress.current} 
                {editedStrategy?.emailStrategies[generationProgress.current - 1] && 
                  ` - ${editedStrategy.emailStrategies[generationProgress.current - 1].theme}`
                }
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Flow Execution & Email Tabs */}
        {currentPhase === 'execution' && !isGeneratingEmails && generatedFlow && (
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50">
          <div className="border-b border-dark-700/50">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-lg font-semibold text-white">Generated Flow</h2>
                <div className="flex items-center space-x-3">
                  {/* Preview/Edit Toggle */}
                  <div className="flex bg-dark-700/50 rounded-lg p-1">
                    <button
                      onClick={() => setEmailViewMode('preview')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        emailViewMode === 'preview' 
                          ? 'bg-dark-800/50 text-blue-600 shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => setEmailViewMode('edit')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        emailViewMode === 'edit' 
                          ? 'bg-dark-800/50 text-blue-600 shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Edit className="h-4 w-4 inline mr-1" />
                      Edit Blocks
                    </button>
                  </div>

                  <button
                    onClick={() => setCurrentPhase('review')}
                    className="px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-700/30"
                  >
                    ← Edit Strategy
                  </button>
                  <button 
                    onClick={finalizeFlow}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📄 Finalize Flow
                  </button>
                </div>
              </div>
              
              {/* Email Navigation Tabs */}
              <div className="flex space-x-1 px-6">
                {generatedFlow.emails?.map((email: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveEmailIndex(index)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeEmailIndex === index 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent hover:border-dark-600'
                    }`}
                  >
                    Email {index + 1}
                    {email.hasOffer && <span className="ml-1 text-green-600">🎁</span>}
                    <div className="text-xs text-gray-300">Day {email.day}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active Email Content */}
            {generatedFlow.emails?.[activeEmailIndex] && (
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {generatedFlow.emails[activeEmailIndex].theme}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Day {generatedFlow.emails[activeEmailIndex].day} • 
                      {generatedFlow.emails[activeEmailIndex].hasOffer ? ' 🎁 Includes Offer' : ' No Offer'}
                      {generatedFlow.emails[activeEmailIndex].error && (
                        <span className="ml-2 text-red-600">⚠️ {generatedFlow.emails[activeEmailIndex].error}</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setRevisionEmailIndex(activeEmailIndex);
                      setShowRevisionPrompt(true);
                    }}
                    className="px-3 py-1 text-sm bg-purple-gradient text-white rounded-lg hover:opacity-90 flex items-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Revise</span>
                  </button>
                </div>

                {emailViewMode === 'preview' ? (
                  /* Preview Mode - Clean Display */
                  <>
                    {/* Subject Lines */}
                    <div className="mb-6">
                      <h4 className="font-medium text-white mb-3">Subject Line:</h4>
                      <div className="text-lg font-medium text-white">
                        {generatedFlow.emails[activeEmailIndex]?.copyData?.subject_lines?.[0] || 'No subject line'}
                      </div>
                    </div>

                    {/* Preview Text */}
                    <div className="mb-6">
                      <h4 className="font-medium text-white mb-3">Preview Text:</h4>
                      <div className="text-gray-400">
                        {generatedFlow.emails[activeEmailIndex]?.copyData?.preview_text?.[0] || 'No preview text'}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Edit Mode - Interactive Tables */
                  <>
                    {/* Subject Lines */}
                    <div className="mb-6">
                      <h4 className="font-medium text-white mb-3">Subject Lines</h4>
                      <div className="border border-dark-600 rounded-lg overflow-hidden">
                        {generatedFlow.emails[activeEmailIndex]?.copyData?.subject_lines?.map((subject: string, index: number) => (
                          <div key={index} className={`flex border-b border-dark-700/50 last:border-b-0 ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'}`}>
                            <div className="w-20 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm flex items-center">
                              <input type="radio" name={`subject-${activeEmailIndex}`} defaultChecked={index === 0} className="text-blue-600" />
                            </div>
                            <div className="flex-1 p-3">
                              <input
                                type="text"
                                value={subject}
                                onChange={() => {/* TODO: Update subject */}}
                                className="w-full bg-transparent border-0 focus:ring-0 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preview Text */}
                    <div className="mb-6">
                      <h4 className="font-medium text-white mb-3">Preview Text</h4>
                      <div className="border border-dark-600 rounded-lg overflow-hidden">
                        {generatedFlow.emails[activeEmailIndex]?.copyData?.preview_text?.map((preview: string, index: number) => (
                          <div key={index} className={`flex border-b border-dark-700/50 last:border-b-0 ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'}`}>
                            <div className="w-20 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm flex items-center">
                              <input type="radio" name={`preview-${activeEmailIndex}`} defaultChecked={index === 0} className="text-blue-600" />
                            </div>
                            <div className="flex-1 p-3">
                              <input
                                type="text"
                                value={preview}
                                onChange={() => {/* TODO: Update preview */}}
                                className="w-full bg-transparent border-0 focus:ring-0 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Email Content Blocks */}
                <div>
                  <h4 className="font-medium text-white mb-3">Email Content:</h4>
                  <div className="border border-dark-600 rounded-lg overflow-hidden">
                      {generatedFlow.emails[activeEmailIndex]?.copyData?.email_blocks?.map((block: any, index: number) => (
                      <div
                        key={index}
                        className={`flex border-b border-dark-700/50 last:border-b-0 ${index % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-700/30'}`}
                      >
                        <div className="w-32 p-3 bg-dark-600 border-r border-dark-700/50 font-semibold text-white text-sm uppercase">
                          {emailViewMode === 'edit' ? (
                            <select
                              value={block.type}
                              onChange={() => {/* TODO: Update block type */}}
                              className="text-xs bg-transparent border-0 focus:ring-0 font-semibold text-gray-300 uppercase w-full"
                            >
                              <option value="header">HEADER</option>
                              <option value="subheader">SUBHEADER</option>
                              <option value="body">BODY</option>
                              <option value="pic">PIC</option>
                              <option value="cta">CTA</option>
                              <option value="product">PRODUCT</option>
                              <option value="collection">COLLECTION</option>
                            </select>
                          ) : (
                            block.type
                          )}
                        </div>
                        <div className="flex-1 p-3">
                          {emailViewMode === 'edit' ? (
                            /* Edit Mode - Inline Editing */
                            block.type === 'product' ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={block.content || ''}
                                  onChange={() => {/* TODO: Update product content */}}
                                  className="w-full px-2 py-1 text-sm font-semibold bg-transparent border-0 border-b border-dark-700/50 focus:ring-0"
                                />
                                <textarea
                                  value={block.description || ''}
                                  onChange={() => {/* TODO: Update description */}}
                                  rows={2}
                                  className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0"
                                />
                                <input
                                  type="text"
                                  value={block.cta || ''}
                                  onChange={() => {/* TODO: Update CTA */}}
                                  className="w-full px-2 py-1 text-sm text-blue-600 font-medium bg-transparent border-0 border-b border-dark-700/50 focus:ring-0"
                                />
                              </div>
                            ) : block.type === 'cta' ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={block.content || ''}
                                  onChange={() => {/* TODO: Update CTA content */}}
                                  className="w-full px-2 py-1 text-sm text-blue-600 font-medium bg-transparent border-0 border-b border-dark-700/50 focus:ring-0"
                                />
                              </div>
                            ) : (
                              <textarea
                                value={block.content || ''}
                                onChange={() => {/* TODO: Update content */}}
                                rows={block.type === 'header' ? 1 : block.type === 'subheader' ? 1 : 3}
                                className="w-full px-2 py-1 border-0 text-sm bg-transparent resize-none focus:ring-0"
                              />
                            )
                          ) : (
                            /* Preview Mode - Clean Display */
                            block.type === 'product' ? (
                              <div>
                                <div className="font-semibold text-white mb-1">{block.content}</div>
                                {block.description && (
                                  <div className="text-gray-400 text-sm mb-2">{block.description}</div>
                                )}
                                {block.cta && (
                                  <div className="text-blue-600 text-sm font-medium">{block.cta}</div>
                                )}
                                {block.link && (
                                  <div className="text-gray-300 text-xs mt-1">{block.link}</div>
                                )}
                              </div>
                            ) : block.type === 'cta' ? (
                              <div>
                                <div className="text-blue-600 font-medium">{block.content}</div>
                                {block.link && (
                                  <div className="text-gray-300 text-xs mt-1">{block.link}</div>
                                )}
                              </div>
                            ) : block.type === 'pic' ? (
                              <div className="bg-amber-500/20 border border-amber-500/50 rounded p-3">
                                <div className="text-yellow-800 text-sm">📷 {block.content}</div>
                              </div>
                            ) : (
                              <div>{block.content}</div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Revision Modal */}
        {showRevisionPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-dark-800 backdrop-blur-xl border border-dark-700 rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-lg font-semibold text-white mb-4">
                Revise Email {revisionEmailIndex !== null ? revisionEmailIndex + 1 : ''} with AI
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Tell the AI what you'd like to change about this email. Be specific about your requirements.
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
                    setRevisionEmailIndex(null);
                  }}
                  className="px-4 py-2 border border-dark-600 rounded-lg text-gray-300 hover:bg-dark-600/50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEmailRevision}
                  disabled={!revisionText.trim() || isRevising}
                  className="px-4 py-2 bg-purple-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isRevising ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Revising...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      <span>Revise Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}