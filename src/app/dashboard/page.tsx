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

// Mock data - in a real app, this would come from your database
const mockStats = {
  totalCampaigns: 24,
  activeCampaigns: 8,
  totalClients: 12,
  copiesGenerated: 156
};

const mockRecentCampaigns = [
  {
    id: '1',
    name: 'Black Friday Email Series',
    client: 'E-commerce Store',
    status: 'in_progress',
    deadline: '2024-11-15',
    copyCount: 3
  },
  {
    id: '2',
    name: 'Product Launch Announcement',
    client: 'Tech Startup',
    status: 'completed',
    deadline: '2024-11-10',
    copyCount: 2
  },
  {
    id: '3',
    name: 'Newsletter Template',
    client: 'Healthcare Company',
    status: 'draft',
    deadline: '2024-11-20',
    copyCount: 1
  },
  {
    id: '4',
    name: 'Welcome Email Flow',
    client: 'SaaS Platform',
    status: 'in_progress',
    deadline: '2024-11-12',
    copyCount: 5
  }
];

const mockRecentActivity = [
  {
    id: '1',
    action: 'Generated email copy',
    campaign: 'Black Friday Email Series',
    time: '2 hours ago'
  },
  {
    id: '2',
    action: 'Created new campaign',
    campaign: 'Holiday Promotions',
    time: '4 hours ago'
  },
  {
    id: '3',
    action: 'Updated client profile',
    campaign: 'Tech Startup',
    time: '1 day ago'
  },
  {
    id: '4',
    action: 'Synced from Airtable',
    campaign: '3 new campaigns',
    time: '2 days ago'
  }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'draft':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'in_progress':
      return 'text-blue-600 bg-blue-50';
    case 'draft':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your campaigns.</p>
        </div>
        
        <div className="flex space-x-4">
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Sync Airtable</span>
          </button>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalCampaigns}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.activeCampaigns}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalClients}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Copies Generated</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.copiesGenerated}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
              <Link 
                href="/dashboard/campaigns" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {mockRecentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(campaign.status)}
                  <div>
                    <Link 
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-sm text-gray-600">{campaign.client}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {campaign.copyCount} {campaign.copyCount === 1 ? 'copy' : 'copies'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
                    </p>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="bg-blue-50 p-1 rounded-full">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    {activity.campaign}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to create amazing copy?</h3>
            <p className="text-blue-100">Start a new campaign or sync your latest projects from Airtable.</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors">
              Sync Airtable
            </button>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium">
              New Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}