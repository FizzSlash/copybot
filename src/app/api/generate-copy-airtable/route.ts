import { NextRequest, NextResponse } from 'next/server';
import { ClaudeService } from '@/lib/claude';
import { DatabaseService } from '@/lib/supabase';

// Copy generation specifically for Airtable campaigns
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 AIRTABLE COPY API: Starting copy generation...');
    
    const body = await request.json();
    const { 
      campaign_context, 
      copy_type, 
      tone, 
      length, 
      focus, 
      additional_context,
      feedback_mode = false
    } = body;

    console.log('📥 AIRTABLE COPY API: Request data:', {
      copy_type,
      tone,
      length,
      focus,
      feedback_mode,
      has_campaign_context: !!campaign_context,
      has_additional_context: !!additional_context
    });

    // Validate required fields
    if (!copy_type) {
      return NextResponse.json(
        { error: 'Missing required field: copy_type' },
        { status: 400 }
      );
    }

    // Parse campaign context
    let parsedContext;
    try {
      parsedContext = typeof campaign_context === 'string' ? JSON.parse(campaign_context) : campaign_context;
    } catch (error) {
      console.error('❌ AIRTABLE COPY API: Failed to parse campaign context:', error);
      return NextResponse.json(
        { error: 'Invalid campaign context format' },
        { status: 400 }
      );
    }

    console.log('🧠 AIRTABLE COPY API: Parsed context:', {
      campaignName: parsedContext?.campaign?.name,
      clientName: parsedContext?.campaign?.client,
      hasClientData: !!parsedContext?.client,
      hasBrandGuidelines: !!parsedContext?.client?.brandGuidelines
    });

    // Initialize Claude service
    const claudeService = new ClaudeService();

    // Build context for Claude
    const contextPrompt = `
CAMPAIGN DETAILS:
- Campaign: ${parsedContext?.campaign?.name || 'Not specified'}
- Client: ${parsedContext?.campaign?.client || 'Not specified'}
- Send Date: ${parsedContext?.campaign?.sendDate || 'Not specified'}
- Stage: ${parsedContext?.campaign?.stage || 'Not specified'}
- Campaign Notes: ${parsedContext?.campaign?.notes || 'None'}

CLIENT BRAND CONTEXT:
${parsedContext?.client ? `
- Company: ${parsedContext.client.company || 'Not specified'}
- Website: ${parsedContext.client.website || 'Not specified'}
- Target Audience: ${parsedContext.client.brandGuidelines?.target_audience || 'Not specified'}
- Brand Voice: ${parsedContext.client.brandGuidelines?.brand_voice || 'Not specified'}
- Key Messaging: ${parsedContext.client.brandGuidelines?.key_messaging || 'Not specified'}
- Content Preferences: ${parsedContext.client.brandGuidelines?.content_preferences || 'Not specified'}
- Tone Examples: ${parsedContext.client.brandGuidelines?.tone_examples || 'Not specified'}
` : 'No client brand guidelines available - will use general best practices'}

COPY REQUIREMENTS:
- Type: ${copy_type}
- Tone: ${tone || 'professional'}
- Length: ${length || 'medium'}
- Focus: ${focus || 'General campaign focus'}

${additional_context ? `ADDITIONAL CONTEXT:\n${additional_context}` : ''}

${feedback_mode ? 'This is a revision based on feedback. Please improve the copy according to the feedback provided.' : 'This is the initial copy generation.'}
    `;

    console.log('🤖 AIRTABLE COPY API: Generating copy with Claude...');

    // Build the copy generation request object (first parameter)
    const copyRequest = {
      campaign_id: parsedContext?.campaign?.name || 'airtable-campaign',
      copy_type,
      tone: tone || 'professional',
      length: length || 'medium',
      focus: focus || '',
      additional_context: additional_context || ''
    };

    // Build the enhanced context object (second parameter)  
    const enhancedContext = {
      client: parsedContext?.client ? {
        name: parsedContext.client.name || parsedContext.campaign?.client,
        company: parsedContext.client.company || parsedContext.campaign?.client,
        website_url: parsedContext.client.website,
        brand_questionnaire: parsedContext.client.brandGuidelines || {}
      } : {
        name: parsedContext?.campaign?.client || 'Unknown Client',
        company: parsedContext?.campaign?.client || 'Unknown Company',
        website_url: '',
        brand_questionnaire: {}
      },
      campaign: {
        name: parsedContext?.campaign?.name || 'Unnamed Campaign',
        brief: parsedContext?.campaign?.notes || '',
        campaign_context: contextPrompt,
        type: 'campaign'
      },
      clientNotes: [],
      scrapedContent: [],
      flow_details: {},
      offer_details: parsedContext?.campaign?.offer || {},
      ab_test_focus: parsedContext?.campaign?.abTest || '',
      relevant_links: parsedContext?.campaign?.relevantLinks || ''
    };

    console.log('📊 AIRTABLE COPY API: Copy request object:', copyRequest);
    console.log('📊 AIRTABLE COPY API: Enhanced context:', enhancedContext);

    // Generate copy with Claude (correct parameter format)
    const generatedCopy = await claudeService.generateEmailCopyAdvanced(copyRequest, enhancedContext);

    console.log('✅ AIRTABLE COPY API: Copy generated successfully');
    console.log('📄 AIRTABLE COPY API: Generated copy structure:', generatedCopy);

    // Return the generated copy (don't save to database yet - this is for editing)
    return NextResponse.json({
      success: true,
      data: generatedCopy,
      message: 'Copy generated successfully'
    });

  } catch (error) {
    console.error('❌ AIRTABLE COPY API: Generation error:', error);
    console.error('🔍 AIRTABLE COPY API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred during copy generation' },
      { status: 500 }
    );
  }
}