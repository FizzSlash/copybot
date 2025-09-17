import Link from 'next/link';
import { 
  Mail, 
  Users, 
  FileText, 
  Settings, 
  Home,
  Plus,
  Bell
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Mail className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">CopyBot</h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              
              <Link 
                href="/campaigns/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Campaign</span>
              </Link>

              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen border-r">
          <nav className="mt-8 px-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              href="/dashboard/campaigns" 
              className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Campaigns</span>
            </Link>
            
            <Link 
              href="/dashboard/clients" 
              className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>Clients</span>
            </Link>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link 
                href="/dashboard/settings" 
                className="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}