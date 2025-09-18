import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const dbService = new DatabaseService();
    const clients = await dbService.getClients();

    return NextResponse.json({
      data: clients,
      message: 'Clients retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving clients:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 CLIENT API: Starting client creation...');
  
  try {
    const body = await request.json();
    console.log('📥 CLIENT API: Request body received:', { 
      name: body.name, 
      website_url: body.website_url,
      hasQuestionnaire: !!body.brand_questionnaire 
    });
    
    const { name, email, company, website_url, brand_questionnaire } = body;

    // Validate required fields
    if (!name || !website_url) {
      console.log('❌ CLIENT API: Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name and website_url' },
        { status: 400 }
      );
    }

    console.log('✅ CLIENT API: Validation passed, initializing database service...');

    // Initialize database service
    const dbService = new DatabaseService();

    console.log('🗄️ CLIENT API: Database service initialized, creating client...');

    // Create client
    const clientData = {
      name,
      email: email || null,
      company: company || null,
      website_url,
      brand_questionnaire
    };
    
    console.log('📊 CLIENT API: Client data prepared:', clientData);
    
    const client = await dbService.createClient(clientData);
    
    console.log('✅ CLIENT API: Client created successfully:', { id: client.id, name: client.name });

    // TODO: Trigger website scraping in background
    // This would integrate with your Perplexity scraping workflow
    if (website_url) {
      console.log('🌐 CLIENT API: Website scraping would be triggered for:', website_url);
      // Schedule background job to scrape website content
      // await scheduleWebsiteScraping(client.id, website_url);
    }

    console.log('🎉 CLIENT API: Returning success response');

    return NextResponse.json({
      data: client,
      message: 'Client created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ CLIENT API: Client creation error:', error);
    console.error('🔍 CLIENT API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Client creation failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during client creation' },
      { status: 500 }
    );
  }
}