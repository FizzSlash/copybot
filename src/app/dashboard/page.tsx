'use client';

import Link from 'next/link';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SavedCopy {
  id: string;
  campaign_name: string;
  client: string;
  send_date: string;
  created_at: string;
}

interface SavedFlow {
  id: string;
  flow_name: string;
  client: string;
  flow_type: string;
  email_count: number;
  created_at: string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-purple-400" />;
    case 'draft':
      return <AlertCircle className="h-4 w-4 text-amber-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-emerald-300 bg-emerald-500/20';
    case 'in_progress':
      return 'text-purple-300 bg-purple-500/20';
    case 'draft':
      return 'text-amber-300 bg-amber-500/20';
    default:
      return 'text-gray-300 bg-gray-500/20';
  }
}

export default function DashboardPage() {
  const [savedCopies, setSavedCopies] = useState<SavedCopy[]>([]);
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load campaigns
      const campaignsResponse = await fetch('/api/campaigns/saved-copies');
      if (campaignsResponse.ok) {
        const campaignsResult = await campaignsResponse.json();
        const campaigns = (campaignsResult.data || []).filter((item: any) => item.type !== 'flow');
        setSavedCopies(campaigns);
      }
      
      // Load flows
      const flowsResponse = await fetch('/api/flows/saved');
      if (flowsResponse.ok) {
        const flowsResult = await flowsResponse.json();
        setSavedFlows(flowsResult.data || []);
      }
    } catch (error) {
      console.error('❌ DASHBOARD: Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from real data
  const stats = {
    totalCampaigns: savedCopies.length + savedFlows.length,
    activeCampaigns: savedCopies.filter(copy => 
      new Date(copy.send_date) > new Date()
    ).length + savedFlows.length, // All flows are considered active
    totalClients: [...new Set([...savedCopies.map(c => c.client), ...savedFlows.map(f => f.client)])].length,
    copiesGenerated: savedCopies.length + savedFlows.reduce((sum, flow) => sum + (flow.email_count || 1), 0)
  };

  // Get recent campaigns from real data
  const recentItems = [
    ...savedCopies.map(copy => ({
      id: copy.id,
      name: copy.campaign_name,
      client: copy.client,
      type: 'campaign' as const,
      created_at: copy.created_at,
      send_date: copy.send_date
    })),
    ...savedFlows.map(flow => ({
      id: flow.id,
      name: flow.flow_name,
      client: flow.client,
      type: 'flow' as const,
      created_at: flow.created_at,
      flow_type: flow.flow_type,
      email_count: flow.email_count
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-300 mt-1">Welcome back! Here's what's happening with your campaigns.</p>
        </div>
        
        <div className="flex space-x-4">
          <button className="bg-dark-800/50 text-gray-300 px-4 py-2 rounded-lg border border-dark-700/50 hover:bg-dark-700/50 transition-colors flex items-center space-x-2 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4" />
            <span>Sync Airtable</span>
          </button>
          
          <Link 
            href="/dashboard/campaigns/generate"
            className="bg-purple-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6 hover:bg-dark-700/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Campaigns</p>
              <p className="text-2xl font-bold text-white">{stats.totalCampaigns}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6 hover:bg-dark-700/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Campaigns</p>
              <p className="text-2xl font-bold text-white">{stats.activeCampaigns}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6 hover:bg-dark-700/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Clients</p>
              <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50 p-6 hover:bg-dark-700/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Copies Generated</p>
              <p className="text-2xl font-bold text-white">{stats.copiesGenerated}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2 bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50">
          <div className="p-6 border-b border-dark-700/50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
              <Link 
                href="/dashboard/campaigns/saved" 
                className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {recentItems.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No campaigns or flows yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first campaign to get started</p>
              </div>
            ) : (
              recentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-dark-700/30 hover:bg-dark-700/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    {item.type === 'campaign' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    )}
                    <div>
                      <Link 
                        href={item.type === 'campaign' ? `/campaigns/view/${item.id}` : `/flows/view/${item.id}`}
                        className="font-medium text-white hover:text-purple-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-400">{item.client}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {item.type === 'campaign' ? '1 copy' : `${(item as any).email_count || 1} emails`}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {item.type === 'campaign' 
                            ? new Date((item as any).send_date).toLocaleDateString()
                            : new Date(item.created_at).toLocaleDateString()
                          }
                        </span>
                      </p>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.type === 'campaign' ? 'text-emerald-300 bg-emerald-500/20' : 'text-purple-300 bg-purple-500/20'
                    }`}>
                      {item.type === 'campaign' ? 'Campaign' : (item as any).flow_type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-lg border border-dark-700/50">
          <div className="p-6 border-b border-dark-700/50">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {recentItems.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No recent activity</p>
              </div>
            ) : (
              recentItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className="bg-purple-500/20 p-1 rounded-full">
                    <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      {item.type === 'campaign' ? 'Generated email copy' : 'Created email flow'}
                    </p>
                    <p className="text-sm text-purple-400 font-medium">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-purple-gradient rounded-lg shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-3xl"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to create amazing copy?</h3>
            <p className="text-purple-100">Start a new campaign or sync your latest projects from Airtable.</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors border border-white/20">
              Sync Airtable
            </button>
            <Link 
              href="/dashboard/campaigns/generate"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-lg"
            >
              New Campaign
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}