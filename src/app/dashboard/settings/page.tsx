'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

interface APIConfig {
  supabase_url: string;
  supabase_anon_key: string;
  claude_api_key: string;
  perplexity_api_key: string;
  google_docs_enabled: boolean;
  airtable_api_key: string;
  airtable_base_id: string;
}

interface ConnectionStatus {
  supabase: 'connected' | 'error' | 'testing';
  claude: 'connected' | 'error' | 'testing';
  perplexity: 'connected' | 'error' | 'testing';
  airtable: 'connected' | 'error' | 'testing';
}

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    supabase: 'testing',
    claude: 'testing', 
    perplexity: 'testing',
    airtable: 'testing'
  });

  const [config, setConfig] = useState<APIConfig>({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    claude_api_key: '',
    perplexity_api_key: '',
    google_docs_enabled: false,
    airtable_api_key: '',
    airtable_base_id: ''
  });

  // Test connections on load
  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    // Test Supabase
    try {
      const response = await fetch('/api/test/supabase');
      setConnectionStatus(prev => ({ 
        ...prev, 
        supabase: response.ok ? 'connected' : 'error' 
      }));
    } catch {
      setConnectionStatus(prev => ({ ...prev, supabase: 'error' }));
    }

    // Test Claude
    try {
      const response = await fetch('/api/test/claude');
      setConnectionStatus(prev => ({ 
        ...prev, 
        claude: response.ok ? 'connected' : 'error' 
      }));
    } catch {
      setConnectionStatus(prev => ({ ...prev, claude: 'error' }));
    }

    // Test other services...
    setConnectionStatus(prev => ({ 
      ...prev, 
      perplexity: 'error', // Not implemented yet
      airtable: 'error' // Not implemented yet
    }));
  };

  const toggleKeyVisibility = (field: string) => {
    setShowKeys(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleConfigChange = (field: keyof APIConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to user preferences or encrypted storage
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configuration saved! Note: Some settings require environment variables to be updated.');
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: ConnectionStatus[keyof ConnectionStatus]) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusText = (status: ConnectionStatus[keyof ConnectionStatus]) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Not Connected';
      case 'testing': return 'Testing...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your API integrations and preferences.</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Integration Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Supabase Database</h3>
              <p className="text-sm text-gray-600">Core database and authentication</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.supabase)}
              <span className="text-sm">{getStatusText(connectionStatus.supabase)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Claude AI</h3>
              <p className="text-sm text-gray-600">Copy generation engine</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.claude)}
              <span className="text-sm">{getStatusText(connectionStatus.claude)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Perplexity AI</h3>
              <p className="text-sm text-gray-600">Website research and scraping</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.perplexity)}
              <span className="text-sm">{getStatusText(connectionStatus.perplexity)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Airtable</h3>
              <p className="text-sm text-gray-600">Campaign synchronization</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.airtable)}
              <span className="text-sm">{getStatusText(connectionStatus.airtable)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={testConnections}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Test All Connections
        </button>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">API Configuration</h2>
        
        <div className="space-y-6">
          {/* Supabase Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Supabase Database</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project URL
                </label>
                <div className="relative">
                  <input
                    type={showKeys.supabase_url ? 'text' : 'password'}
                    value={config.supabase_url}
                    onChange={(e) => handleConfigChange('supabase_url', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://xxx.supabase.co"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('supabase_url')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.supabase_url ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anonymous Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.supabase_anon_key ? 'text' : 'password'}
                    value={config.supabase_anon_key}
                    onChange={(e) => handleConfigChange('supabase_anon_key', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="eyJ..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('supabase_anon_key')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.supabase_anon_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Claude AI Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Claude AI (Anthropic)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys.claude_api_key ? 'text' : 'password'}
                  value={config.claude_api_key}
                  onChange={(e) => handleConfigChange('claude_api_key', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-ant-api03-xxx"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('claude_api_key')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.claude_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Get your API key from <a href="https://console.anthropic.com" target="_blank" className="text-blue-600 hover:underline">console.anthropic.com</a>
              </p>
            </div>
          </div>

          {/* Perplexity AI Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Perplexity AI (Website Research)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys.perplexity_api_key ? 'text' : 'password'}
                  value={config.perplexity_api_key}
                  onChange={(e) => handleConfigChange('perplexity_api_key', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="pplx-xxx"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('perplexity_api_key')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.perplexity_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Required for automatic website scraping and research
              </p>
            </div>
          </div>

          {/* Airtable Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Airtable Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.airtable_api_key ? 'text' : 'password'}
                    value={config.airtable_api_key}
                    onChange={(e) => handleConfigChange('airtable_api_key', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="pat..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('airtable_api_key')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.airtable_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base ID
                </label>
                <input
                  type="text"
                  value={config.airtable_base_id}
                  onChange={(e) => handleConfigChange('airtable_base_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="appXXXXXXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Google Docs Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Google Docs Integration</h3>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="google_docs_enabled"
                checked={config.google_docs_enabled}
                onChange={(e) => handleConfigChange('google_docs_enabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="google_docs_enabled" className="text-sm text-gray-700">
                Enable automatic Google Docs creation and sharing
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              When enabled, generated copy will automatically create shareable Google Docs
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Environment Variables Help */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-3">Environment Variables Required</h3>
        <p className="text-yellow-700 mb-4">
          For local development, create a <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code> file in your project root with:
        </p>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <div># Supabase (Required - You have these)</div>
          <div>NEXT_PUBLIC_SUPABASE_URL=https://xgpcwsvxpbfedalwafwx.supabase.co</div>
          <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
          <div>SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
          <div className="mt-2"># Claude AI (Get from console.anthropic.com)</div>
          <div>ANTHROPIC_API_KEY=sk-ant-api03-your_key_here</div>
          <div className="mt-2"># Perplexity AI (Optional - for website scraping)</div>
          <div>PERPLEXITY_API_KEY=pplx-your_key_here</div>
          <div className="mt-2"># Airtable (Optional - for campaign sync)</div>
          <div>AIRTABLE_API_KEY=your_token_here</div>
          <div>AIRTABLE_BASE_ID=your_base_id</div>
          <div className="mt-2"># Next.js (Required)</div>
          <div>NEXTAUTH_SECRET=your_random_secret_here</div>
          <div>NEXTAUTH_URL=http://localhost:3000</div>
        </div>

        <p className="text-yellow-700 mt-4 text-sm">
          <strong>For production:</strong> Add these same variables to your Vercel environment settings.
        </p>
      </div>

      {/* Quick Setup Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-3">Quick Setup Guide</h3>
        <div className="space-y-2 text-blue-700 text-sm">
          <p><strong>1. Supabase:</strong> ✅ Already configured in Vercel</p>
          <p><strong>2. Claude API:</strong> Sign up at console.anthropic.com → Create API key</p>
          <p><strong>3. Perplexity API:</strong> Sign up at perplexity.ai → Get API key (for website scraping)</p>
          <p><strong>4. Airtable:</strong> Optional - for syncing campaigns from existing Airtable bases</p>
          <p><strong>5. Google Docs:</strong> Optional - requires Google Cloud setup for automatic doc creation</p>
        </div>
      </div>
    </div>
  );
}