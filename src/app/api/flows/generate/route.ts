import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('⚡ FLOW GENERATION API: Starting flow email generation...');
    
    const body = await request.json();
    const { strategy, client } = body;

    console.log('📥 FLOW GENERATION API: Received strategy:', {
      flowType: strategy?.flowType,
      emailCount: strategy?.emailStrategies?.length,
      clientName: client?.company || client?.name
    });

    if (!strategy || !strategy.emailStrategies) {
      return NextResponse.json({ error: 'Missing strategy data' }, { status: 400 });
    }

    // Generate each email based on the approved strategy
    const generatedEmails = [];
    
    for (let i = 0; i < strategy.emailStrategies.length; i++) {
      const emailStrategy = strategy.emailStrategies[i];
      
      console.log(`📧 FLOW GENERATION API: Generating email ${emailStrategy.emailNumber}...`);
      
      try {
        // Generate individual email using the same copy generation API
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-copy-simple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_context: JSON.stringify({
              campaign: {
                name: `${strategy.flowType} - Email ${emailStrategy.emailNumber}: ${emailStrategy.theme}`,
                client: strategy.client,
                sendDate: `Day ${emailStrategy.day}`,
                notes: `${emailStrategy.focus}. Key message: ${emailStrategy.keyMessage}. Products to feature: ${emailStrategy.products}. ${emailStrategy.hasOffer ? `Include offer: ${emailStrategy.offerType || strategy.offer}` : 'No offer in this email.'}`
              },
              client: client ? {
                name: client.name,
                company: client.company,
                website: client.website_url,
                brandGuidelines: client.brand_questionnaire
              } : null
            }),
            copy_type: 'promotional',
            tone: 'designed',
            length: 'medium', // Default medium length as requested
            focus: emailStrategy.focus,
            additional_context: `This is email ${emailStrategy.emailNumber} of ${strategy.emailStrategies.length} in a ${strategy.flowType} flow. ${emailStrategy.hasOffer ? `This email should include the offer: ${strategy.offer}` : 'This email should NOT include any offers - focus on building trust and value.'}`
          })
        });

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          generatedEmails.push({
            emailNumber: emailStrategy.emailNumber,
            day: emailStrategy.day,
            theme: emailStrategy.theme,
            strategy: emailStrategy,
            copyData: emailData.data,
            hasOffer: emailStrategy.hasOffer
          });
          console.log(`✅ FLOW GENERATION API: Email ${emailStrategy.emailNumber} generated successfully`);
        } else {
          throw new Error(`Failed to generate email ${emailStrategy.emailNumber}`);
        }
      } catch (emailError) {
        console.error(`❌ FLOW GENERATION API: Error generating email ${emailStrategy.emailNumber}:`, emailError);
        // Continue with other emails, don't fail the whole flow
        generatedEmails.push({
          emailNumber: emailStrategy.emailNumber,
          day: emailStrategy.day,
          theme: emailStrategy.theme,
          strategy: emailStrategy,
          copyData: {
            subject_lines: [`${emailStrategy.theme} - ${strategy.client}`],
            preview_text: [emailStrategy.keyMessage],
            email_blocks: [
              { type: 'header', content: emailStrategy.theme },
              { type: 'body', content: emailStrategy.focus },
              { type: 'cta', content: 'Learn More', link: '#' }
            ]
          },
          hasOffer: emailStrategy.hasOffer,
          error: 'Generation failed - using fallback content'
        });
      }
    }
    
    const flowData = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      strategy: strategy,
      emails: generatedEmails,
      created_at: new Date().toISOString()
    };
    
    console.log('✅ FLOW GENERATION API: Complete flow generated successfully');
    
    return NextResponse.json({
      success: true,
      data: flowData
    });

  } catch (error: any) {
    console.error('❌ FLOW GENERATION API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate flow emails'
    }, { status: 500 });
  }
}