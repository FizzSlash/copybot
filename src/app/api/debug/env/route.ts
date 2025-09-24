import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    airtableToken: process.env.AIRTABLE_TOKEN ? 'SET' : 'NOT SET',
    airtableBaseId: process.env.AIRTABLE_BASE_ID ? 'SET' : 'NOT SET',
    claudeKey: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    // Don't expose actual values, just whether they're set
    tokenPrefix: process.env.AIRTABLE_TOKEN?.substring(0, 6) || 'MISSING',
    baseIdPrefix: process.env.AIRTABLE_BASE_ID?.substring(0, 6) || 'MISSING'
  });
}