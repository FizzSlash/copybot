'use client';

import Link from 'next/link';
import { Plus, Search, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  company: string;
  website_url: string;
  email: string | null;
  brand_questionnaire: any;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        console.log('🔄 CLIENTS PAGE: Loading clients from API...');
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          console.log('📊 CLIENTS PAGE: Loaded clients:', data.data);
          setClients(data.data || []);
        } else {
          console.error('❌ CLIENTS PAGE: Failed to load clients:', response.status);
        }
      } catch (error) {
        console.error('💥 CLIENTS PAGE: Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-gray-300">Manage your client profiles and brand guidelines</p>
        </div>
        <Link 
          href="/dashboard/clients/new"
          className="bg-purple-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-lg shadow">
        <div className="p-6 border-b border-dark-700/50">
          <h2 className="text-lg font-semibold text-white">Your Clients</h2>
          <p className="text-sm text-gray-400 mt-1">{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}</p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {clients.length === 0 ? 'No clients yet' : 'No clients match your search'}
              </h3>
              <p className="text-gray-300 mb-6">
                {clients.length === 0 
                  ? 'Add your first client to start creating personalized email copy with their brand guidelines.'
                  : 'Try adjusting your search terms or add a new client.'
                }
              </p>
              <Link 
                href="/dashboard/clients/new"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <div key={client.id} className="border border-dark-700/50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{client.name}</h3>
                      {client.company && (
                        <p className="text-sm text-gray-300 mb-2">{client.company}</p>
                      )}
                      {client.website_url && (
                        <div className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                          <Globe className="h-4 w-4 mr-1" />
                          <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="truncate">
                            {client.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {client.brand_questionnaire && (
                    <div className="mb-4 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium">Target:</span> {client.brand_questionnaire.target_audience || 'Not specified'}
                      </p>
                      {client.brand_questionnaire.brand_voice && (
                        <p className="text-gray-300 mt-1 line-clamp-2">
                          <span className="font-medium">Voice:</span> {client.brand_questionnaire.brand_voice}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Added {new Date(client.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}