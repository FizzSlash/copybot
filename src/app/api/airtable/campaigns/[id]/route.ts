import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔄 AIRTABLE UPDATE API: Updating campaign...');
  console.log('📝 AIRTABLE UPDATE API: Campaign ID:', params.id);
  
  try {
    const body = await request.json();
    console.log('📥 AIRTABLE UPDATE API: Request body:', body);
    
    const { copyLink } = body;
    
    if (!copyLink) {
      return NextResponse.json({
        success: false,
        message: 'Copy link is required'
      }, { status: 400 });
    }
    
    const airtableService = new AirtableService();
    const updatedRecord = await airtableService.updateCampaignCopyLink(params.id, copyLink);
    
    console.log('✅ AIRTABLE UPDATE API: Campaign updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
      data: updatedRecord
    });
    
  } catch (error) {
    console.error('❌ AIRTABLE UPDATE API: Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update campaign'
    }, { status: 500 });
  }
}