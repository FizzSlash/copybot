'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, Save, Loader } from 'lucide-react';

interface BrandQuestionnaireData {
  target_audience: string;
  brand_voice: string;
  brand_personality: string[];
  key_messaging: string;
  competitors: string[];
  pain_points: string[];
  unique_value_props: string[];
  content_preferences: string;
  tone_examples: string;
}

interface ClientFormData {
  name: string;
  email: string;
  company: string;
  website_url: string;
  brand_questionnaire: BrandQuestionnaireData;
}

const BRAND_PERSONALITY_OPTIONS = [
  'Professional', 'Friendly', 'Authoritative', 'Playful', 'Innovative', 
  'Trustworthy', 'Bold', 'Sophisticated', 'Approachable', 'Expert'
];

export default function NewClientPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    company: '',
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

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionnaireChange = (field: keyof BrandQuestionnaireData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      brand_questionnaire: {
        ...prev.brand_questionnaire,
        [field]: value
      }
    }));
  };

  const handlePersonalityToggle = (personality: string) => {
    const current = formData.brand_questionnaire.brand_personality;
    const updated = current.includes(personality)
      ? current.filter(p => p !== personality)
      : [...current, personality];
    
    handleQuestionnaireChange('brand_personality', updated);
  };

  const handleArrayFieldChange = (field: keyof BrandQuestionnaireData, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    handleQuestionnaireChange(field, items);
  };

  const scrapeWebsiteInfo = async () => {
    if (!formData.website_url) {
      alert('Please enter a website URL first');
      return;
    }

    setIsScrapingWebsite(true);
    try {
      // Use Claude to scrape and analyze the website
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formData.website_url,
          focus: 'brand analysis' // Trigger Claude brand analysis
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scraping failed');
      }

      const responseData = await response.json();
      console.log('📊 SCRAPE RESPONSE:', responseData);
      
      // Check if we got brand analysis from Claude
      console.log('🔍 AUTO-FILL: Checking for brandAnalysis...', !!responseData.brandAnalysis);
      console.log('🔍 AUTO-FILL: Response keys:', Object.keys(responseData));
      
      if (responseData.brandAnalysis) {
        console.log('🧠 AUTO-FILL: Using Claude brand analysis');
        const analysis = responseData.brandAnalysis;
        console.log('🧠 AUTO-FILL: Analysis data:', analysis);
        
        // Map Claude's brand personality to form options
        const mapBrandPersonality = (claudePersonalities: string[]): string[] => {
          const personalityMapping: Record<string, string[]> = {
            'Professional': ['professional', 'expert', 'authoritative'],
            'Friendly': ['friendly', 'approachable', 'customer-focused'],
            'Authoritative': ['authoritative', 'expert', 'trustworthy'],
            'Playful': ['playful', 'trendy', 'fun'],
            'Innovative': ['innovative', 'trendy', 'modern'],
            'Trustworthy': ['trustworthy', 'reliable', 'dependable'],
            'Bold': ['bold', 'confident', 'strong'],
            'Sophisticated': ['sophisticated', 'luxury', 'premium', 'accessible luxury'],
            'Approachable': ['approachable', 'friendly', 'accessible'],
            'Expert': ['expert', 'professional', 'authoritative']
          };
          
          const mapped: string[] = [];
          const claudePersonalitiesLower = claudePersonalities.map(p => p.toLowerCase());
          
          for (const [formOption, keywords] of Object.entries(personalityMapping)) {
            if (keywords.some(keyword => claudePersonalitiesLower.some(cp => cp.includes(keyword)))) {
              mapped.push(formOption);
            }
          }
          
          return mapped;
        };
        
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          company: analysis.brand_name || prev.company,
          brand_questionnaire: {
            target_audience: analysis.target_audience || prev.brand_questionnaire.target_audience,
            brand_voice: analysis.brand_voice || prev.brand_questionnaire.brand_voice,
            brand_personality: Array.isArray(analysis.brand_personality) 
              ? mapBrandPersonality(analysis.brand_personality)
              : prev.brand_questionnaire.brand_personality,
            key_messaging: analysis.key_messaging || prev.brand_questionnaire.key_messaging,
            competitors: [], // Will be filled manually
            pain_points: [], // Will be filled manually  
            unique_value_props: Array.isArray(analysis.unique_value_props) 
              ? analysis.unique_value_props 
              : (analysis.unique_value_props ? [analysis.unique_value_props] : prev.brand_questionnaire.unique_value_props),
            content_preferences: typeof analysis.content_preferences === 'object' 
              ? JSON.stringify(analysis.content_preferences, null, 2)
              : (analysis.content_preferences || prev.brand_questionnaire.content_preferences),
            tone_examples: Array.isArray(analysis.tone_examples) 
              ? analysis.tone_examples.join(', ')
              : (analysis.tone_examples || prev.brand_questionnaire.tone_examples)
          }
        }));
        
        alert('✅ Website analyzed successfully!\n\n🤖 AI auto-filled:\n• Target audience\n• Brand voice\n• Key messaging\n• Brand personality\n• Tone examples\n\nReview and adjust as needed!');
      } else if (responseData.content) {
        // Fallback: show raw content for manual copying
        alert(`Website scraped successfully!\n\nContent preview:\n${responseData.content.substring(0, 200)}...\n\nYou can manually copy relevant information to the brand questionnaire.`);
      } else {
        alert('Website scraped but no content extracted. Please fill out brand information manually.');
      }
    } catch (error) {
      console.error('Website scraping failed:', error);
      alert(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}. Please fill in the information manually.`);
    } finally {
      setIsScrapingWebsite(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 FORM: Starting client creation form submission...');
    
    setIsLoading(true);

    try {
      console.log('📤 FORM: Form data being sent:', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        website_url: formData.website_url,
        questionnaire_fields: Object.keys(formData.brand_questionnaire),
        questionnaire_filled: Object.values(formData.brand_questionnaire).filter(v => v && v.length > 0).length
      });

      // This would save to Supabase
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📥 FORM: API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ FORM: API error response:', errorData);
        throw new Error(errorData.error || 'Failed to create client');
      }

      const client = await response.json();
      console.log('✅ FORM: Client created successfully:', client);
      
      // Redirect to client profile or clients list
      console.log('🔄 FORM: Redirecting to clients list...');
      window.location.href = '/dashboard/clients';
    } catch (error) {
      console.error('💥 FORM: Error creating client:', error);
      console.error('🔍 FORM: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error,
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setIsLoading(false);
      console.log('🏁 FORM: Form submission completed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/clients"
          className="flex items-center space-x-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white">Add New Client</h1>
        <p className="text-gray-300 mt-2">Create a comprehensive client profile with brand guidelines for better copy generation.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Client or contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="client@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Company or brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website URL *
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  required
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="flex-1 px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={scrapeWebsiteInfo}
                  disabled={isScrapingWebsite || !formData.website_url}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isScrapingWebsite ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  <span>{isScrapingWebsite ? 'Scraping...' : 'Auto-Fill'}</span>
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Click "Auto-Fill" to automatically extract brand voice and examples from the website
              </p>
            </div>
          </div>
        </div>

        {/* Brand Questionnaire */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Brand Questionnaire</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Audience *
              </label>
              <textarea
                required
                value={formData.brand_questionnaire.target_audience}
                onChange={(e) => handleQuestionnaireChange('target_audience', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the primary target audience (demographics, psychographics, behaviors...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Voice & Tone *
              </label>
              <textarea
                required
                value={formData.brand_questionnaire.brand_voice}
                onChange={(e) => handleQuestionnaireChange('brand_voice', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="How should the brand sound? (Professional, casual, authoritative, friendly...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Personality
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {BRAND_PERSONALITY_OPTIONS.map((personality) => (
                  <button
                    key={personality}
                    type="button"
                    onClick={() => handlePersonalityToggle(personality)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.brand_questionnaire.brand_personality.includes(personality)
                        ? 'bg-purple-gradient text-white'
                        : 'bg-dark-700/30 text-gray-300 hover:bg-dark-600/50'
                    }`}
                  >
                    {personality}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key Messaging & Value Propositions *
              </label>
              <textarea
                required
                value={formData.brand_questionnaire.key_messaging}
                onChange={(e) => handleQuestionnaireChange('key_messaging', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="What are the main messages and value propositions? What makes this brand unique?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main Competitors
                </label>
                <input
                  type="text"
                  value={formData.brand_questionnaire.competitors.join(', ')}
                  onChange={(e) => handleArrayFieldChange('competitors', e.target.value)}
                  className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Competitor 1, Competitor 2, Competitor 3"
                />
                <p className="text-sm text-gray-400 mt-1">Separate with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Pain Points
                </label>
                <input
                  type="text"
                  value={formData.brand_questionnaire.pain_points.join(', ')}
                  onChange={(e) => handleArrayFieldChange('pain_points', e.target.value)}
                  className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Problem 1, Problem 2, Problem 3"
                />
                <p className="text-sm text-gray-400 mt-1">What problems does the brand solve?</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unique Value Propositions
              </label>
              <input
                type="text"
                value={formData.brand_questionnaire.unique_value_props.join(', ')}
                onChange={(e) => handleArrayFieldChange('unique_value_props', e.target.value)}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Unique benefit 1, Unique benefit 2, Unique benefit 3"
              />
              <p className="text-sm text-gray-400 mt-1">What makes this brand different from competitors?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Preferences
              </label>
              <textarea
                value={formData.brand_questionnaire.content_preferences}
                onChange={(e) => handleQuestionnaireChange('content_preferences', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Any specific content preferences, do's and don'ts, or style guidelines..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tone Examples from Website
              </label>
              <textarea
                value={formData.brand_questionnaire.tone_examples}
                onChange={(e) => handleQuestionnaireChange('tone_examples', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-dark-600 rounded-lg bg-dark-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Paste examples of copy from their website that demonstrates their brand voice..."
              />
              <p className="text-sm text-gray-400 mt-1">
                {isScrapingWebsite ? 'This will be auto-filled when you scrape the website above' : 'Examples of existing copy that shows their brand voice'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Link 
            href="/dashboard/clients"
            className="text-gray-300 hover:text-white"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-gradient text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Creating...' : 'Create Client'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}