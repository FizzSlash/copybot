import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    console.log('📧 SAVED FLOWS API: Fetching all saved flows...');
    
    // Read from file directly
    const COPIES_FILE = path.join(process.cwd(), 'data', 'saved-copies.json');
    
    if (!fs.existsSync(COPIES_FILE)) {
      console.log('📝 SAVED FLOWS API: No saved copies file found');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
    const storage = JSON.parse(existingData);
    
    // Filter for flows only and convert to array
    const savedFlows = Object.values(storage)
      .filter((item: any) => item.type === 'flow')
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    console.log('✅ SAVED FLOWS API: Retrieved flows:', savedFlows.length);
    
    return NextResponse.json({
      success: true,
      data: savedFlows
    });

  } catch (error: any) {
    console.error('❌ SAVED FLOWS API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch saved flows'
    }, { status: 500 });
  }
}