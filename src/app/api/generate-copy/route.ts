import { NextRequest, NextResponse } from 'next/server';
import { ClaudeService } from '@/lib/claude';
import { DatabaseService } from '@/lib/supabase';
import type { CopyGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CopyGenerationRequest = await request.json();
    const { campaign_id, copy_type, tone, length, focus, additional_context } = body;

    // Validate required fields
    if (!campaign_id || !copy_type) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id and copy_type' },
        { status: 400 }
      );
    }

    // Initialize services
    const dbService = new DatabaseService();
    const claudeService = new ClaudeService();

    // Get campaign with all related data
    const campaign = await dbService.getCampaign(campaign_id);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const client = await dbService.getClient(campaign.client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get additional context data
    const [clientNotes, scrapedContent] = await Promise.all([
      dbService.getClientNotes(campaign.client_id),
      dbService.getScrapedContent(campaign.client_id)
    ]);

    // Prepare context for AI generation
    const context = {
      client,
      campaign,
      clientNotes,
      scrapedContent
    };

    // Generate copy using Claude
    const generatedCopy = await claudeService.generateEmailCopy(body, context);

    // Save the generated copy to database
    const savedCopy = await dbService.createEmailCopy({
      campaign_id,
      subject_line: generatedCopy.subject_lines[0], // Use first subject line as primary
      preview_text: generatedCopy.preview_text,
      email_body: generatedCopy.email_body,
      copy_type,
      version: 1, // This should be calculated based on existing copies
      is_active: true
    });

    // Return the generated copy with additional options
    return NextResponse.json({
      data: {
        id: savedCopy.id,
        ...generatedCopy,
        campaign_id,
        copy_type,
        version: savedCopy.version,
        created_at: savedCopy.created_at
      },
      message: 'Email copy generated successfully'
    });

  } catch (error) {
    console.error('Copy generation error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate email copy')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }
      
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

// Optional: GET route to retrieve existing copy
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaign_id');

  if (!campaignId) {
    return NextResponse.json(
      { error: 'Missing campaign_id parameter' },
      { status: 400 }
    );
  }

  try {
    const dbService = new DatabaseService();
    const emailCopies = await dbService.getEmailCopy(campaignId);

    return NextResponse.json({
      data: emailCopies,
      message: 'Email copies retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving email copies:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve email copies' },
      { status: 500 }
    );
  }
}