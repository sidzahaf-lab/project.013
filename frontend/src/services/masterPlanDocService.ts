// src/services/masterPlanDocService.ts
import { MasterPlanDoc, CreateMasterPlanDocRequest } from '@/types/masterplandoc';

const API_BASE_URL = 'http://localhost:3001/api';

export const masterPlanDocService = {
  // Get all master plan documents
  async getAllMasterPlanDocs(): Promise<MasterPlanDoc[]> {
    try {
      console.log('Fetching documents from:', `${API_BASE_URL}/masterplandocs`);
      const response = await fetch(`${API_BASE_URL}/masterplandocs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.documents && Array.isArray(data.documents)) {
        return data.documents;
      } else {
        console.warn('Unexpected API response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching master plan documents:', error);
      throw error;
    }
  },

  // Check if document ID exists
  async checkDocIdExists(doc_id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/masterplandocs/${doc_id}`);
      return response.ok;
    } catch (error) {
      console.error('Error checking document ID:', error);
      return false;
    }
  },

  // Create new master plan document
  async createMasterPlanDoc(data: CreateMasterPlanDocRequest): Promise<MasterPlanDoc> {
    try {
      const response = await fetch(`${API_BASE_URL}/masterplandocs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating master plan document:', error);
      throw error;
    }
  },

  // Download master plan document
  async downloadMasterPlanDoc(doc_id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/masterplandocs/download/${doc_id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-${doc_id}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },
};