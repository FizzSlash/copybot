// Airtable API Integration Service
export class AirtableService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!token || !baseId) {
      throw new Error('Missing Airtable configuration. Please set AIRTABLE_TOKEN and AIRTABLE_BASE_ID in your .env.local file.');
    }

    this.baseUrl = `https://api.airtable.com/v0/${baseId}`;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get active campaigns (past 7 days + all future campaigns)
  async getActiveCampaigns(): Promise<any[]> {
    console.log('🔄 AIRTABLE: Fetching active campaigns (past 7 days + future)...');
    
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 7); // 7 days ago
      
      const pastDateStr = pastDate.toISOString().split('T')[0];
      
      console.log(`📅 AIRTABLE: Looking for campaigns with Send Date >= ${pastDateStr} (past 7 days + future)`);

      // Filter: Send Date is 7 days ago or later (includes past 7 days + all future)
      const filterFormula = `IS_AFTER({Send Date}, '${pastDateStr}')`;
      const url = `${this.baseUrl}/Retention?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Send%20Date&sort[0][direction]=asc`;
      
      console.log('📡 AIRTABLE: API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ AIRTABLE: Found ${data.records?.length || 0} active campaigns`);
      console.log('📊 AIRTABLE: Campaign data:', JSON.stringify(data.records, null, 2));

      return data.records || [];
    } catch (error) {
      console.error('❌ AIRTABLE: Error fetching campaigns:', error);
      throw error;
    }
  }

  // Get campaigns by date range (for flexible filtering)
  async getCampaignsByDate(daysBack: number = 7, daysAhead: number = 365): Promise<any[]> {
    console.log(`🔄 AIRTABLE: Fetching campaigns (${daysBack} days back to ${daysAhead} days ahead)...`);
    
    try {
      const today = new Date();
      const pastDate = new Date();
      const futureDate = new Date();
      pastDate.setDate(today.getDate() - daysBack);
      futureDate.setDate(today.getDate() + daysAhead);
      
      const pastDateStr = pastDate.toISOString().split('T')[0];
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      console.log(`📅 AIRTABLE: Looking for campaigns between ${pastDateStr} and ${futureDateStr}`);

      const filterFormula = `AND(
        IS_AFTER({Send Date}, '${pastDateStr}'),
        IS_BEFORE({Send Date}, '${futureDateStr}')
      )`;

      const url = `${this.baseUrl}/Retention?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=Send%20Date&sort[0][direction]=asc`;
      
      console.log('📡 AIRTABLE: API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ AIRTABLE: Found ${data.records?.length || 0} campaigns in date range`);

      return data.records || [];
    } catch (error) {
      console.error('❌ AIRTABLE: Error fetching campaigns:', error);
      throw error;
    }
  }

  // Update campaign with copy link and set stage to Design QA
  async updateCampaignCopyLink(recordId: string, copyLink: string): Promise<any> {
    console.log('🔄 AIRTABLE: Updating campaign copy link and stage...');
    console.log('📝 AIRTABLE: Record ID:', recordId);
    console.log('🔗 AIRTABLE: Copy Link:', copyLink);
    
    try {
      const url = `${this.baseUrl}/Retention/${recordId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          fields: {
            'Copy Link': copyLink,
            'Stage': 'Design QA'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AIRTABLE: Update error response:', errorText);
        throw new Error(`Airtable update error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ AIRTABLE: Campaign updated successfully with Copy Link and Stage');
      console.log('📊 AIRTABLE: Updated record:', JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      console.error('❌ AIRTABLE: Error updating campaign:', error);
      throw error;
    }
  }

  // Test connection to Airtable
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    console.log('🧪 AIRTABLE: Testing connection...');
    
    try {
      const url = `${this.baseUrl}/Retention?maxRecords=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AIRTABLE: Test connection failed:', errorText);
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
          data: { error: errorText }
        };
      }

      const data = await response.json();
      console.log('✅ AIRTABLE: Connection successful');
      console.log('📊 AIRTABLE: Test data:', JSON.stringify(data, null, 2));

      return {
        success: true,
        message: `Connected successfully! Found ${data.records?.length || 0} records.`,
        data: data
      };
    } catch (error) {
      console.error('❌ AIRTABLE: Test connection error:', error);
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }

  // Get all campaigns (for debugging/testing)
  async getAllCampaigns(maxRecords: number = 10): Promise<any[]> {
    console.log(`🔄 AIRTABLE: Fetching ${maxRecords} campaigns for testing...`);
    
    try {
      const url = `${this.baseUrl}/Retention?maxRecords=${maxRecords}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ AIRTABLE: Retrieved ${data.records?.length || 0} campaigns`);
      
      // Log campaign structure for debugging
      if (data.records && data.records.length > 0) {
        console.log('📋 AIRTABLE: Sample campaign fields:', Object.keys(data.records[0].fields));
        console.log('📊 AIRTABLE: First campaign:', JSON.stringify(data.records[0], null, 2));
      }

      return data.records || [];
    } catch (error) {
      console.error('❌ AIRTABLE: Error fetching all campaigns:', error);
      throw error;
    }
  }
}