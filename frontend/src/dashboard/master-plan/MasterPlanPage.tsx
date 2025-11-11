// src/dashboard/master-plan/MasterPlanPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddDoc } from './AddDoc';
import { masterPlanDocService } from '@/services/masterPlanDocService';
import { MasterPlanDoc } from '@/types/masterplandoc';
import { 
  Plus, 
  Download, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Search,
  FileText,
  RefreshCw
} from 'lucide-react';

export function MasterPlanPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [documents, setDocuments] = useState<MasterPlanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await masterPlanDocService.getAllMasterPlanDocs();
      setDocuments(docs || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      setError(error.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents;
    
    return documents.filter(doc => 
      doc.doc_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.doc_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.doc_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.owner?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

// Handle download document
const handleDownload = async (doc: MasterPlanDoc) => {
  try {
    console.log('Downloading document:', doc);
    
    if (doc.download_url) {
      // Create full URL if it's a relative path
      const downloadUrl = doc.download_url.startsWith('http') 
        ? doc.download_url 
        : `http://localhost:3001${doc.download_url}`;
      
      console.log('Using download URL:', downloadUrl);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.uploaded_file || `document-${doc.doc_id}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.storage_path) {
      // Alternative: use storage path to construct download URL
      const downloadUrl = `http://localhost:3001/api/masterplandocs/download/${doc.doc_id}`;
      console.log('Using storage path download URL:', downloadUrl);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.uploaded_file || `document-${doc.doc_id}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback: use the download service
      console.log('Using download service for doc_id:', doc.doc_id);
      await masterPlanDocService.downloadMasterPlanDoc(doc.doc_id);
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    alert(`Failed to download document: ${error.message}`);
  }
};

  // Handle add document success
  const handleAddSuccess = () => {
    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
  };

  // Define table columns
  const columns: ColumnDef<MasterPlanDoc>[] = [
    {
      accessorKey: 'doc_id',
      header: 'Document ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('doc_id')}</div>
      ),
    },
    {
      accessorKey: 'doc_title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue('doc_title')}>
          {row.getValue('doc_title')}
        </div>
      ),
    },
    {
      accessorKey: 'doc_type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('doc_type')}</div>
      ),
    },
    {
      accessorKey: 'revision_no',
      header: 'Revision',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('revision_no')}</div>
      ),
    },
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('year')}</div>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <div>{row.getValue('owner')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusColors: { [key: string]: string } = {
          'Draft': 'bg-gray-100 text-gray-800',
          'In Review': 'bg-blue-100 text-blue-800',
          'Approved': 'bg-green-100 text-green-800',
          'Published': 'bg-purple-100 text-purple-800',
          'Archived': 'bg-orange-100 text-orange-800',
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'uploaded_file',
      header: 'File',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 truncate max-w-[120px]">
            {row.getValue('uploaded_file')}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const document = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(document)}
              disabled={!document.download_url && !document.is_uploaded}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload(document)}>
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Initialize table
  const table = useReactTable({
    data: filteredDocuments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="container mx-auto py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Master Plan Documents</h1>
          <p className="text-muted-foreground">
            Manage your master plan documents and procedures
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Document
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-[300px]"
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            List of all master plan documents with their details and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm ? 'No documents found' : 'No documents'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first document'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowAddForm(true)} 
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Document Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AddDoc 
              onClose={handleCloseForm}
              onSuccess={handleAddSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterPlanPage;