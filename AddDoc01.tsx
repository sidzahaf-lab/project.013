// src/dashboard/master-plan/AddDoc.tsx
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { masterPlanDocService } from '@/services/masterPlanDocService';
import { CreateMasterPlanDocRequest } from '@/types/masterplandoc';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

// Validation schema
const formSchema = z.object({
  doc_id: z.string()
    .min(1, 'Document ID is required')
    .max(50, 'Document ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Document ID can only contain letters, numbers, hyphens, and underscores'),
  
  doc_type: z.string()
    .min(1, 'Document type is required')
    .max(100, 'Document type must be less than 100 characters'),
  
  doc_title: z.string()
    .min(1, 'Document title is required')
    .max(255, 'Document title must be less than 255 characters'),
  
  revision_no: z.string()
    .min(1, 'Revision number is required')
    .max(20, 'Revision number must be less than 20 characters')
    .regex(/^[0-9.]+$/, 'Revision number can only contain numbers and dots'),
  
  year: z.number()
    .min(2000, 'Year must be after 2000')
    .max(2100, 'Year must be before 2100'),
  
  quarter: z.string().max(10, 'Quarter must be less than 10 characters').optional(),
  
  owner: z.string()
    .min(1, 'Owner is required')
    .max(150, 'Owner must be less than 150 characters'),
  
  status: z.string()
    .min(1, 'Status is required')
    .max(50, 'Status must be less than 50 characters'),
  
  doc_status: z.string().max(50, 'Document status must be less than 50 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadedFileInfo {
  file: File;
  storagePath: string;
  downloadUrl: string;
  uploadedAt: string;
}

export function AddDoc() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCheckingDocId, setIsCheckingDocId] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<UploadedFileInfo | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doc_id: '',
      doc_type: '',
      doc_title: '',
      revision_no: '',
      year: new Date().getFullYear(),
      quarter: undefined,
      owner: '',
      status: '',
      doc_status: 'Open',
    },
    mode: 'onChange', // Validate on change to check form validity
  });

  // Check if all required metadata is entered
  const checkFormValidity = (data: FormValues) => {
    const requiredFields = ['doc_id', 'doc_type', 'doc_title', 'revision_no', 'owner', 'status'];
    const allRequiredFilled = requiredFields.every(field => 
      data[field as keyof FormValues] && String(data[field as keyof FormValues]).trim().length > 0
    );
    const yearValid = data.year >= 2000 && data.year <= 2100;
    
    setIsFormValid(allRequiredFilled && yearValid);
  };

  // Check if doc_id already exists
  const checkDocId = async (doc_id: string) => {
    if (!doc_id) return;
    
    setIsCheckingDocId(true);
    try {
      const exists = await masterPlanDocService.checkDocIdExists(doc_id);
      if (exists) {
        form.setError('doc_id', {
          type: 'manual',
          message: 'Document ID already exists',
        });
      } else {
        form.clearErrors('doc_id');
      }
    } catch (error) {
      console.error('Error checking document ID:', error);
    } finally {
      setIsCheckingDocId(false);
    }
  };

  // Validate file before upload
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
      return { 
        isValid: false, 
        error: 'File type not supported. Please upload PDF, Word, Excel, PowerPoint, or Text files.' 
      };
    }

    return { isValid: true };
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadResult({
        type: 'error',
        message: validation.error!,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  // Handle file upload to server
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadResult({
        type: 'error',
        message: 'Please select a file first',
      });
      return;
    }

    if (!isFormValid) {
      setUploadResult({
        type: 'error',
        message: 'Please fill all required metadata fields before uploading file',
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', selectedFile);
      
      // Get form values for metadata
      const formValues = form.getValues();
      formData.append('doc_id', formValues.doc_id);
      formData.append('doc_type', formValues.doc_type);
      formData.append('revision_no', formValues.revision_no);

      console.log('Uploading file:', selectedFile.name);

      // Upload file to server
      const response = await fetch('http://localhost:3001/api/masterplandocs/upload', {
        method: 'POST',
        body: formData,
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 500));
        
        if (response.status === 404) {
          throw new Error('Upload endpoint not found (404). Please check backend server.');
        } else if (response.status === 413) {
          throw new Error('File too large. Please select a smaller file.');
        } else {
          throw new Error(`Server returned an error (Status: ${response.status}).`);
        }
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }
        
      // Store uploaded file info
      const fileInfo: UploadedFileInfo = {
        file: selectedFile,
        storagePath: result.storagePath,
        downloadUrl: result.downloadUrl,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedFileInfo(fileInfo);
      setUploadResult({
        type: 'success',
        message: `File "${selectedFile.name}" uploaded successfully! You can now save the document.`,
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      let errorMessage = error.message || 'Failed to upload file. Please try again.';
      
      if (errorMessage.includes('Upload endpoint not found')) {
        errorMessage = 'Upload endpoint not available. Please check backend server.';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Cannot connect to server. Please make sure backend is running on http://localhost:3001';
      } else if (errorMessage.includes('File too large')) {
        errorMessage = 'File is too large. Maximum file size is 10MB.';
      }

      setUploadResult({
        type: 'error',
        message: errorMessage,
      });
      
      // Clear the selected file on error
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle clear all button
  const handleClearAll = async () => {
    // If there's an uploaded file, delete it from server
    if (uploadedFileInfo) {
      try {
        const response = await fetch('http://localhost:3001/api/masterplandocs/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: uploadedFileInfo.storagePath,
            doc_id: form.getValues().doc_id,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('File deleted:', result.message);
        }
      } catch (error) {
        console.error('Error deleting uploaded file:', error);
      }
    }

    // Reset everything
    form.reset();
    setSelectedFile(null);
    setUploadedFileInfo(null);
    setUploadResult(null);
    setSubmitResult(null);
    setIsFormValid(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle save document - store metadata in DB and permanently store file
  const handleSaveDocument = async (data: FormValues) => {
    if (!uploadedFileInfo) {
      setSubmitResult({
        type: 'error',
        message: 'Please upload a file first before saving the document.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const submitData: CreateMasterPlanDocRequest = {
        doc_id: data.doc_id,
        doc_type: data.doc_type,
        doc_title: data.doc_title,
        revision_no: data.revision_no,
        year: data.year,
        quarter: data.quarter || null,
        owner: data.owner,
        status: data.status,
        doc_status: data.doc_status || 'Open',
        is_uploaded: true,
        uploaded_file: uploadedFileInfo.file.name,
        file_type: uploadedFileInfo.file.type,
        file_size: uploadedFileInfo.file.size,
        storage_path: uploadedFileInfo.storagePath,
        download_url: uploadedFileInfo.downloadUrl,
        uploaded_at: uploadedFileInfo.uploadedAt,
      };

      await masterPlanDocService.createMasterPlanDoc(submitData);
      
      setSubmitResult({
        type: 'success',
        message: 'Master Plan Document saved successfully! File has been permanently stored.',
      });
      
      // Reset form after successful save
      form.reset();
      setSelectedFile(null);
      setUploadedFileInfo(null);
      setUploadResult(null);
      setIsFormValid(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error saving master plan document:', error);
      setSubmitResult({
        type: 'error',
        message: error.message || 'Failed to save master plan document. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch form changes to check validity
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      checkFormValidity(value as FormValues);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Generate years for dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Button states based on business logic
  const isUploadButtonEnabled = isFormValid && selectedFile && !isUploading && !uploadedFileInfo;
  const isSaveButtonEnabled = isFormValid && uploadedFileInfo && !isSubmitting;
  const isClearButtonEnabled = !isSubmitting && (isFormValid || selectedFile || uploadedFileInfo);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Add New Master Plan Document</CardTitle>
          <CardDescription>
            Fill all metadata, upload file, then save to database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveDocument)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document ID */}
                <FormField
                  control={form.control}
                  name="doc_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document ID *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="DOC-001" 
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              checkDocId(e.target.value);
                            }}
                            onChange={(e) => {
                              field.onChange(e);
                              checkFormValidity(form.getValues());
                            }}
                          />
                          {isCheckingDocId && (
                            <div className="absolute right-3 top-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Unique document identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Document Type */}
                <FormField
                  control={form.control}
                  name="doc_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Policy, Procedure, Report, etc." 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            checkFormValidity(form.getValues());
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Type of document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Document Title */}
              <FormField
                control={form.control}
                name="doc_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the full document title..." 
                        className="min-h-[80px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          checkFormValidity(form.getValues());
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Complete title of the document
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revision Number */}
                <FormField
                  control={form.control}
                  name="revision_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1.0, 2.1, etc." 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            checkFormValidity(form.getValues());
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Year */}
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          checkFormValidity(form.getValues());
                        }}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quarter */}
                <FormField
                  control={form.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          checkFormValidity(form.getValues());
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner */}
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Department or person responsible" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            checkFormValidity(form.getValues());
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Document owner/responsible party
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          checkFormValidity(form.getValues());
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="In Review">In Review</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                          <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Document Status */}
              <FormField
                control={form.control}
                name="doc_status"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Document Status</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        checkFormValidity(form.getValues());
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current document workflow status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document File Upload</CardTitle>
                  <CardDescription>
                    Upload a physical document file (Max: 10MB). All metadata must be filled before upload.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt"
                      className="max-w-md"
                    />
                    <Button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!isUploadButtonEnabled}
                      className="min-w-[120px]"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        'Upload File'
                      )}
                    </Button>
                  </div>

                  {!isFormValid && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                      Please fill all required metadata fields (*) to enable file upload
                    </div>
                  )}

                  {(selectedFile || uploadedFileInfo) && (
                    <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">
                      <p><strong>File:</strong> {uploadedFileInfo?.file.name || selectedFile?.name}</p>
                      <p><strong>Size:</strong> {((uploadedFileInfo?.file.size || selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>Type:</strong> {uploadedFileInfo?.file.type || selectedFile?.type || 'Unknown'}</p>
                      {uploadedFileInfo && (
                        <p><strong>Status:</strong> <span className="text-green-600">Uploaded Successfully - Ready to Save</span></p>
                      )}
                    </div>
                  )}

                  <FormDescription>
                    Supported formats: PDF, Word, Excel, PowerPoint, Text files (Max: 10MB)
                  </FormDescription>

                  {uploadResult && (
                    <div
                      className={`p-3 rounded-md border ${
                        uploadResult.type === 'success'
                          ? 'bg-green-50 text-green-800 border-green-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {uploadResult.message}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={!isSaveButtonEnabled}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Document'
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearAll}
                  disabled={!isClearButtonEnabled || isSubmitting}
                >
                  Clear All
                </Button>
              </div>

              {!uploadedFileInfo && isFormValid && (
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                  All metadata entered. Please upload a file to enable saving.
                </div>
              )}

              {/* Save Result */}
              {submitResult && (
                <div
                  className={`p-4 rounded-md border ${
                    submitResult.type === 'success'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <div className="font-medium">
                    {submitResult.type === 'success' ? 'Success!' : 'Error!'}
                  </div>
                  {submitResult.message}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddDoc;