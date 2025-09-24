'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

interface APIConfig {
  claude_api_key: string;
  google_docs_enabled: boolean;
  google_docs_folder_id: string;
  airtable_api_key: string;
  airtable_base_id: string;
}

interface ConnectionStatus {
  claude: 'connected' | 'error' | 'testing';
  google_docs: 'connected' | 'error' | 'testing';
  airtable: 'connected' | 'error' | 'testing';
}

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    claude: 'testing', 
    google_docs: 'testing',
    airtable: 'testing'
  });

  const [config, setConfig] = useState<APIConfig>({
    claude_api_key: '',
    google_docs_enabled: false,
    google_docs_folder_id: '',
    airtable_api_key: '',
    airtable_base_id: ''
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('copybot-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }
  }, []);

  // Test connections on load
  const testAirtableConnection = async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, airtable: 'testing' }));
      const response = await fetch('/api/airtable/test');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus(prev => ({ ...prev, airtable: 'connected' }));
      } else {
        setConnectionStatus(prev => ({ ...prev, airtable: 'error' }));
      }
    } catch (error) {
      console.error('Airtable connection test failed:', error);
      setConnectionStatus(prev => ({ ...prev, airtable: 'error' }));
    }
  };
  useEffect(() => {
    testConnections();
  }, [config]);

  const testConnections = async () => {
    // Test Claude AI
    try {
      const response = await fetch('/api/test/claude');
      setConnectionStatus(prev => ({ 
        ...prev, 
        claude: response.ok ? 'connected' : 'error' 
      }));
    } catch {
      setConnectionStatus(prev => ({ ...prev, claude: 'error' }));
    }

    // Test Google Docs (placeholder - would test Google API)
    setConnectionStatus(prev => ({ 
      ...prev, 
      google_docs: config.google_docs_enabled ? 'connected' : 'error'
    }));

    // Test Airtable connection
    await testAirtableConnection();
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
      // Save settings to localStorage for persistence
      localStorage.setItem('copybot-settings', JSON.stringify(config));
      
      // Test connections after saving
      await testConnections();
      
      alert('Settings saved successfully! API keys are stored locally.');
    } catch (error) {
      alert('Failed to save settings');
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
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-300 mt-2">Configure your API integrations and preferences.</p>
      </div>

      {/* Connection Status */}
      <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Integration Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-white">Claude AI</h3>
              <p className="text-sm text-gray-300">Copy generation & website scraping</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.claude)}
              <span className="text-sm">{getStatusText(connectionStatus.claude)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-white">Google Docs</h3>
              <p className="text-sm text-gray-300">Auto-document creation</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.google_docs)}
              <span className="text-sm">{getStatusText(connectionStatus.google_docs)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-white">Airtable</h3>
              <p className="text-sm text-gray-300">Campaign synchronization</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.airtable)}
              <span className="text-sm">{getStatusText(connectionStatus.airtable)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={testConnections}
          className="mt-4 bg-purple-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-lg"
        >
          Test All Connections
        </button>
      </div>

      {/* API Configuration */}
      <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-white mb-6">API Configuration</h2>
        
        <div className="space-y-6">
          {/* Claude AI Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-white mb-4">Claude AI (Anthropic)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys.claude_api_key ? 'text' : 'password'}
                  value={config.claude_api_key}
                  onChange={(e) => handleConfigChange('claude_api_key', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-ant-api03-xxx"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('claude_api_key')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showKeys.claude_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Get your API key from <a href="https://console.anthropic.com" target="_blank" className="text-blue-600 hover:underline">console.anthropic.com</a>
              </p>
            </div>
          </div>

          {/* Airtable Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-white mb-4">Airtable Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.airtable_api_key ? 'text' : 'password'}
                    value={config.airtable_api_key}
                    onChange={(e) => handleConfigChange('airtable_api_key', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="pat..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('airtable_api_key')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showKeys.airtable_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base ID
                </label>
                <input
                  type="text"
                  value={config.airtable_base_id}
                  onChange={(e) => handleConfigChange('airtable_base_id', e.target.value)}
                  className="w-full px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="appXXXXXXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Google Docs Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-white mb-4">Google Docs Integration</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="google_docs_enabled"
                  checked={config.google_docs_enabled}
                  onChange={(e) => handleConfigChange('google_docs_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-dark-600 rounded"
                />
                <label htmlFor="google_docs_enabled" className="text-sm text-gray-300">
                  Enable automatic Google Docs creation and sharing
                </label>
              </div>
              
              {config.google_docs_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Google Drive Folder ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.google_docs_folder_id}
                    onChange={(e) => handleConfigChange('google_docs_folder_id', e.target.value)}
                    className="w-full px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1abc123def456ghi789jkl"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Folder ID where generated documents will be saved (leave empty for root folder)
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                When enabled, generated copy will automatically create shareable Google Docs like your existing Make.com automation
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-gradient text-white px-6 py-3 rounded-lg hover:opacity-90 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
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

      {/* Environment Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-3">🔧 Local Development Setup</h3>
        <p className="text-blue-700 mb-4">
          Edit your <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> file and add:
        </p>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <div className="text-yellow-400"># Add this line to your .env.local file:</div>
          <div>ANTHROPIC_API_KEY=your-claude-api-key-here</div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-blue-800 text-sm font-medium">
            📝 Replace "your-claude-api-key-here" with your actual Claude API key!
          </p>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-800 mb-3">🚀 What You Need</h3>
        <div className="space-y-3 text-green-700 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span><strong>Supabase Database:</strong> ✅ Already configured and working</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span><strong>Claude AI:</strong> Required - Get key from console.anthropic.com</span>
          </div>
          <div className="flex items-center space-x-2">
            <Loader className="h-4 w-4 text-gray-400" />
            <span><strong>Google Docs:</strong> Optional - For automatic document creation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Loader className="h-4 w-4 text-gray-400" />
            <span><strong>Airtable:</strong> Optional - For campaign synchronization</span>
          </div>
        </div>
      </div>
    </div>
  );
}