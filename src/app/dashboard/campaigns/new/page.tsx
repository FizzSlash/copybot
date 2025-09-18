'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader, Zap, Mail, ShoppingCart, RefreshCw, Heart } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company?: string;
  website_url?: string;
}

interface CampaignFormData {
  name: string;
  client_id: string;
  type: 'campaign' | 'flow';
  flow_type?: 'welcome' | 'abandoned_cart' | 'browse_abandonment' | 'post_purchase' | 'nurture';
  brief: string;
  campaign_context: string;
  offer?: string;
  ab_test?: string;
  deadline?: string;
  relevant_links?: string;
}

const FLOW_TYPES = [
  {
    id: 'welcome',
    name: 'Welcome Flow',
    description: 'Multi-email sequence for new subscribers',
    icon: Heart,
    emails: '5-7 emails over 1 week'
  },
  {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    description: 'Recovery sequence for cart abandoners',
    icon: ShoppingCart,
    emails: '3-4 emails over 1 week'
  },
  {
    id: 'browse_abandonment',
    name: 'Browse Abandonment',
    description: 'Re-engage users who viewed products',
    icon: RefreshCw,
    emails: '3-4 emails over 5 days'
  },
  {
    id: 'post_purchase',
    name: 'Post-Purchase',
    description: 'Follow-up sequence after purchase',
    icon: Zap,
    emails: '4 emails over 2 weeks'
  },
  {
    id: 'nurture',
    name: 'Nurture Campaign',
    description: 'Educational content and relationship building',
    icon: Mail,
    emails: 'Ongoing series'
  }
];

export default function NewCampaignPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    client_id: '',
    type: 'campaign',
    brief: '',
    campaign_context: '',
    offer: '',
    ab_test: '',
    deadline: '',
    relevant_links: ''
  });

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFlowTypeSelect = (flowType: string) => {
    setFormData(prev => ({
      ...prev,
      flow_type: flowType as CampaignFormData['flow_type']
    }));
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const campaign = await response.json();
      
      // Redirect to campaign detail page
      window.location.href = `/dashboard/campaigns/${campaign.data.id}`;
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/campaigns"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-gray-600 mt-2">Set up a new email campaign or flow with AI-powered copy generation.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Details</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Black Friday Email Series"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                {loadingClients ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    Loading clients...
                  </div>
                ) : (
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => handleInputChange('client_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'campaign')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    formData.type === 'campaign'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">One-Time Campaign</h3>
                  <p className="text-sm text-gray-600 mt-1">Single email blast or promotional campaign</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'flow')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    formData.type === 'flow'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">Email Flow</h3>
                  <p className="text-sm text-gray-600 mt-1">Multi-email sequence with automation</p>
                </button>
              </div>
            </div>

            {/* Flow Type Selection */}
            {formData.type === 'flow' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Flow Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FLOW_TYPES.map((flowType) => {
                    const Icon = flowType.icon;
                    return (
                      <button
                        key={flowType.id}
                        type="button"
                        onClick={() => handleFlowTypeSelect(flowType.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          formData.flow_type === flowType.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{flowType.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{flowType.description}</p>
                            <p className="text-xs text-blue-600 mt-2">{flowType.emails}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Campaign Brief & Context */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Brief</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Brief *
              </label>
              <textarea
                required
                value={formData.brief}
                onChange={(e) => handleInputChange('brief', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the campaign goals, target audience, key messages, and desired outcomes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Context & Background
              </label>
              <textarea
                value={formData.campaign_context}
                onChange={(e) => handleInputChange('campaign_context', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional context, seasonal timing, product launches, etc..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Offer/Promotion
                </label>
                <input
                  type="text"
                  value={formData.offer}
                  onChange={(e) => handleInputChange('offer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="20% off, Free shipping, Buy 2 get 1 free..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  A/B Test Focus
                </label>
                <input
                  type="text"
                  value={formData.ab_test}
                  onChange={(e) => handleInputChange('ab_test', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subject line variations, CTA testing, etc..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relevant Links & Research
              </label>
              <textarea
                value={formData.relevant_links}
                onChange={(e) => handleInputChange('relevant_links', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Important product pages, landing pages, or competitor examples to reference..."
              />
              <p className="text-sm text-gray-500 mt-1">
                These links will be prioritized during website scraping and research
              </p>
            </div>
          </div>
        </div>

        {/* Selected Client Preview */}
        {selectedClient && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Client</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {selectedClient.name}</p>
              {selectedClient.company && (
                <p><span className="font-medium">Company:</span> {selectedClient.company}</p>
              )}
              {selectedClient.website_url && (
                <p><span className="font-medium">Website:</span> 
                  <a href={selectedClient.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    {selectedClient.website_url}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Campaign Preview */}
        {formData.type === 'flow' && formData.flow_type && (
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">Campaign Preview</h3>
            <div className="text-sm space-y-1">
              {(() => {
                const selectedFlow = FLOW_TYPES.find(f => f.id === formData.flow_type);
                return selectedFlow ? (
                  <>
                    <p><span className="font-medium">Flow Type:</span> {selectedFlow.name}</p>
                    <p><span className="font-medium">Structure:</span> {selectedFlow.emails}</p>
                    <p><span className="font-medium">Description:</span> {selectedFlow.description}</p>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Link 
            href="/dashboard/campaigns"
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Creating...' : 'Create Campaign'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}