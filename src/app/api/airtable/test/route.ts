import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  console.log('🧪 AIRTABLE TEST API: Starting connection test...');
  
  try {
    const airtableService = new AirtableService();
    const result = await airtableService.testConnection();
    
    if (result.success) {
      console.log('✅ AIRTABLE TEST API: Connection successful');
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      console.log('❌ AIRTABLE TEST API: Connection failed');
      return NextResponse.json({
        success: false,
        message: result.message,
        data: result.data
      }, { status: 500 });
    }
  } catch (error) {
    console.error('💥 AIRTABLE TEST API: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error
    }, { status: 500 });
  }
}