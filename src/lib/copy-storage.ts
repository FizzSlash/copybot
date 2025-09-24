import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data');
const COPIES_FILE = path.join(STORAGE_DIR, 'saved-copies.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Ensure copies file exists
if (!fs.existsSync(COPIES_FILE)) {
  fs.writeFileSync(COPIES_FILE, JSON.stringify({}));
}

export class CopyStorage {
  static async saveCopy(copyData: any): Promise<any> {
    try {
      // Read existing copies
      const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
      const copies = JSON.parse(existingData);
      
      // Create unique ID
      const copyId = `copy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Add new copy
      const savedCopy = {
        id: copyId,
        ...copyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      copies[copyId] = savedCopy;
      
      // Write back to file
      fs.writeFileSync(COPIES_FILE, JSON.stringify(copies, null, 2));
      
      console.log('✅ COPY STORAGE: Saved copy with ID:', copyId);
      console.log('📊 COPY STORAGE: Copy data:', {
        campaign: copyData.campaign_name,
        blocks: copyData.email_blocks?.length,
        subjects: copyData.subject_lines?.length
      });
      
      return savedCopy;
    } catch (error) {
      console.error('❌ COPY STORAGE: Error saving copy:', error);
      throw error;
    }
  }

  static async getCopy(id: string): Promise<any> {
    try {
      console.log('🔍 COPY STORAGE: Looking for copy:', id);
      
      // Read copies file
      const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
      const copies = JSON.parse(existingData);
      
      const copy = copies[id];
      
      if (!copy) {
        console.log('❌ COPY STORAGE: Copy not found');
        throw new Error('Copy not found');
      }
      
      console.log('✅ COPY STORAGE: Found copy:', {
        id: copy.id,
        campaign: copy.campaign_name,
        blocks: copy.email_blocks?.length
      });
      
      return copy;
    } catch (error) {
      console.error('❌ COPY STORAGE: Error getting copy:', error);
      throw error;
    }
  }

  static async updateCopy(id: string, updates: any): Promise<any> {
    try {
      // Read existing copies
      const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
      const copies = JSON.parse(existingData);
      
      if (!copies[id]) {
        throw new Error('Copy not found');
      }
      
      // Update copy
      copies[id] = {
        ...copies[id],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Write back to file
      fs.writeFileSync(COPIES_FILE, JSON.stringify(copies, null, 2));
      
      console.log('✅ COPY STORAGE: Updated copy:', id);
      return copies[id];
    } catch (error) {
      console.error('❌ COPY STORAGE: Error updating copy:', error);
      throw error;
    }
  }
}