import Airtable from 'airtable';
import type { AirtableRecord, AirtableCampaign, Campaign } from '@/types';

// Initialize Airtable
const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID!);

export class AirtableService {
  private campaignsTable = base('Campaigns'); // Adjust table name as needed

  // Map Airtable field names to our internal structure
  private fieldMapping = {
    name: 'Campaign Name',
    client: 'Client Name',
    status: 'Status',
    deadline: 'Deadline',
    brief: 'Campaign Brief',
    campaign_type: 'Campaign Type',
    priority: 'Priority'
  };

  async getCampaigns(): Promise<AirtableCampaign[]> {
    try {
      const records = await this.campaignsTable.select({
        // Add any filtering if needed
        // filterByFormula: 'NOT({Status} = "Completed")',
        sort: [{ field: 'Created', direction: 'desc' }]
      }).all();

      return records.map(this.mapAirtableRecord);
    } catch (error) {
      console.error('Error fetching campaigns from Airtable:', error);
      throw new Error('Failed to fetch campaigns from Airtable');
    }
  }

  async getCampaign(airtableId: string): Promise<AirtableCampaign | null> {
    try {
      const record = await this.campaignsTable.find(airtableId);
      return this.mapAirtableRecord(record);
    } catch (error) {
      console.error(`Error fetching campaign ${airtableId} from Airtable:`, error);
      return null;
    }
  }

  async updateCampaignStatus(airtableId: string, status: string, copyContent?: string): Promise<void> {
    try {
      const updates: { [key: string]: any } = {
        [this.fieldMapping.status]: status
      };

      // If copy content is provided, add it to the update
      if (copyContent) {
        updates['Generated Copy'] = copyContent;
        updates['Copy Generated Date'] = new Date().toISOString();
      }

      await this.campaignsTable.update(airtableId, updates);
    } catch (error) {
      console.error(`Error updating campaign ${airtableId} in Airtable:`, error);
      throw new Error('Failed to update campaign in Airtable');
    }
  }

  async syncCampaignsToDatabase(): Promise<{ imported: number; updated: number; errors: string[] }> {
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[]
    };

    try {
      const airtableCampaigns = await this.getCampaigns();
      
      for (const airtableCampaign of airtableCampaigns) {
        try {
          // This would typically involve checking if the campaign exists in your database
          // and either creating or updating it
          await this.syncSingleCampaign(airtableCampaign);
          results.imported += 1;
        } catch (error) {
          results.errors.push(`Failed to sync campaign "${airtableCampaign.name}": ${error}`);
        }
      }

    } catch (error) {
      results.errors.push(`Failed to fetch campaigns from Airtable: ${error}`);
    }

    return results;
  }

  private async syncSingleCampaign(airtableCampaign: AirtableCampaign): Promise<void> {
    // This would integrate with your Supabase database
    // For now, this is a placeholder that you'd implement based on your specific needs
    
    // Example of what this might look like:
    /*
    const databaseService = new DatabaseService();
    
    // Check if campaign already exists
    const existingCampaigns = await databaseService.getCampaigns();
    const existingCampaign = existingCampaigns.find(c => c.airtable_id === airtableCampaign.id);
    
    if (existingCampaign) {
      // Update existing campaign
      await databaseService.updateCampaign(existingCampaign.id, {
        name: airtableCampaign.name,
        status: this.mapStatusToDatabase(airtableCampaign.status),
        deadline: airtableCampaign.deadline,
        brief: airtableCampaign.brief
      });
    } else {
      // Find or create client first
      const client = await this.findOrCreateClient(airtableCampaign.client);
      
      // Create new campaign
      await databaseService.createCampaign({
        airtable_id: airtableCampaign.id,
        client_id: client.id,
        name: airtableCampaign.name,
        type: 'campaign', // or determine from airtableCampaign.campaign_type
        status: 'draft',
        deadline: airtableCampaign.deadline,
        brief: airtableCampaign.brief
      });
    }
    */
    
    console.log(`Would sync campaign: ${airtableCampaign.name}`);
  }

  private mapAirtableRecord(record: AirtableRecord): AirtableCampaign {
    const fields = record.fields;
    
    return {
      id: record.id,
      name: fields[this.fieldMapping.name] || 'Untitled Campaign',
      client: fields[this.fieldMapping.client] || 'Unknown Client',
      status: fields[this.fieldMapping.status] || 'Draft',
      deadline: fields[this.fieldMapping.deadline] || undefined,
      brief: fields[this.fieldMapping.brief] || undefined,
      campaign_type: fields[this.fieldMapping.campaign_type] || undefined,
      priority: fields[this.fieldMapping.priority] || undefined
    };
  }

  private mapStatusToDatabase(airtableStatus: string): Campaign['status'] {
    // Map Airtable statuses to your database statuses
    const statusMap: { [key: string]: Campaign['status'] } = {
      'Draft': 'draft',
      'In Progress': 'in_progress',
      'Review': 'in_progress',
      'Completed': 'completed',
      'Archived': 'archived'
    };

    return statusMap[airtableStatus] || 'draft';
  }

  // Helper method to set up webhooks (you'd call this once to configure Airtable webhooks)
  async setupWebhooks(webhookUrl: string): Promise<void> {
    // This would be implemented using Airtable's webhook API
    // For now, this is a placeholder
    console.log(`Would setup webhook for URL: ${webhookUrl}`);
  }

  // Handle incoming webhook data
  async handleWebhook(payload: any): Promise<void> {
    try {
      // Process webhook payload from Airtable
      const { changedRecords, createdRecords, destroyedRecords } = payload;

      // Handle created records
      if (createdRecords && createdRecords.length > 0) {
        for (const record of createdRecords) {
          const campaign = this.mapAirtableRecord(record);
          await this.syncSingleCampaign(campaign);
        }
      }

      // Handle changed records
      if (changedRecords && changedRecords.length > 0) {
        for (const record of changedRecords) {
          const campaign = this.mapAirtableRecord(record);
          await this.syncSingleCampaign(campaign);
        }
      }

      // Handle destroyed records
      if (destroyedRecords && destroyedRecords.length > 0) {
        // You might want to archive these in your database rather than delete
        console.log('Records destroyed in Airtable:', destroyedRecords);
      }

    } catch (error) {
      console.error('Error processing Airtable webhook:', error);
      throw error;
    }
  }

  // Test connection to Airtable
  async testConnection(): Promise<boolean> {
    try {
      const records = await this.campaignsTable.select({
        maxRecords: 1
      }).firstPage();
      
      return true;
    } catch (error) {
      console.error('Airtable connection test failed:', error);
      return false;
    }
  }

  // Get field mapping for configuration
  getFieldMapping(): typeof this.fieldMapping {
    return { ...this.fieldMapping };
  }

  // Update field mapping
  updateFieldMapping(newMapping: Partial<typeof this.fieldMapping>): void {
    this.fieldMapping = { ...this.fieldMapping, ...newMapping };
  }
}