import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flowId = params.id;
    console.log('🔍 FLOW COPY API: Fetching flow data for ID:', flowId);
    
    // Read from file directly
    const COPIES_FILE = path.join(process.cwd(), 'data', 'saved-copies.json');
    
    if (!fs.existsSync(COPIES_FILE)) {
      return NextResponse.json({ error: 'No flows found' }, { status: 404 });
    }
    
    const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
    const storage = JSON.parse(existingData);
    
    const flowData = storage[flowId];
    
    if (!flowData) {
      console.log('❌ FLOW COPY API: Flow not found');
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }
    
    console.log('✅ FLOW COPY API: Flow data retrieved successfully');
    
    return NextResponse.json(flowData);

  } catch (error: any) {
    console.error('❌ FLOW COPY API: Error fetching flow:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch flow'
    }, { status: 500 });
  }
}