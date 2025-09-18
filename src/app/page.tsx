import Link from 'next/link';
import { ArrowRight, Mail, Zap, Users, BarChart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CopyBot</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            AI-Powered Email Copy
            <span className="block text-blue-600">For Marketing Agencies</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Generate high-converting email copy instantly using client data, brand guidelines, 
            and website content. Streamline your agency's copywriting workflow with intelligent automation.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-3 text-lg font-semibold"
            >
              <span>Start Creating Copy</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="#features" 
              className="text-blue-600 hover:text-blue-800 transition-colors text-lg font-semibold"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              AI-Powered Generation
            </h3>
            <p className="text-gray-600">
              Advanced AI analyzes client data and brand guidelines to generate on-brand, high-converting email copy.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Client Management
            </h3>
            <p className="text-gray-600">
              Store client profiles, brand questionnaires, and notes to ensure consistent, personalized copy.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Airtable Integration
            </h3>
            <p className="text-gray-600">
              Seamlessly sync campaigns from Airtable and push generated copy back to your workflow.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-orange-100 rounded-lg p-3 w-fit mb-4">
              <BarChart className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Performance Insights
            </h3>
            <p className="text-gray-600">
              Track copy performance and continuously improve your email marketing results.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Copy Workflow?
          </h3>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
            Join forward-thinking marketing agencies who are already saving hours and improving 
            results with AI-powered email copy generation.
          </p>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-3 text-lg font-semibold"
          >
            <span>Get Started Now</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">CopyBot</span>
            </div>
            <p className="text-gray-600">
              © 2024 CopyBot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}