import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 FLOW FINALIZE API: Starting flow finalization...');
    
    const body = await request.json();
    const { flowData, client } = body;

    console.log('📥 FLOW FINALIZE API: Received data:', {
      flowId: flowData?.id,
      emailCount: flowData?.emails?.length,
      flowType: flowData?.strategy?.flowType,
      clientName: client?.company || client?.name
    });

    if (!flowData || !flowData.emails) {
      return NextResponse.json({ error: 'Missing flow data' }, { status: 400 });
    }

    // Step 1: Save flow data for shareable links
    console.log('💾 FLOW FINALIZE API: Saving flow to storage...');
    
    const COPIES_FILE = path.join(process.cwd(), 'data', 'saved-copies.json');
    
    // Read existing data
    const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
    const storage = JSON.parse(existingData);
    
    // Create flow record
    const savedFlow = {
      id: flowData.id,
      flow_name: `${flowData.strategy.flowType} - ${client?.company || client?.name || 'Client'}`,
      client: client?.company || client?.name || 'Client',
      flow_type: flowData.strategy.flowType,
      email_count: flowData.emails.length,
      offer: flowData.strategy.offer,
      emails: flowData.emails,
      strategy: flowData.strategy,
      type: 'flow', // Mark as flow
      created_at: flowData.created_at,
      updated_at: new Date().toISOString()
    };
    
    // Save to storage
    storage[flowData.id] = savedFlow;
    fs.writeFileSync(COPIES_FILE, JSON.stringify(storage, null, 2));
    
    console.log('✅ FLOW FINALIZE API: Flow saved successfully:', flowData.id);
    
    // Step 2: Create shareable URL
    const shareableUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/flows/view/${savedFlow.id}?readonly=true`;
    console.log('🔗 FLOW FINALIZE API: Created shareable URL:', shareableUrl);
    
    console.log('✅ FLOW FINALIZE API: Flow successfully finalized!');
    
    return NextResponse.json({
      success: true,
      shareableUrl: shareableUrl,
      flowId: savedFlow.id,
      message: 'Flow finalized and saved to your library'
    });

  } catch (error: any) {
    console.error('❌ FLOW FINALIZE API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to finalize flow'
    }, { status: 500 });
  }
}