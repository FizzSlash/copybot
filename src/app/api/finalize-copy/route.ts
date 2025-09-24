import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable';
import { DatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 FINALIZE COPY API: Starting copy finalization...');
    
    const body = await request.json();
    const { 
      copyData,
      campaignInfo,
      selectedSubject,
      selectedPreview 
    } = body;

    console.log('📥 FINALIZE COPY API: Received data:', {
      campaignName: campaignInfo?.campaignName,
      client: campaignInfo?.client,
      blockCount: copyData?.email_blocks?.length,
      airtableId: campaignInfo?.airtableId
    });

    if (!campaignInfo || !copyData) {
      throw new Error('Missing required data: campaignInfo or copyData');
    }

    // Step 1: Save copy data to database
    console.log('💾 FINALIZE COPY API: Saving copy to database...');
    const savedCopy = await saveCopyData(copyData, campaignInfo, selectedSubject, selectedPreview);
    
    // Step 2: Create shareable URL
    const shareableUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/campaigns/view/${savedCopy.id}?readonly=true`;
    console.log('🔗 FINALIZE COPY API: Created shareable URL:', shareableUrl);
    
    // Step 3: Update Airtable with shareable link AND stage (skip if test data)
    if (campaignInfo.airtableId && campaignInfo.airtableId !== 'test') {
      console.log('🔗 FINALIZE COPY API: Updating Airtable with shareable link and stage...');
      try {
        await updateAirtableCopyLink(campaignInfo.airtableId, shareableUrl);
      } catch (airtableError) {
        console.log('⚠️ FINALIZE COPY API: Airtable update failed, but copy still saved:', airtableError);
        // Don't fail the whole process if Airtable update fails
      }
    } else {
      console.log('📝 FINALIZE COPY API: Skipping Airtable update (test mode)');
    }
    
    console.log('✅ FINALIZE COPY API: Copy successfully finalized!');
    
    return NextResponse.json({
      success: true,
      shareableUrl: shareableUrl,
      copyId: savedCopy.id,
      message: 'Copy finalized and added to Airtable'
    });

  } catch (error: any) {
    console.error('❌ FINALIZE COPY API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to finalize copy'
    }, { status: 500 });
  }
}

async function saveCopyData(copyData: any, campaignInfo: any, selectedSubject: number, selectedPreview: number) {
  console.log('💾 Saving copy data to database...');
  
  const dbService = new DatabaseService();
  
  const copyRecord = {
    campaign_name: campaignInfo.campaignName,
    client: campaignInfo.client,
    send_date: campaignInfo.sendDate,
    subject_lines: copyData.subject_lines,
    preview_text: copyData.preview_text,
    email_blocks: copyData.email_blocks,
    selected_subject: selectedSubject,
    selected_preview: selectedPreview,
    airtable_id: campaignInfo.airtableId
  };
  
  const savedCopy = await dbService.saveCopy(copyRecord);
  console.log('✅ Copy saved with ID:', savedCopy.id);
  
  return savedCopy;
}

async function updateAirtableCopyLink(airtableId: string, shareableUrl: string) {
  console.log('🔗 Updating Airtable record:', airtableId);
  
  try {
    // Use the same AirtableService that works for campaigns
    const airtableService = new AirtableService();
    
    // Update the Copy Link field using the working service
    const updatedRecord = await airtableService.updateCampaignCopyLink(airtableId, shareableUrl);
    
    console.log('✅ Airtable updated successfully');
    return updatedRecord;
  } catch (error) {
    console.error('❌ Airtable update error:', error);
    throw error;
  }
}
