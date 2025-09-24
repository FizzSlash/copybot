import { NextRequest, NextResponse } from 'next/server';

// Simple copy generation for interactive editor
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 SIMPLE COPY API: Starting copy generation...');
    
    const body = await request.json();
    const { 
      campaign_context, 
      copy_type, 
      tone, 
      length, 
      focus, 
      additional_context,
      feedback_mode = false,
      flow_context = null,
      revision_feedback = null,
      current_copy = null
    } = body;

    console.log('📥 SIMPLE COPY API: Request data:', {
      copy_type,
      tone,
      length,
      focus,
      feedback_mode,
      isFlowEmail: !!flow_context,
      isRevision: !!revision_feedback
    });

    // Parse campaign context
    let parsedContext;
    try {
      parsedContext = typeof campaign_context === 'string' ? JSON.parse(campaign_context) : campaign_context;
    } catch (parseError) {
      console.error('❌ SIMPLE COPY API: Failed to parse campaign context:', parseError);
      return NextResponse.json({ error: 'Invalid campaign context format' }, { status: 400 });
    }

    // Check if campaign context should override length constraints
    const hasDetailedContext = parsedContext?.notes && parsedContext.notes.trim().length > 50;
    const shouldOverrideLength = hasDetailedContext;
    
    console.log('📋 CONTENT ANALYSIS:', {
      originalLength: length,
      hasDetailedContext: hasDetailedContext,
      shouldOverrideLength: shouldOverrideLength,
      campaignNotes: parsedContext?.notes
    });

    // Try to scrape website for real product data if available
    if (parsedContext?.client?.website && parsedContext.client.website !== '#') {
      try {
        console.log('🔍 SIMPLE COPY API: Scraping website for product data:', parsedContext.client.website);
        // Note: In production you'd make an HTTP request here
        // For now we'll just log that scraping would happen
        console.log('📝 SIMPLE COPY API: Website scraping integration ready');
      } catch (scrapeError) {
        console.log('⚠️ SIMPLE COPY API: Website scraping failed:', scrapeError);
      }
    } else {
      console.log('📝 SIMPLE COPY API: No website URL available for scraping');
    }

    // Build simple, direct prompt for Claude
    const prompt = `You are a professional email marketing copywriter specializing in high-performance sports and outdoor brands. ${revision_feedback ? 'Revise existing email copy based on specific feedback.' : 'Create comprehensive, detailed email copy that drives conversions.'}

⚠️ CRITICAL: DO NOT MAKE UP FACTS, PRODUCT SPECS, OR CLAIMS. Use only the information provided in the context below. If specific product details aren't provided, use general language like "innovative features" rather than inventing specifications.

${revision_feedback ? `
🔄 REVISION REQUEST:
You are revising existing email copy based on this specific feedback: "${revision_feedback}"

CURRENT EMAIL COPY TO REVISE:
Subject Lines: ${current_copy?.subject_lines?.join(', ') || 'Not provided'}
Preview Text: ${current_copy?.preview_text?.join(', ') || 'Not provided'}
Current Blocks: ${current_copy?.email_blocks?.length || 0} blocks

REVISION INSTRUCTIONS:
- Address the specific feedback provided: "${revision_feedback}"
- Keep what's working well from the current copy
- Make targeted improvements based on the feedback
- If feedback mentions quantity (e.g., "need 3 reviews"), ensure you create enough content blocks to fulfill that requirement
- Maintain the overall campaign context and brand voice
- Focus on the specific improvement requested

CURRENT EMAIL BLOCKS TO REVISE:
${current_copy?.email_blocks?.map((block: any, index: number) => `Block ${index + 1} (${block.type}): ${block.content}`).join('\n') || 'No current blocks'}

` : ''}

CAMPAIGN DETAILS:
- Campaign: ${parsedContext?.campaign?.name || 'Email Campaign'}
- Client: ${parsedContext?.campaign?.client || 'Client'}
- Send Date: ${parsedContext?.campaign?.sendDate || 'Not specified'}
- Stage: ${parsedContext?.campaign?.stage || 'Not specified'}

CAMPAIGN NOTES: ${parsedContext?.campaign?.notes || 'None provided'}

CLIENT BRAND CONTEXT:
- Company: ${parsedContext?.client?.company || parsedContext?.campaign?.client || 'Client'}
- Website: ${parsedContext?.client?.website || '#'}
- Brand Voice: ${parsedContext?.client?.brandGuidelines?.brand_voice || 'Professional and authoritative with emphasis on quality and performance'}
- Target Audience: ${parsedContext?.client?.brandGuidelines?.target_audience || 'Performance-oriented enthusiasts'}
- Key Messaging: ${parsedContext?.client?.brandGuidelines?.key_messaging || 'Quality, performance, and reliability'}

${parsedContext?.scrapedContent ? `WEBSITE CONTENT (Use this for accurate product info):
${parsedContext.scrapedContent}` : 'No website content available - use general themes only.'}

COPY REQUIREMENTS:
- Campaign Type: ${copy_type} (promotional = sales focus, educational = informational content)
- Format: ${tone || 'designed'} (designed = structured blocks, plain = simple text)
- Email Length: ${length || 'medium'} 

${additional_context ? `ADDITIONAL CONTEXT: ${additional_context}` : ''}

${shouldOverrideLength ? `
🚨 CAMPAIGN CONTEXT OVERRIDE:
The campaign notes provide detailed content requirements that must be fully addressed.

⚠️ CRITICAL INSTRUCTION: Campaign content takes precedence over default length settings.
- Create as many blocks as needed to properly cover all content mentioned in the campaign notes
- If the notes mention multiple items (reviews, products, features, etc.), ensure each gets adequate treatment
- Prioritize thorough coverage over rigid block count limits
- The goal is comprehensive content that matches campaign requirements

CONTENT-DRIVEN APPROACH:
- Let the campaign context dictate the necessary length
- Create enough blocks to properly address all mentioned content
- Don't artificially limit content if more blocks are needed for completeness
- Quality coverage of campaign requirements > arbitrary block limits
` : `EMAIL LENGTH TARGET:
${length === 'short' ? '🎯 Create 5-8 focused content blocks.' : 
  length === 'long' ? '🎯 Create 12-15 comprehensive content blocks with detailed sections.' :
  '🎯 Create 8-12 well-rounded content blocks.'}

Standard length guidelines apply when no specific context override is needed.`}

${flow_context ? `
🔥 FLOW STRATEGIC CONTEXT:
This is EMAIL ${flow_context.currentEmailNumber} of ${flow_context.totalEmails} in a strategic ${flow_context.flowType.toUpperCase()} FLOW.

OTHER EMAILS IN THIS FLOW:
${flow_context.otherEmailSummaries || 'No other email context provided'}

🚨 CRITICAL DIFFERENTIATION RULES:
- This email must feel COMPLETELY DIFFERENT from other emails in the flow
- Do NOT use generic "why choose us" or "quality/performance" content unless specifically required for THIS email's theme
- Do NOT repeat themes, messaging, or content structure from other emails
- Focus EXCLUSIVELY on this email's unique strategic role: ${flow_context.uniqueFocus || 'Unique strategic focus'}
- Create content blocks that serve THIS email's specific purpose only

${flow_context.previousEmails ? `AVOID repeating content from previous emails: ${flow_context.previousEmails}` : ''}
${flow_context.upcomingEmails ? `Upcoming emails will cover: ${flow_context.upcomingEmails} - do not preview these topics` : ''}

FLOW-SPECIFIC STRATEGY:
${getFlowSpecificInstructions(flow_context)}

` : ''}EMAIL FLOW STRATEGY - Follow these universal principles for ANY campaign:

🚨 CRITICAL: Include a CTA within the first 3-4 blocks (above the fold)

UNIVERSAL FLOW PRINCIPLES:
1. HOOK: Start with attention-grabbing benefit/value (1-2 blocks)
2. EARLY ACTION: Place first CTA within blocks 3-4 (above the fold)
3. AMPLIFY: Build desire with details, proof, features (blocks 5-7) 
4. URGENCY: Create time-sensitive reason to act (blocks 8-10)
5. FINAL PUSH: Strong closing CTA with clear next step

STRATEGIC GUIDELINES:
- Lead with the strongest benefit/value proposition
- Support claims with credibility (reviews, testimonials, social proof)
- Create multiple conversion opportunities (early + final CTA)
- Build urgency without being pushy
- Each block should advance the sale or build desire

BLOCK SEQUENCING RULES:
- Never bury the first CTA below block 4
- Group related content (don't jump between unrelated topics)
- Place social proof near the products/claims it supports
- Save strongest urgency for the end sequence
- Always end with clear, specific action

PRODUCT BLOCK STRATEGY - Every product must have INTENTION:
🚨 CRITICAL: Each product block must have a clear strategic purpose and narrative reason

PRODUCT POSITIONING OPTIONS:
1. SINGLE HERO: Focus on one main product throughout the email
2. PRODUCT CHOICE: "Choose your adventure" - different products for different needs
3. PRODUCT PROGRESSION: Entry-level → Premium upsell with logical transition
4. PRODUCT BUNDLE: Related products that work together

PRODUCT INTRODUCTION RULES:
- Never introduce products without setup/context
- Explain WHY this product (what problem does it solve?)
- If multiple products, clearly differentiate their purposes
- Use subheaders to set up product introductions
- Examples:
  ✅ "CHOOSE YOUR FALL ADVENTURE" → JoyRide vs Paradise
  ✅ "READY FOR LONGER EXPEDITIONS?" → Upsell transition
  ✅ "THE COMPLETE TOURING SETUP" → Bundle positioning
  ❌ Random product appearance after unrelated content

EVERY BLOCK TEST: Ask "Why is this here? What job does it do in converting the reader?"

FOR SPORTS/OUTDOOR BRANDS INCLUDE:
- Product benefits (based on provided context only)
- Performance themes (without specific claims unless provided)
- Social proof concepts (without fabricating specific testimonials)
- Multiple product features (using general language unless specifics provided)
- Professional usage themes (without making up specific endorsements)
- Event/achievement themes (only if mentioned in campaign notes)

⚠️ CONTENT RULES:
- DO NOT invent specific product specifications, prices, or technical details
- DO NOT create fake athlete names, race results, or testimonials  
- DO NOT make specific performance claims without context support
- DO use general themes like "trusted by professionals" instead of "used by Team XYZ"
- DO use placeholder language like "Ask [contact] for [specific asset]" for images/details
- DO focus on brand voice and messaging themes from the provided context

BLOCK TYPES TO USE:
- "header": Compelling headlines (punchy, under 60 characters)
- "subheader": Section dividers and supporting headlines
- "body": Detailed content paragraphs (can be comprehensive for sports content)
- "pic": Image placeholders with specific instructions (e.g., "Ask Timmy for race photos")
- "cta": Call-to-action buttons with link URLs  
- "product": Product spotlight blocks with title, description, CTA text, and link

OUTPUT FORMAT - Respond with ONLY valid JSON (no backticks, no markdown):
{
  "subject_lines": [
    "Compelling Subject Line 1",
    "Alternative Subject Line 2", 
    "Third Option Subject Line"
  ],
  "preview_text": [
    "Engaging preview text option 1",
    "Alternative preview text 2",
    "Third preview option"
  ],
  "email_blocks": [
    {
      "type": "header",
      "content": "COMPELLING HEADLINE"
    },
    {
      "type": "body", 
      "content": "Detailed paragraph content..."
    },
    {
      "type": "pic",
      "content": "Image description and sourcing instructions"
    },
    {
      "type": "cta",
      "content": "BUTTON TEXT",
      "link": "https://brand-website.com/product-url"
    },
    {
      "type": "product", 
      "content": "Product Name",
      "description": "Product description and benefits...",
      "cta": "SHOP PRODUCT",
      "link": "https://brand-website.com/product-url"
    }
  ]
}

Create email copy that matches the quality and detail level of professional sports marketing campaigns. Be specific, engaging, and conversion-focused.

⚠️ FINAL REMINDER: Use ONLY the provided context. Do not invent product specifications, athlete names, race results, or specific claims. When in doubt, use general language and placeholder instructions like "Ask [contact] for [specific details]".

${flow_context ? `
🎯 FLOW EMAIL REMINDER: This email must be strategically unique within the flow sequence. Focus only on "${flow_context.uniqueFocus || 'this email\'s specific role'}" and avoid content covered by other emails.` : ''}`;

    console.log('🤖 SIMPLE COPY API: Generating with Claude...');
    
    // Initialize Claude service directly  
    try {
      // Import Claude directly
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      // Make Claude API call
      const claudeResponse = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const rawResponse = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
      console.log('📝 SIMPLE COPY API: Raw Claude response length:', rawResponse.length);
      console.log('📝 SIMPLE COPY API: First 500 chars:', rawResponse.substring(0, 500));

      // Parse Claude's response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error('❌ SIMPLE COPY API: Failed to parse Claude JSON, attempting extraction...');
        
        // Try to extract JSON from the response using regex
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            console.error('❌ SIMPLE COPY API: Failed to extract JSON, using fallback structure');
            throw new Error('Invalid JSON response from Claude');
          }
        } else {
          throw new Error('No JSON found in Claude response');
        }
      }

      // Clean up the parsed response
      if (parsedResponse) {
        // Ensure subject_lines and preview_text are arrays
        if (typeof parsedResponse.subject_lines === 'string') {
          parsedResponse.subject_lines = [parsedResponse.subject_lines];
        }
        if (typeof parsedResponse.preview_text === 'string') {
          parsedResponse.preview_text = [parsedResponse.preview_text];
        }

        // Ensure email_blocks is an array
        if (!Array.isArray(parsedResponse.email_blocks)) {
          parsedResponse.email_blocks = [];
        }
      }

      console.log('✅ SIMPLE COPY API: Final parsed structure:', JSON.stringify(parsedResponse, null, 2));

      return NextResponse.json({
        success: true,
        data: parsedResponse,
        message: 'Copy generated successfully'
      });

    } catch (claudeError: any) {
      console.error('❌ SIMPLE COPY API: Claude generation error:', claudeError);
      
      // Only use mock data if it's actually a Claude overload (529) or connection error
      const isClaudeOverloaded = claudeError.status === 529 || 
                                claudeError.message?.includes('overloaded') || 
                                claudeError.message?.includes('ENOTFOUND') ||
                                claudeError.message?.includes('Connection error');
      
      if (isClaudeOverloaded) {
        console.log('🔄 SIMPLE COPY API: Claude overloaded, using mock data for now...');
      
        // Create realistic mock data based on campaign context
        const campaignName = parsedContext?.campaign?.name || 'Campaign';
        const clientName = parsedContext?.campaign?.client || 'Client';
        const notes = parsedContext?.campaign?.notes || '';
        const website = parsedContext?.client?.website || '#';
        
        // Generate realistic copy based on the context
        let mockSubjects = [`New from ${clientName}`, `${campaignName}`, `Don't Miss This`];
        let mockPreview = [`See what's new from ${clientName}`];
        let mockBlocks = [];
        
        if (clientName === 'Hydrus' && campaignName.includes('Durable')) {
          mockSubjects = [
            "Built Tough. Tested Harder.",
            "The Most Durable Boards Ever Made", 
            "Rescue-Grade Paddleboards Built to Last"
          ];
          mockPreview = ["Trusted by rescue teams nationwide", "See our extreme durability testing", "Military-grade materials meet innovation"];
          
          // Generate length-appropriate content based on requested length
          const allBlocks = [
            { type: 'header', content: 'BUILT TO OUTLAST EVERYTHING' },
            { type: 'subheader', content: 'Trusted by rescue teams nationwide' },
            { type: 'body', content: 'Every Hydrus board undergoes rigorous testing in extreme conditions to ensure unmatched durability. When rescue teams need reliability, they choose Hydrus for professional-grade performance.' },
            { type: 'pic', content: 'Image of rescue team using Hydrus boards in extreme conditions. Ask Timmy for rescue team photo.' },
            { type: 'cta', content: 'SHOP HYDRUS BOARDS', link: 'https://www.hydrusboardtech.com/collections/all' },
            { type: 'subheader', content: 'EXTREME TESTING PROCESS' },
            { type: 'body', content: 'Our proprietary testing includes: Rocky river impacts, Class III rapid navigation, 1000-hour UV exposure, and sub-zero temperature cycling.' },
            { type: 'subheader', content: 'LIFETIME WARRANTY' },
            { type: 'body', content: 'We stand behind our quality with an industry-leading lifetime warranty. Because when you build the best, you can stand behind it forever.' },
            { type: 'subheader', content: 'HIGHEST REVIEWED ON THE PLANET' },
            { type: 'body', content: 'More verified 5-star reviews per board sold than any major brand—because we focus on delivering a better experience, every time.' },
            { type: 'product', content: 'HYDRUS JOYRIDE', description: 'Ultra-portable adventure board. 23 pounds and a real hiking backpack. Get to mountain lakes way off the beaten path!', cta: 'SHOP JOYRIDE', link: 'https://www.hydrusboardtech.com/products/joyride' },
            { type: 'product', content: 'HYDRUS PARADISE', description: 'All-around versatility meets extreme durability. Perfect for everything from calm lakes to challenging rivers.', cta: 'SHOP PARADISE', link: 'https://www.hydrusboardtech.com/products/paradise' },
            { type: 'subheader', content: 'PROFESSIONAL TESTIMONIALS' },
            { type: 'body', content: '★★★★★ "Most durable board I\'ve ever owned. Period." - Professional River Guide, Colorado' },
          ];
          
          // Slice based on length requirement
          if (length === 'short') {
            mockBlocks = allBlocks.slice(0, 6); // 6 blocks for short
          } else if (length === 'long') {
            mockBlocks = allBlocks.slice(0, 14); // 14 blocks for long
          } else {
            mockBlocks = allBlocks.slice(0, 10); // 10 blocks for medium
          }
          
        } else {
          // Generic fallback content with proper block count
          const genericBlocks = [
            { type: 'header', content: campaignName },
            { type: 'subheader', content: `From ${clientName}` },
            { type: 'body', content: notes || 'Discover our latest products and innovations designed for performance.' },
            { type: 'pic', content: 'Product showcase image. Ask team for visual assets.' },
            { type: 'cta', content: 'Shop Now', link: website },
            { type: 'subheader', content: 'Why Choose Us' },
            { type: 'body', content: 'Quality, performance, and customer satisfaction are at the core of everything we do.' },
            { type: 'body', content: 'Join thousands of satisfied customers who trust us for their needs.' },
            { type: 'cta', content: 'Learn More', link: website },
            { type: 'subheader', content: 'Limited Time' },
            { type: 'body', content: 'Don\'t miss out on this exclusive opportunity.' },
            { type: 'product', content: 'Featured Product', description: 'Our top-rated product combining innovation with reliability.', cta: 'Shop Product', link: website }
          ];
          
          // Slice based on length requirement
          if (length === 'short') {
            mockBlocks = genericBlocks.slice(0, 6);
          } else if (length === 'long') {
            mockBlocks = genericBlocks.slice(0, 12);
          } else {
            mockBlocks = genericBlocks.slice(0, 9);
          }
        }
        
        const parsedResponse = {
          subject_lines: mockSubjects,
          preview_text: mockPreview,
          email_blocks: mockBlocks
        };
        
        console.log('✅ SIMPLE COPY API: Using mock data while Claude recovers:', JSON.stringify(parsedResponse, null, 2));
        
        return NextResponse.json({
          success: true,
          data: parsedResponse,
          message: 'Copy generated successfully (using mock data - Claude API temporarily overloaded)'
        });
      } else {
        // Re-throw non-overload errors
        throw claudeError;
      }
    }

  } catch (error: any) {
    console.error('❌ SIMPLE COPY API: Generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Copy generation failed'
    }, { status: 500 });
  }
}

function getFlowSpecificInstructions(flowContext: any): string {
  const { flowType, currentEmailNumber } = flowContext;
  
  const instructions = {
    welcome: {
      1: "Focus ONLY on welcome excitement, first impressions, and community introduction. NO brand history, NO product details, NO generic benefits.",
      2: "Focus ONLY on brand origin story, founder journey, or company mission. NO welcome content, NO product features, NO generic quality claims.", 
      3: "Focus ONLY on product education, finding the right fit, or product categories. NO brand story, NO social proof, NO welcome content.",
      4: "Focus ONLY on customer testimonials, reviews, and social proof. NO product education, NO brand story, NO generic claims.",
      5: "Focus ONLY on behind-the-scenes content like manufacturing, team, or process. NO testimonials, NO product lists, NO brand history.",
      6: "Focus ONLY on complete collection overview or product range. NO behind-scenes content, NO individual product focus.",
      7: "Focus ONLY on motivation, journey-starting, and final activation. NO collection details, NO process content."
    },
    abandoned_checkout: {
      1: "Focus ONLY on gentle cart reminder. NO sales pressure, NO offers, NO generic content - just helpful reminder.",
      2: "Focus ONLY on social proof for cart items. Build confidence, NO sales pressure, NO generic benefits.",
      3: "Focus ONLY on overcoming price objections with soft incentive. First offer introduction, NO hard selling.",
      4: "Focus ONLY on urgency and final chance messaging. Strong incentive with time pressure, NO generic content."
    },
    browse_abandonment: {
      1: "Focus ONLY on helpful follow-up about browsed items. NO sales pressure, NO offers, just helpful information.",
      2: "Focus ONLY on educational content about browsed category. NO sales pressure, provide value first.",
      3: "Focus ONLY on social proof for browsed category with soft offer. NO hard selling, build confidence.",
      4: "Focus ONLY on urgency and limited-time offer. Strong incentive with time pressure."
    },
    post_purchase: {
      1: "Focus ONLY on gratitude and usage guidance. NO sales content, NO additional products, just appreciation.",
      2: "Focus ONLY on education and value maximization. NO sales, help them get the most from purchase.",
      3: "Focus ONLY on cross-sell complementary products. NO unrelated items, only logical additions.",
      4: "Focus ONLY on loyalty program and repeat purchase incentives. NO random products, focus on relationship."
    },
    winback: {
      1: "Focus ONLY on emotional reconnection. NO sales pressure, NO offers, just genuine 'we miss you' message.",
      2: "Focus ONLY on new products or improvements since they left. NO generic content, show real developments.",
      3: "Focus ONLY on moderate welcome-back incentive. NO hard selling, just friendly return offer.",
      4: "Focus ONLY on final strong incentive with urgency. Last chance messaging with best offer."
    }
  };
  
  const flowInstructions = instructions[flowType as keyof typeof instructions];
  if (flowInstructions && flowInstructions[currentEmailNumber as keyof typeof flowInstructions]) {
    return flowInstructions[currentEmailNumber as keyof typeof flowInstructions];
  }
  
  return `Focus exclusively on this email's unique strategic role within the ${flowType} flow sequence.`;
}