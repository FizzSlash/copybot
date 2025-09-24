import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  console.log('🔄 AIRTABLE CAMPAIGNS API: Fetching upcoming campaigns...');
  
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7');
    const testMode = searchParams.get('test') === 'true';
    
    console.log(`📅 AIRTABLE CAMPAIGNS API: Looking ${daysAhead} days ahead`);
    console.log(`🧪 AIRTABLE CAMPAIGNS API: Test mode: ${testMode}`);
    
    const airtableService = new AirtableService();
    
    let campaigns;
    if (testMode) {
      // Get all campaigns for testing/debugging
      campaigns = await airtableService.getAllCampaigns(20);
    } else {
      // Get active campaigns (past 7 days + future)
      campaigns = await airtableService.getActiveCampaigns();
    }
    
    console.log(`✅ AIRTABLE CAMPAIGNS API: Retrieved ${campaigns.length} campaigns`);
    
    // Transform data for frontend - bring in ALL fields
    const transformedCampaigns = campaigns.map(record => ({
      id: record.id,
      airtableId: record.id,
      name: record.fields.Tasks || 'Unnamed Campaign', // "Tasks" is the main campaign name field
      client: record.fields.Client || 'Unknown Client',
      sendDate: record.fields['Send Date'],
      copyDueDate: record.fields['Copy Due Date'],
      designDueDate: record.fields['Design Due Date'],
      stage: record.fields.Stage,
      notes: record.fields.Notes,
      copyLink: record.fields['Copy Link'],
      offer: record.fields.Offer,
      abTest: record.fields['A/B Test'],
      relevantLinks: record.fields['Relevant links'],
      campaignType: record.fields['Campaign Type'],
      type: record.fields.Type,
      assignee: record.fields.Assignee,
      
      // Additional fields for complete context
      clientRevisions: record.fields['Client Revisions'],
      attachments: record.fields.Attachments || record.fields.File || [], // File attachments/creative assets
      
      // Full raw data for debugging and future use
      rawFields: record.fields
    }));
    
    return NextResponse.json({
      success: true,
      campaigns: transformedCampaigns,
      count: campaigns.length,
      message: `Found ${campaigns.length} campaigns`,
      testMode
    });
    
  } catch (error) {
    console.error('❌ AIRTABLE CAMPAIGNS API: Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch campaigns',
      campaigns: [],
      count: 0
    }, { status: 500 });
  }
}