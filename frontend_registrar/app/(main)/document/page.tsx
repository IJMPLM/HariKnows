"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, FileText, Archive, Trash2, Upload, X, AlertTriangle, Eye, Search, ListFilter } from "lucide-react";

interface Document {
  id: string;
  dateUploaded: string;
  documentName: string;
  office: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    dateUploaded: "2024-03-30",
    documentName: "CN - Nursing Masterlist",
    office: "College of Nursing",
  },
  {
    id: "2",
    dateUploaded: "2024-03-29",
    documentName: "CT - BSCS Report of Grades",
    office: "College of Technology",
  },
  {
    id: "3",
    dateUploaded: "2024-03-28",
    documentName: "CT - BSIT Report of Grades",
    office: "College of Technology",
  },
];

const offices = [
  "All Offices",
  "Office of the University Registrar",
  "College of Technology",
  "College of Nursing",
  "College of Accountancy",
  "NSTP Office",
  "OSDS Office",
];

export default function DocumentRepository() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState("All Offices");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredOffices = offices.filter((office) =>
    office.toLowerCase().includes(searchInput.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearchInput("");
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const filteredDocuments =
    selectedOffice === "All Offices"
      ? mockDocuments
      : mockDocuments.filter((doc) => doc.office === selectedOffice);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        alert("Only CSV files are permitted.");
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      console.log("Uploading:", selectedFile.name);
      setUploadModalOpen(false);
      setSelectedFile(null);
    }
  };

  const handleArchiveClick = (doc: Document) => {
    setSelectedDocument(doc);
    setArchiveModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (selectedDocument) {
      console.log("Archiving document:", selectedDocument.documentName);
      setArchiveModalOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setSelectedDocument(doc);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDocument) {
      console.log("Deleting document:", selectedDocument.documentName);
      setDeleteModalOpen(false);
      setSelectedDocument(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-xs font-semibold text-[#aaaaaa] tracking-wide uppercase">
        REGISTRAR OFFICE · DOCUMENT UPLOAD AND MANAGEMENT
      </div>

      {/* Page Header - Split Color Title */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-2">
          <h1 className="text-4xl font-bold text-white">Document Upload</h1>
          <h1 className="text-4xl font-bold text-[#e8834a]">Dashboard</h1>
        </div>
        <p className="text-sm text-[#aaaaaa]">
          Centralized storage and management for official college and office documents
        </p>
      </div>

      {/* Filter, Search and Upload Section */}
      <div className="space-y-4 mb-6">
        {/* Filter and Upload */}
        <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-xs relative">
          <label className="block text-xs font-semibold text-[#aaaaaa] mb-2 uppercase">Filter by Office</label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-[10px] focus:ring-2 focus:ring-[#e8834a] focus:border-[#e8834a] transition-colors text-sm text-left flex items-center justify-between hover:border-[#e8834a]/50"
            >
              <span>{selectedOffice}</span>
              <span className="text-[#aaaaaa]">▼</span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#e8834a] rounded-[10px] z-50 shadow-lg">
                <div className="p-2 border-b border-[#2a2a2a]">
                  <input
                    type="text"
                    placeholder="Search offices..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#2a2a2a] border border-[#2a2a2a] text-white placeholder-[#666666] rounded-[10px] focus:ring-2 focus:ring-[#e8834a] focus:border-[#e8834a] outline-none text-xs"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredOffices.length === 0 ? (
                    <div className="px-3 py-2 text-[#aaaaaa] text-xs">No offices found</div>
                  ) : (
                    filteredOffices.map((office) => (
                      <button
                        key={office}
                        onClick={() => {
                          setSelectedOffice(office);
                          setDropdownOpen(false);
                          setSearchInput("");
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          selectedOffice === office
                            ? "bg-[#e8834a] text-[#121212]"
                            : "text-white hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {office}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e8834a] hover:bg-[#d97639] text-[#121212] rounded-[10px] font-semibold text-sm transition-colors mt-6"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
        </div>

        {/* Search Bar + Sort Button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#666666] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#e8834a] focus:border-[#e8834a] transition-colors"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#e8834a] hover:bg-[#d97639] text-[#121212] transition-colors"
              title="Sort options"
            >
              <ListFilter className="w-4 h-4" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] shadow-lg z-50 overflow-hidden">
                <p className="px-4 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-[#aaaaaa]">Sort By</p>
                <button
                  onClick={() => { setSortOrder("asc"); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sortOrder === "asc"
                      ? "bg-[#e8834a] text-[#121212] font-semibold"
                      : "text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  Document Name (A-Z)
                </button>
                <button
                  onClick={() => { setSortOrder("desc"); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sortOrder === "desc"
                      ? "bg-[#e8834a] text-[#121212] font-semibold"
                      : "text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  Document Name (Z-A)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#2a2a2a]" />
            <p className="text-[#aaaaaa] text-sm">No documents found</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] p-4 hover:border-[#e8834a]/30 transition-colors flex items-center justify-between group"
            >
              {/* Left Section - Icon and Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-[#2a2a2a] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e8834a]/10 transition-colors">
                  <FileText className="w-6 h-6 text-[#e8834a]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{doc.documentName}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#aaaaaa] mt-1">
                    <span>{doc.dateUploaded}</span>
                    <span className="text-[#2a2a2a]">•</span>
                    <span>{doc.office}</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  title="View Document"
                  className="p-2 text-[#aaaaaa] hover:text-[#e8834a] hover:bg-[#2a2a2a] rounded-[10px] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  title="Archive Document"
                  onClick={() => handleArchiveClick(doc)}
                  className="p-2 text-[#aaaaaa] hover:text-yellow-500 hover:bg-[#2a2a2a] rounded-[10px] transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  title="Delete Document"
                  onClick={() => handleDeleteClick(doc)}
                  className="p-2 text-[#aaaaaa] hover:text-red-500 hover:bg-[#2a2a2a] rounded-[10px] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )
        }
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] max-w-[500px] w-full mx-4">
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white">Upload CSV Document</h2>
              <p className="text-xs text-[#aaaaaa] mt-1">Add a new document to the repository</p>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* CSV Notice */}
              <div className="bg-[#2a2a2a]/50 border border-[#e8834a]/30 rounded-[10px] p-4">
                <p className="text-[#e8834a] text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span><strong>Requirement:</strong> Only .csv files are permitted</span>
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-white mb-2 uppercase">Select File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2a2a2a] rounded-[10px] cursor-pointer hover:border-[#e8834a] hover:bg-[#e8834a]/5 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-[#e8834a] mb-2" />
                    <span className="text-xs text-[#aaaaaa] text-center font-medium">
                      {selectedFile ? selectedFile.name : "Drag & drop or browse"}
                    </span>
                  </label>
                  {selectedFile && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="absolute top-2 right-2 p-1 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#aaaaaa] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#2a2a2a] mt-2">Required columns: Date, Document Name, Office</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-[#aaaaaa] hover:text-white hover:bg-[#2a2a2a] rounded-[10px] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="px-4 py-2 bg-[#e8834a] hover:bg-[#d97639] text-[#121212] rounded-[10px] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e8834a]"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Archive Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] max-w-[450px] w-full mx-4">
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-[10px] bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-lg font-bold text-white">Archive Document</h2>
              </div>
              <p className="text-sm text-[#aaaaaa] mt-2">
                Archive <span className="text-white font-semibold">'{selectedDocument?.documentName}'</span>? It will be moved to archived storage.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setArchiveModalOpen(false);
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 text-[#aaaaaa] hover:text-white hover:bg-[#2a2a2a] rounded-[10px] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-[10px] font-medium transition-colors text-sm"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] max-w-[450px] w-full mx-4">
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-[10px] bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-white">Delete Permanently</h2>
              </div>
              <p className="text-sm text-[#aaaaaa] mt-2">
                Delete <span className="text-white font-semibold">'{selectedDocument?.documentName}'</span>? This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 text-[#aaaaaa] hover:text-white hover:bg-[#2a2a2a] rounded-[10px] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[10px] font-medium transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div>
  );
}
