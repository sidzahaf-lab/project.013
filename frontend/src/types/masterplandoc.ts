// frontend/src/types/masterplandoc.ts
export interface MasterPlanDoc {
  id?: number;
  doc_id: string;
  doc_type: string;
  doc_title: string;
  revision_no: string;
  year: number;
  quarter?: string | null;
  owner: string;
  status: string;
  doc_status?: string;
  is_uploaded?: boolean;
  uploaded_file?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  storage_path?: string | null;
  download_url?: string | null;
  uploaded_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMasterPlanDocRequest {
  doc_id: string;
  doc_type: string;
  doc_title: string;
  revision_no: string;
  year: number;
  quarter?: string | null;
  owner: string;
  status: string;
  doc_status?: string;
  is_uploaded?: boolean;
}