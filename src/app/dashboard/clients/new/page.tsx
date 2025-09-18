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
      // This would integrate with your Perplexity-like scraping
      // For now, it's a placeholder that would call your scraping API
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
      
      // Auto-populate some fields based on scraped data
      setFormData(prev => ({
        ...prev,
        brand_questionnaire: {
          ...prev.brand_questionnaire,
          brand_voice: 'Professional and approachable', // This would come from scraping
          tone_examples: 'Based on website analysis...', // This would come from scraping
        }
      }));
      
      alert('Website information scraped successfully! Brand voice and tone examples have been auto-populated.');
    } catch (error) {
      console.error('Website scraping failed:', error);
      alert('Failed to scrape website. Please fill in the information manually.');
    } finally {
      setIsScrapingWebsite(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // This would save to Supabase
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const client = await response.json();
      
      // Redirect to client profile or clients list
      window.location.href = '/dashboard/clients';
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/clients"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
        <p className="text-gray-600 mt-2">Create a comprehensive client profile with brand guidelines for better copy generation.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Client or contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="client@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company or brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  required
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <p className="text-sm text-gray-500 mt-1">
                Click "Auto-Fill" to automatically extract brand voice and examples from the website
              </p>
            </div>
          </div>
        </div>

        {/* Brand Questionnaire */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Brand Questionnaire</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience *
              </label>
              <textarea
                required
                value={formData.brand_questionnaire.target_audience}
                onChange={(e) => handleQuestionnaireChange('target_audience', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the primary target audience (demographics, psychographics, behaviors...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Voice & Tone *
              </label>
              <textarea
                required
                value={formData.brand_questionnaire.brand_voice}
                onChange={(e) => handleQuestionnaireChange('brand_voice', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How should the brand sound? (Professional, casual, authoritative, friendly...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {personality}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Messaging & Value Propositions *
              </label>
              <textarea
                required
                value={formData.brand_questionnaire.key_messaging}
                onChange={(e) => handleQuestionnaireChange('key_messaging', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What are the main messages and value propositions? What makes this brand unique?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Competitors
                </label>
                <input
                  type="text"
                  value={formData.brand_questionnaire.competitors.join(', ')}
                  onChange={(e) => handleArrayFieldChange('competitors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Competitor 1, Competitor 2, Competitor 3"
                />
                <p className="text-sm text-gray-500 mt-1">Separate with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Pain Points
                </label>
                <input
                  type="text"
                  value={formData.brand_questionnaire.pain_points.join(', ')}
                  onChange={(e) => handleArrayFieldChange('pain_points', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Problem 1, Problem 2, Problem 3"
                />
                <p className="text-sm text-gray-500 mt-1">What problems does the brand solve?</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unique Value Propositions
              </label>
              <input
                type="text"
                value={formData.brand_questionnaire.unique_value_props.join(', ')}
                onChange={(e) => handleArrayFieldChange('unique_value_props', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unique benefit 1, Unique benefit 2, Unique benefit 3"
              />
              <p className="text-sm text-gray-500 mt-1">What makes this brand different from competitors?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Preferences
              </label>
              <textarea
                value={formData.brand_questionnaire.content_preferences}
                onChange={(e) => handleQuestionnaireChange('content_preferences', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any specific content preferences, do's and don'ts, or style guidelines..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone Examples from Website
              </label>
              <textarea
                value={formData.brand_questionnaire.tone_examples}
                onChange={(e) => handleQuestionnaireChange('tone_examples', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste examples of copy from their website that demonstrates their brand voice..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {isScrapingWebsite ? 'This will be auto-filled when you scrape the website above' : 'Examples of existing copy that shows their brand voice'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Link 
            href="/dashboard/clients"
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
            <span>{isLoading ? 'Creating...' : 'Create Client'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}