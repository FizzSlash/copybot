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
  try {
    const body = await request.json();
    const { name, email, company, website_url, brand_questionnaire } = body;

    // Validate required fields
    if (!name || !website_url) {
      return NextResponse.json(
        { error: 'Missing required fields: name and website_url' },
        { status: 400 }
      );
    }

    // Initialize database service
    const dbService = new DatabaseService();

    // Create client
    const client = await dbService.createClient({
      name,
      email: email || null,
      company: company || null,
      website_url,
      brand_questionnaire
    });

    // TODO: Trigger website scraping in background
    // This would integrate with your Perplexity scraping workflow
    if (website_url) {
      // Schedule background job to scrape website content
      // await scheduleWebsiteScraping(client.id, website_url);
    }

    return NextResponse.json({
      data: client,
      message: 'Client created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Client creation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}