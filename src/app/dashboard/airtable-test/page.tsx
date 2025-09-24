'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Calendar, User, Link as LinkIcon } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  client: string;
  sendDate?: string;
  copyDueDate?: string;
  designDueDate?: string;
  stage?: string;
  copyLink?: string;
  notes?: string;
  offer?: string;
  abTest?: string;
  relevantLinks?: string;
  campaignType?: string[];
  type?: string[];
  assignee?: any;
  clientRevisions?: string;
  attachments?: any[];
  rawFields?: any;
}

type ViewMode = 'list' | 'calendar';
type CampaignFilter = 'all' | 'campaigns' | 'flows';

export default function AirtableTestPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all');

  // Auto-sync on page load
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      console.log('🔄 AUTO-SYNC: Fetching campaigns from Airtable...');
      const url = `/api/airtable/campaigns`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setLastSyncTime(new Date());
        console.log(`✅ AUTO-SYNC: Loaded ${data.campaigns?.length || 0} campaigns`);
      } else {
        console.error('❌ AUTO-SYNC: Failed to fetch campaigns:', data.message);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('💥 AUTO-SYNC: Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isPast = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString < today;
  };

  const generateCopy = (campaign: Campaign) => {
    // Navigate to copy generation with ALL campaign context
    const params = new URLSearchParams({
      airtableId: campaign.id,
      campaignName: campaign.name,
      client: campaign.client,
      sendDate: campaign.sendDate || '',
      notes: campaign.notes || '',
      stage: campaign.stage || '',
      offer: campaign.offer || '',
      abTest: campaign.abTest || '',
      relevantLinks: campaign.relevantLinks || '',
      clientRevisions: campaign.clientRevisions || '',
      assignee: campaign.assignee?.name || '',
      campaignType: campaign.campaignType?.join(', ') || '',
      type: campaign.type?.join(', ') || ''
    });
    
    console.log('🚀 GENERATE COPY: Launching with full campaign context:', {
      name: campaign.name,
      client: campaign.client,
      stage: campaign.stage,
      hasOffer: !!campaign.offer,
      hasAbTest: !!campaign.abTest,
      hasClientRevisions: !!campaign.clientRevisions,
      hasAttachments: campaign.attachments && campaign.attachments.length > 0
    });
    
    window.location.href = `/dashboard/campaigns/generate?${params.toString()}`;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 7 : firstDay; // Convert Sunday from 0 to 7
  };

  const getCampaignsForDate = (date: string) => {
    let filtered = campaigns.filter(campaign => campaign.sendDate === date);
    
    // Apply campaign type filter
    if (campaignFilter === 'campaigns') {
      filtered = filtered.filter(campaign => 
        campaign.type?.includes('Campaigns') || 
        (!campaign.type || campaign.type.length === 0)
      );
    } else if (campaignFilter === 'flows') {
      filtered = filtered.filter(campaign => 
        campaign.type?.includes('Flows')
      );
    }
    
    return filtered;
  };

  const getFilteredCampaigns = () => {
    if (campaignFilter === 'campaigns') {
      return campaigns.filter(campaign => 
        campaign.type?.includes('Campaigns') || 
        (!campaign.type || campaign.type.length === 0)
      );
    } else if (campaignFilter === 'flows') {
      return campaigns.filter(campaign => 
        campaign.type?.includes('Flows')
      );
    }
    return campaigns;
  };

  const formatCalendarDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard"
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Campaign Calendar</h1>
            <p className="text-gray-300">Manage campaigns and generate copy from Airtable</p>
          </div>
        </div>
      </div>

      {/* Campaign Dashboard */}
      <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Campaign Dashboard</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>Active campaigns (past 7 days + future) • Total: {campaigns.length}</span>
              {lastSyncTime && (
                <span>• Last synced: {lastSyncTime.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {campaigns.length > 0 && (
              <>
                {/* Campaign Type Filter */}
                <div className="flex items-center space-x-2 border rounded-lg p-1">
                  <button
                    onClick={() => setCampaignFilter('all')}
                    className={`px-3 py-1 text-sm rounded ${campaignFilter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    All ({campaigns.length})
                  </button>
                  <button
                    onClick={() => setCampaignFilter('campaigns')}
                    className={`px-3 py-1 text-sm rounded ${campaignFilter === 'campaigns' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    📧 Campaigns ({campaigns.filter(c => c.type?.includes('Campaigns') || !c.type).length})
                  </button>
                  <button
                    onClick={() => setCampaignFilter('flows')}
                    className={`px-3 py-1 text-sm rounded ${campaignFilter === 'flows' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    🔄 Flows ({campaigns.filter(c => c.type?.includes('Flows')).length})
                  </button>
                </div>

                {/* View Mode Filter */}
                <div className="flex items-center space-x-2 border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'calendar' ? 'bg-purple-gradient text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    📅 Calendar
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-purple-gradient text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    📋 List
                  </button>
                </div>
              </>
            )}
            
            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center space-x-2 text-sm"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Legend & Sync Details */}
        <div className="bg-dark-700/30 rounded-lg p-4 border border-dark-600/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Campaign Status Classification</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span><strong>Needs Copy:</strong> No Copy Link • Ready for generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span><strong>In Review:</strong> Stage includes "Ready" or "Approval"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span><strong>Complete:</strong> Has Copy Link • Copy delivered</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Synced Airtable Fields</h3>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
                <span>✅ Tasks (name)</span>
                <span>✅ Client</span>
                <span>✅ Send Date</span>
                <span>✅ Stage</span>
                <span>✅ Copy Link</span>
                <span>✅ Notes</span>
                <span>✅ Assignee</span>
                <span>✅ A/B Test</span>
                <span>✅ Offer</span>
                <span>✅ Relevant Links</span>
                <span>✅ Type</span>
                <span>✅ Campaign Type</span>
                <span>✅ Client Revisions</span>
                <span>✅ File/Attachments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {campaigns.length > 0 && (
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {campaignFilter === 'all' ? 'All Campaigns & Flows' : 
             campaignFilter === 'campaigns' ? 'Campaigns Only' : 
             'Flows Only'} ({getFilteredCampaigns().length})
          </h2>
          
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {getFilteredCampaigns().map((campaign) => (
              <div key={campaign.id} className="border border-dark-700/50 rounded-lg p-4 bg-dark-700/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-white">{campaign.name}</h3>
                      {campaign.type?.includes('Flows') && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">🔄 Flow</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{campaign.client}</span>
                      </div>
                      {campaign.sendDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className={`font-medium ${isToday(campaign.sendDate) ? 'text-red-600' : isPast(campaign.sendDate) ? 'text-orange-600' : 'text-blue-600'}`}>
                            Send Date: {formatDate(campaign.sendDate)}
                            {isToday(campaign.sendDate) && ' (TODAY)'}
                            {isPast(campaign.sendDate) && ' (PAST)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {campaign.stage && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {campaign.stage}
                      </span>
                    )}
                    
                    <button
                      onClick={() => generateCopy(campaign)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Generate Copy
                    </button>
                  </div>
                </div>
                
                {campaign.copyLink ? (
                  <div className="flex items-center space-x-1 text-sm text-blue-600">
                    <LinkIcon className="h-4 w-4" />
                    <a href={campaign.copyLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Copy Link Available
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No copy link yet</span>
                )}
                
                {campaign.notes && (
                  <p className="text-sm text-gray-300 mt-2 p-2 bg-dark-700/30 rounded">
                    {campaign.notes}
                  </p>
                )}
                
                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                    View Raw Data
                  </summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(campaign.rawFields, null, 2)}
                  </pre>
                </details>
              </div>
              ))}
            </div>
          ) : (
            /* Real Calendar View */
            <div className="calendar-view">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: getFirstDayOfMonth(currentMonth) - 1 }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-24 border border-dark-700/50"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
                  const day = index + 1;
                  const dateString = formatCalendarDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dayCampaigns = getCampaignsForDate(dateString);
                  const isCurrentDay = isToday(dateString);
                  
                  return (
                    <div
                      key={day}
                      className={`min-h-24 border border-dark-700/50 p-1 ${isCurrentDay ? 'bg-purple-500/20 border-purple-400/50' : 'hover:bg-dark-700/30'}`}
                      style={{ minHeight: dayCampaigns.length > 0 ? `${Math.max(96, dayCampaigns.length * 60 + 24)}px` : '96px' }}
                    >
                      <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-white'}`}>
                        {day}
                      </div>
                      
                      <div className="space-y-1">
                        {dayCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            onClick={() => generateCopy(campaign)}
                            className={`text-xs p-2 rounded cursor-pointer ${
                              campaign.copyLink 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : campaign.stage?.includes('Ready') || campaign.stage?.includes('Approval')
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                            title={`${campaign.name} - ${campaign.client} - ${campaign.stage || 'No stage'}`}
                          >
                            <div className="font-medium">{campaign.name}</div>
                            <div className="flex items-center justify-between">
                              <div className="text-gray-300">{campaign.client}</div>
                              {campaign.type?.includes('Flows') && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Flow</span>
                              )}
                            </div>
                            {campaign.stage && (
                              <div className="text-gray-500 text-xs mt-1">{campaign.stage}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Needs Copy</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span>In Review</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Complete</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {campaigns.length === 0 && !loading && (
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6">
          <div className="text-center text-gray-500">
            <p>No campaigns loaded yet. Click "Fetch Campaigns" to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
}