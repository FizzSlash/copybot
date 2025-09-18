import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    const dbService = new DatabaseService();
    const campaigns = await dbService.getCampaigns(clientId || undefined);

    return NextResponse.json({
      data: campaigns,
      message: 'Campaigns retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      client_id, 
      type, 
      flow_type,
      brief, 
      campaign_context, 
      offer,
      ab_test,
      deadline,
      relevant_links
    } = body;

    // Validate required fields
    if (!name || !client_id || !type || !brief) {
      return NextResponse.json(
        { error: 'Missing required fields: name, client_id, type, and brief' },
        { status: 400 }
      );
    }

    // Initialize database service
    const dbService = new DatabaseService();

    // Verify client exists
    const client = await dbService.getClient(client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Prepare campaign data
    const campaignData: any = {
      name,
      client_id,
      type,
      brief,
      deadline: deadline || null,
      campaign_context: [
        campaign_context,
        flow_type ? `Flow Type: ${flow_type}` : '',
        offer ? `Offer: ${offer}` : '',
        ab_test ? `A/B Test: ${ab_test}` : '',
        relevant_links ? `Important Links: ${relevant_links}` : ''
      ].filter(Boolean).join('\n\n')
    };

    // Create campaign
    const campaign = await dbService.createCampaign(campaignData);

    // TODO: Trigger automatic website scraping for this campaign
    // This would integrate with your Perplexity workflow
    if (client.website_url) {
      // Schedule background research job
      // await scheduleWebsiteResearch(campaign.id, client.website_url, flow_type, relevant_links);
    }

    return NextResponse.json({
      data: {
        ...campaign,
        client: {
          id: client.id,
          name: client.name,
          company: client.company,
          website_url: client.website_url
        }
      },
      message: 'Campaign created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Campaign creation error:', error);
    
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