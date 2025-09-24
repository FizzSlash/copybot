import Link from 'next/link';
import { 
  Mail, 
  Users, 
  FileText, 
  Settings, 
  Home,
  Plus,
  Bell,
  Calendar,
  CheckCircle
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Top Navigation */}
      <header className="bg-dark-900/50 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-purple-gradient rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">CopyBot</h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full"></span>
              </button>
              
              <Link 
                href="/dashboard/campaigns/generate"
                className="bg-purple-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>New Campaign</span>
              </Link>

              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-dark-900/30 backdrop-blur-xl min-h-screen border-r border-dark-800/50">
          <nav className="mt-8 px-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 text-gray-300 p-3 rounded-lg hover:bg-purple-900/30 hover:text-white transition-all duration-200 group"
            >
              <Home className="h-5 w-5 group-hover:text-purple-400" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              href="/dashboard/campaigns/saved" 
              className="flex items-center space-x-3 text-gray-300 p-3 rounded-lg hover:bg-purple-900/30 hover:text-white transition-all duration-200 group"
            >
              <CheckCircle className="h-5 w-5 group-hover:text-purple-400" />
              <span>Saved Copies</span>
            </Link>

            <Link 
              href="/dashboard/flows/create" 
              className="flex items-center space-x-3 text-gray-300 p-3 rounded-lg hover:bg-purple-900/30 hover:text-white transition-all duration-200 group"
            >
              <Mail className="h-5 w-5 group-hover:text-purple-400" />
              <span>Flows</span>
            </Link>
            
            <Link 
              href="/dashboard/airtable-test" 
              className="flex items-center space-x-3 text-gray-300 p-3 rounded-lg hover:bg-purple-900/30 hover:text-white transition-all duration-200 group"
            >
              <Calendar className="h-5 w-5 group-hover:text-purple-400" />
              <span>Campaign Calendar</span>
            </Link>
            
            <Link 
              href="/dashboard/clients" 
              className="flex items-center space-x-3 text-gray-300 p-3 rounded-lg hover:bg-purple-900/30 hover:text-white transition-all duration-200 group"
            >
              <Users className="h-5 w-5 group-hover:text-purple-400" />
              <span>Clients</span>
            </Link>
            
            <div className="pt-4 mt-4 border-t border-dark-800/50">
              <Link 
                href="/dashboard/settings" 
                className="w-full flex items-center space-x-3 text-gray-300 p-3 rounded-lg hover:bg-purple-900/30 hover:text-white transition-all duration-200 group"
              >
                <Settings className="h-5 w-5 group-hover:text-purple-400" />
                <span>Settings</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gradient-to-br from-dark-950 via-dark-900 to-purple-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}