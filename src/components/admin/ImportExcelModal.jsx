import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Info, ArrowRight, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../common/Loading';
import api from '../../services/api';

const ImportExcelModal = ({ isOpen, onClose, entityType, onPreviewSuccess, previewApi, confirmApi }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('summary');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      toast.error('Chỉ hỗ trợ định dạng tệp Excel (.xlsx, .xls)');
      return;
    }
    setFile(selectedFile);
    handlePreview(selectedFile);
  };

  const handlePreview = async (selectedFile) => {
    setLoading(true);
    setPreviewData(null);
    setImportProgress(null);
    setImportResult(null);
    try {
      const data = await previewApi(selectedFile);
      setPreviewData(data);
      toast.success('Phân tích tệp thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đọc tệp Excel. Vui lòng thử lại.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.rows || previewData.rows.length === 0) {
      toast.error('Không có dòng dữ liệu hợp lệ nào để import.');
      return;
    }
    
    setImporting(true);
    // Initialize progress display state
    setImportProgress({
      jobId: previewData.jobId,
      status: 'PROCESSING',
      totalRows: previewData.rows.length,
      successRows: 0,
      duplicateRows: 0,
      failedRows: 0,
      processedRows: 0,
      percentage: 0,
      duplicateDetails: [],
      errorDetails: []
    });

    try {
      // confirmApi returns immediately when processing starts
      const res = await confirmApi(previewData.jobId, previewData.rows);
      
      // Setup Server-Sent Events listener
      const tokensStored = localStorage.getItem('auth_tokens');
      let token = '';
      if (tokensStored) {
        try {
          token = JSON.parse(tokensStored).accessToken || '';
        } catch (e) {}
      }

      const baseURL = api.defaults.baseURL || 'http://localhost:8080/api/v1';
      const sseUrl = `${baseURL}/admin/import/jobs/${previewData.jobId}/progress?token=Bearer ${token}`;
      
      const eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('progress', (e) => {
        try {
          const progressData = JSON.parse(e.data);
          setImportProgress(progressData);
          
          if (progressData.status === 'COMPLETED' || progressData.status === 'FAILED') {
            eventSource.close();
            setImporting(false);
            setImportResult(progressData);
            toast.success('Nhập dữ liệu hoàn tất!');
            if (onPreviewSuccess) {
              onPreviewSuccess();
            }
          }
        } catch (err) {
          console.error('Lỗi phân tích dữ liệu SSE:', err);
        }
      });

      eventSource.addEventListener('error', (e) => {
        console.warn('Lỗi kết nối SSE hoặc luồng đóng, đang sử dụng fallback polling...', e);
        eventSource.close();
        // Fallback to optimized status polling
        fallbackPollJobStatus(previewData.jobId);
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khởi chạy import dữ liệu.');
      setImporting(false);
      setImportProgress(null);
    }
  };

  const fallbackPollJobStatus = async (jobId) => {
    try {
      const res = await api.get(`/admin/import/jobs/${jobId}`);
      const job = res.data.data;
      
      let duplicateDetails = [];
      let errorDetails = [];
      try {
        if (job.duplicateDetails) duplicateDetails = JSON.parse(job.duplicateDetails);
        if (job.errorDetails) errorDetails = JSON.parse(job.errorDetails);
      } catch (ex) {}

      const total = job.totalRows || 0;
      const success = job.successRows || 0;
      const duplicate = job.duplicateRows || 0;
      const failed = job.failedRows || 0;
      const processed = success + duplicate + failed;
      const percentage = total > 0 ? Math.round((processed / total) * 1000) / 10 : 0;

      const progressData = {
        jobId: job.id,
        status: job.status,
        totalRows: total,
        successRows: success,
        duplicateRows: duplicate,
        failedRows: failed,
        processedRows: processed,
        percentage,
        duplicateDetails,
        errorDetails
      };

      setImportProgress(progressData);

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        setImporting(false);
        setImportResult(progressData);
        toast.success('Nhập dữ liệu hoàn tất (fallback polling)!');
        if (onPreviewSuccess) {
          onPreviewSuccess();
        }
      } else {
        // Continue polling every 2s
        setTimeout(() => fallbackPollJobStatus(jobId), 2000);
      }
    } catch (err) {
      console.error('Lỗi fallback polling status:', err);
      setImporting(false);
      // Try to recover by retrying polling or declaring finished
      toast.error('Mất kết nối kiểm tra tiến trình.');
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setImportProgress(null);
    setImportResult(null);
    setLoading(false);
    setImporting(false);
    setActiveReportTab('summary');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900">
              Import Excel - {entityType === 'product' ? 'Sản phẩm' : 'Danh mục'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Tải lên tệp Excel chứa dữ liệu của bạn để import thông minh</p>
          </div>
          <button 
            onClick={() => { resetState(); onClose(); }}
            disabled={importing}
            className={`p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors ${
              importing ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {!file && !loading && !previewData && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-50/40 scale-[0.99]' 
                  : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-4">
                <Upload size={32} />
              </div>
              <p className="font-bold text-gray-800 text-center">Kéo và thả tệp Excel của bạn vào đây</p>
              <p className="text-xs text-gray-500 mt-1 text-center">Hoặc click để duyệt tìm tệp từ máy tính</p>
              <p className="text-[10px] text-gray-400 mt-3 px-3 py-1 bg-gray-100 rounded-full">Hỗ trợ định dạng: .xlsx, .xls</p>
            </div>
          )}

          {/* Loading parsing */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Spinner size="lg" className="text-emerald-600" />
              <div className="text-center">
                <p className="font-bold text-gray-800 animate-pulse">Đang phân tích cấu trúc dữ liệu tệp Excel...</p>
                <p className="text-xs text-gray-500 mt-1">So khớp trường bằng AI Fuzzy Logic & Phân tích các ràng buộc</p>
              </div>
            </div>
          )}

          {/* Preview data details before Import confirmation */}
          {previewData && !loading && !importResult && !importProgress && (
            <div className="space-y-6 animate-fade-in">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
                  <p className="text-2xl font-black text-gray-900">{previewData.totalRows}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">Tổng số dòng</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4">
                  <p className="text-2xl font-black text-emerald-700">{previewData.validRows}</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">Dòng hợp lệ (Sẵn sàng import)</p>
                </div>
                <div className={`border rounded-2xl p-4 ${
                  previewData.errorRows > 0 ? 'bg-red-50/40 border-red-100' : 'bg-gray-50/50 border-gray-100'
                }`}>
                  <p className={`text-2xl font-black ${previewData.errorRows > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {previewData.errorRows}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">Dòng lỗi (Bỏ qua khi import)</p>
                </div>
              </div>

              {/* Column Mapping Configuration */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                  <Info size={15} className="text-blue-600" />
                  <span className="text-sm font-bold text-gray-800">Kết quả ánh xạ cột tự động (Fuzzy Mappings)</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[180px] overflow-y-auto scrollbar-thin">
                  {Object.entries(previewData.columnMappings || {}).map(([excelCol, targetField]) => (
                    <div key={excelCol} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-xs">
                      <span className="font-semibold text-gray-700 truncate max-w-[120px]">{excelCol}</span>
                      <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="font-black text-emerald-700 truncate">{targetField}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview Table */}
              {previewData.rows && previewData.rows.length > 0 && (
                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">Dữ liệu xem trước (Tối đa 5 dòng đầu)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                          <th className="px-4 py-3">Dòng</th>
                          {entityType === 'product' ? (
                            <>
                              <th className="px-4 py-3">Tên sản phẩm</th>
                              <th className="px-4 py-3">SKU</th>
                              <th className="px-4 py-3">Giá bán</th>
                              <th className="px-4 py-3">Tồn kho</th>
                              <th className="px-4 py-3">Danh mục</th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3">Tên danh mục</th>
                              <th className="px-4 py-3">Slug</th>
                              <th className="px-4 py-3">Mô tả</th>
                              <th className="px-4 py-3">Danh mục cha</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {previewData.rows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-bold text-gray-500">#{row.rowIndex || idx + 2}</td>
                            {entityType === 'product' ? (
                              <>
                                <td className="px-4 py-2.5 font-semibold text-gray-900 truncate max-w-[200px]">{row.product_name || row.name || '-'}</td>
                                <td className="px-4 py-2.5 font-mono text-gray-500">{row.sku || '-'}</td>
                                <td className="px-4 py-2.5 font-bold text-emerald-700">
                                  {row.price !== undefined && row.price !== null 
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.price) 
                                    : '-'}
                                </td>
                                <td className="px-4 py-2.5 font-medium">{row.stock ?? '-'}</td>
                                <td className="px-4 py-2.5 text-gray-500">{row.category_name || row.category_slug || '-'}</td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2.5 font-semibold text-gray-900 truncate max-w-[200px]">{row.name || '-'}</td>
                                <td className="px-4 py-2.5 font-mono text-gray-500">{row.slug || '-'}</td>
                                <td className="px-4 py-2.5 text-gray-500 truncate max-w-[200px]">{row.description || '-'}</td>
                                <td className="px-4 py-2.5 text-gray-500">{row.parent_name || row.parent_slug || '-'}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.rows.length > 5 && (
                    <div className="px-5 py-2.5 bg-gray-50/30 text-center border-t border-gray-100 text-[10px] text-gray-400 font-medium">
                      và {previewData.rows.length - 5} dòng dữ liệu khác...
                    </div>
                  )}
                </div>
              )}

              {/* Errors List */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div className="border border-red-100 rounded-2xl overflow-hidden bg-red-50/10">
                  <div className="px-5 py-4 bg-red-50/40 border-b border-red-100 flex items-center gap-2 text-red-700">
                    <AlertTriangle size={15} />
                    <span className="text-sm font-bold">Chi tiết danh sách các dòng bị lỗi</span>
                  </div>
                  <div className="p-4 space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                    {previewData.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-xs bg-white border border-red-50 p-3 rounded-xl shadow-sm">
                        <span className="font-black text-red-700 flex-shrink-0">Dòng {err.row}:</span>
                        <span className="text-gray-600 font-medium">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Progress Tracking Panel */}
          {importProgress && !importResult && (
            <div className="space-y-6 py-6 animate-fade-in">
              {/* Progress Bar & Header */}
              <div className="text-center space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-gray-700 px-1">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <RefreshCw size={15} className="animate-spin text-emerald-500" />
                    Đang tiến hành import dữ liệu...
                  </span>
                  <span className="font-black text-emerald-700">{importProgress.percentage}%</span>
                </div>
                
                {/* Glow horizontal progress track */}
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 shadow-inner relative">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    style={{ width: `${importProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Tiến trình: <span className="font-bold text-gray-800">{importProgress.processedRows}</span> / <span className="font-bold text-gray-800">{importProgress.totalRows}</span> bản ghi
                </p>
              </div>

              {/* Real-time counters grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Success Card */}
                <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                  <div className="p-3 bg-emerald-100/80 rounded-xl text-emerald-600 shadow-sm shadow-emerald-500/10">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-700">{importProgress.successRows}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">✓ Thành công</p>
                  </div>
                </div>

                {/* Duplicate Card */}
                <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                  <div className="p-3 bg-amber-100/80 rounded-xl text-amber-600 shadow-sm shadow-amber-500/10">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-amber-700">{importProgress.duplicateRows}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">⚠ Trùng dữ liệu</p>
                  </div>
                </div>

                {/* Failed Card */}
                <div className="bg-red-50/40 border border-red-100/60 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                  <div className="p-3 bg-red-100/80 rounded-xl text-red-600 shadow-sm shadow-red-500/10">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-red-700">{importProgress.failedRows}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">✗ Lỗi hệ thống</p>
                  </div>
                </div>
              </div>

              {/* Information Ticker */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex items-start gap-3 shadow-inner">
                <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-800">Quy trình xử lý Pipeline thời gian thực</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Mỗi bản ghi được import sẽ chạy qua pipeline đầy đủ: <span className="font-bold text-gray-700">Validate Dữ liệu nguồn</span> &rarr;{' '}
                    <span className="font-bold text-gray-700">Tạo Vector Embedding</span> &rarr;{' '}
                    <span className="font-bold text-gray-700">Lưu Vector vào Qdrant</span> &rarr;{' '}
                    <span className="font-bold text-gray-700">Lưu Metadata vào MySQL</span>. Nếu xảy ra lỗi ở bất kỳ bước nào, MySQL sẽ tự động rollback dữ liệu dòng đó.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Final Summary Report after completion */}
          {importResult && (
            <div className="space-y-6 animate-scale-up">
              {/* Success Message Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600 ring-8 ring-emerald-50/50 shadow-sm">
                  <CheckCircle2 size={40} />
                </div>
                <h4 className="text-xl font-black text-gray-900">Hoàn tất quá trình Import!</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Tệp Excel đã được xử lý hoàn toàn. Dữ liệu hợp lệ đã được lưu và index thành công lên Qdrant Vector DB.
                </p>
              </div>

              {/* Report Tabs */}
              <div className="flex border-b border-gray-200 gap-2">
                <button
                  onClick={() => setActiveReportTab('summary')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                    activeReportTab === 'summary' 
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/20' 
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveReportTab('duplicates')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                    activeReportTab === 'duplicates'
                      ? 'border-amber-500 text-amber-700 bg-amber-50/20'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Trùng lặp ({importResult.duplicateRows || 0})
                </button>
                <button
                  onClick={() => setActiveReportTab('errors')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                    activeReportTab === 'errors'
                      ? 'border-red-500 text-red-700 bg-red-50/20'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Bị lỗi ({importResult.failedRows || 0})
                </button>
              </div>

              {/* Tab contents */}
              <div className="min-h-[200px]">
                {activeReportTab === 'summary' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-gray-900">{importResult.totalRows}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Tổng bản ghi</p>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-100/40 rounded-2xl p-4 text-center animate-pulse-slow">
                        <p className="text-3xl font-black text-emerald-700">{importResult.successRows}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">Thành công</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-gray-750">
                          {(importResult.duplicateRows || 0) + (importResult.failedRows || 0)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Bỏ qua</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-xs text-gray-600 font-medium">
                        <span>Đã lưu thành công:</span>
                        <span className="font-bold text-emerald-700">{importResult.successRows} / {importResult.totalRows}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 font-medium">
                        <span>Trùng lặp (Không import lại):</span>
                        <span className="font-bold text-amber-700">{importResult.duplicateRows || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 font-medium">
                        <span>Lỗi hệ thống phát sinh:</span>
                        <span className="font-bold text-red-750">{importResult.failedRows || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeReportTab === 'duplicates' && (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[240px] overflow-y-auto scrollbar-thin animate-fade-in">
                    {importResult.duplicateDetails && importResult.duplicateDetails.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {importResult.duplicateDetails.map((dup, i) => (
                          <div key={i} className="p-4 flex gap-3 items-start hover:bg-gray-50/50">
                            <div className="p-1 bg-amber-50 rounded text-amber-500 flex-shrink-0 mt-0.5 text-[10px] font-black">
                              Dòng {dup.row}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{dup.item}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{dup.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-gray-400 font-medium">
                        Không phát hiện bản ghi trùng lặp nào.
                      </div>
                    )}
                  </div>
                )}

                {activeReportTab === 'errors' && (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[240px] overflow-y-auto scrollbar-thin animate-fade-in">
                    {importResult.errorDetails && importResult.errorDetails.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {importResult.errorDetails.map((err, i) => (
                          <div key={i} className="p-4 flex gap-3 items-start hover:bg-gray-50/50">
                            <div className="p-1 bg-red-50 rounded text-red-500 flex-shrink-0 mt-0.5 text-[10px] font-black">
                              Dòng {err.row}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{err.item}</p>
                              <p className="text-[10px] text-red-500 font-medium mt-0.5 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {err.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-gray-400 font-medium">
                        Không phát hiện dòng lỗi nào phát sinh trong quá trình import.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            {file && !loading && (
              <span className="text-xs text-gray-500 font-medium truncate max-w-[200px] inline-block">
                File: {file.name}
              </span>
            )}
          </div>
          
          <div className="flex gap-2.5">
            {file && !loading && !importing && !importProgress && (
              <button
                onClick={resetState}
                className="px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Chọn lại file
              </button>
            )}
            
            <button
              onClick={() => { resetState(); onClose(); }}
              disabled={importing}
              className={`px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors ${
                importing ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              Đóng
            </button>

            {previewData && !importResult && !importProgress && (
              <button
                onClick={handleConfirmImport}
                disabled={importing || previewData.validRows === 0}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-300 ${
                  previewData.validRows === 0 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg shadow-emerald-500/10'
                }`}
              >
                Xác nhận Import
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportExcelModal;
