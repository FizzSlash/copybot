import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Claude API key not configured' 
        },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Test basic connection with a simple message
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Test connection - respond with "Connection successful"'
        }
      ]
    });

    return NextResponse.json({
      status: 'connected',
      message: 'Claude AI connection successful',
      test_response: message.content[0].type === 'text' ? message.content[0].text : 'Response received'
    });

  } catch (error) {
    console.error('Claude connection test failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Claude AI connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}