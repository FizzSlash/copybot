import { NextRequest, NextResponse } from 'next/server';
import { ClaudeService } from '@/lib/claude';
import { DatabaseService } from '@/lib/supabase';

// Enhanced copy generation that mimics your Make.com workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Step 1: Get campaign and client data
    const campaign = await dbService.getCampaign(campaign_id);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const client = await dbService.getClient(campaign.client_id as string);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Step 2: Get additional context data
    const [clientNotes, scrapedContent] = await Promise.all([
      dbService.getClientNotes(campaign.client_id as string),
      dbService.getScrapedContent(campaign.client_id as string)
    ]);

    // Step 3: Enhanced context assembly (like your Make.com flow)
    const enhancedContext = {
      client,
      campaign,
      clientNotes,
      scrapedContent,
      // Additional context from your automation patterns
      flow_details: extractFlowDetails(campaign, copy_type),
      offer_details: extractOfferFromContext(campaign.campaign_context),
      ab_test_focus: extractABTestFocus(campaign.campaign_context),
      relevant_links: extractRelevantLinks(campaign.campaign_context)
    };

    // Step 4: Generate copy using enhanced prompts (like your system)
    const generatedCopy = await claudeService.generateEmailCopyAdvanced(
      {
        campaign_id,
        copy_type,
        tone,
        length,
        focus,
        additional_context
      },
      enhancedContext
    );

    // Step 5: Format for HTML email structure (like your table format)
    const formattedCopy = formatCopyAsHTMLTable(generatedCopy);

    // Step 6: Save the generated copy to database
    const savedCopy = await dbService.createEmailCopy({
      campaign_id,
      subject_line: generatedCopy.subject_lines[0],
      preview_text: generatedCopy.preview_text,
      email_body: formattedCopy.html_body,
      copy_type: copy_type as any,
      version: 1,
      is_active: true
    });

    // Step 7: Create Google Doc (like your automation)
    // TODO: Integrate with Google Docs API
    const googleDocLink = await createGoogleDoc(campaign.name, formattedCopy.html_body);

    // Return comprehensive results
    return NextResponse.json({
      data: {
        id: savedCopy.id,
        subject_lines: generatedCopy.subject_lines,
        preview_text: generatedCopy.preview_text,
        email_body: formattedCopy.html_body,
        google_doc_link: googleDocLink,
        alternative_versions: generatedCopy.alternative_versions,
        research_summary: 'Website research and brand analysis completed',
        campaign_id,
        copy_type,
        version: savedCopy.version,
        created_at: savedCopy.created_at
      },
      message: 'Enhanced email copy generated successfully with Google Doc'
    });

  } catch (error) {
    console.error('Advanced copy generation error:', error);
    
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

// Helper functions to extract context (like your Make.com data mapping)
function extractFlowDetails(campaign: any, copy_type: string): string {
  const context = campaign.campaign_context?.toLowerCase() || '';
  
  if (copy_type === 'welcome' || context.includes('welcome')) {
    return 'welcome';
  } else if (copy_type === 'abandoned_cart' || context.includes('cart')) {
    return 'abandoned cart';
  } else if (context.includes('browse')) {
    return 'browse abandonment';
  } else if (context.includes('post') || context.includes('purchase')) {
    return 'post purchase';
  }
  
  return copy_type;
}

function extractOfferFromContext(context: string): string {
  const offerMatch = context?.match(/offer[:\s]+([^\\n]+)/i);
  return offerMatch ? offerMatch[1].trim() : '';
}

function extractABTestFocus(context: string): string {
  const abTestMatch = context?.match(/a\/b test[:\s]+([^\\n]+)/i);
  return abTestMatch ? abTestMatch[1].trim() : '';
}

function extractRelevantLinks(context: string): string {
  const linksMatch = context?.match(/(?:important |relevant )?links?[:\s]+([^\\n]+)/i);
  return linksMatch ? linksMatch[1].trim() : '';
}

// Format copy as HTML table structure (like your Make.com output)
function formatCopyAsHTMLTable(copyData: any): { html_body: string } {
  const htmlTable = `
<table width="100%" cellpadding="0" cellspacing="0" border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold; width: 150px;">SUBJECT</td>
    <td style="padding: 15px;">${copyData.subject_lines[0]}</td>
  </tr>
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold;">PREVIEW</td>
    <td style="padding: 15px;">${copyData.preview_text}</td>
  </tr>
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold;">HEADER</td>
    <td style="padding: 15px; font-size: 24px; font-weight: bold;">Welcome to [Brand Name]</td>
  </tr>
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold;">SUBHEADER</td>
    <td style="padding: 15px; font-size: 18px;">Your pathway to better [product category]</td>
  </tr>
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold;">BODY</td>
    <td style="padding: 15px;">${copyData.email_body.substring(0, 160)}...</td>
  </tr>
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold;">CTA</td>
    <td style="padding: 15px;"><strong style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Shop Now</strong></td>
  </tr>
  <tr>
    <td style="background-color: #f8f9fa; padding: 15px; font-weight: bold;">FOOTER</td>
    <td style="padding: 15px; font-size: 12px; color: #666;">Standard email footer with unsubscribe link</td>
  </tr>
</table>`;

  return {
    html_body: htmlTable
  };
}

// Create Google Doc (placeholder for your Google Drive integration)
async function createGoogleDoc(campaignName: string, content: string): Promise<string> {
  // TODO: Integrate with Google Docs API like your Make.com automation
  // This would create the document and return a shareable link
  
  // For now, return a placeholder link
  // In your real implementation, this would:
  // 1. Create Google Doc with content
  // 2. Share it publicly
  // 3. Return the shareable link
  
  return `https://docs.google.com/document/placeholder-for-${campaignName.replace(/\s+/g, '-').toLowerCase()}`;
}