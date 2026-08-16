import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, RefreshCw, XCircle, FileSpreadsheet, Trash2, Play, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../common/Loading';
import api from '../../services/api';

const ImportExcelModal = ({ isOpen, onClose, entityType, onPreviewSuccess, previewApi, confirmApi }) => {
  const [dragActive, setDragActive] = useState(false);
  const [filesQueue, setFilesQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [overallProgress, setOverallProgress] = useState(0);
  const [batchSummary, setBatchSummary] = useState(null);
  const [activeTab, setActiveReportTab] = useState('summary');

  const fileInputRef = useRef(null);
  const isProcessingRef = useRef(false);

  const resetState = useCallback(() => {
    isProcessingRef.current = false;
    setFilesQueue([]);
    setIsProcessing(false);
    setCurrentFileIndex(-1);
    setOverallProgress(0);
    setBatchSummary(null);
    setActiveReportTab('summary');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = (selectedFiles) => {
    const validFiles = [];
    selectedFiles.forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        validFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          status: 'pending', // pending, processing, completed, failed
          progress: 0,
          processedRows: 0,
          totalRows: 0,
          successRows: 0,
          duplicateRows: 0,
          failedRows: 0,
          errorMsg: ''
        });
      } else {
        toast.error(`Bỏ qua tệp ${file.name} (không phải .xlsx / .xls)`);
      }
    });

    if (validFiles.length > 0) {
      setFilesQueue((prev) => [...prev, ...validFiles]);
      toast.success(`Đã thêm ${validFiles.length} tệp vào hàng chờ import`);
    }
  };

  const removeFileFromQueue = (id) => {
    if (isProcessing) return;
    setFilesQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileInQueue = (id, updates) => {
    setFilesQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // ── Sequential Batch Processing Loop ──
  const startSequentialImport = async () => {
    if (filesQueue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    setBatchSummary(null);

    let totalBatchSuccess = 0;
    let totalBatchDuplicate = 0;
    let totalBatchFailed = 0;
    let totalBatchRows = 0;

    for (let i = 0; i < filesQueue.length; i++) {
      if (!isProcessingRef.current) break;

      const item = filesQueue[i];
      setCurrentFileIndex(i);
      updateFileInQueue(item.id, { status: 'processing', progress: 5 });

      try {
        // Step 1: Preview file
        const previewData = await previewApi(item.file);
        
        if (!previewData || !previewData.rows || previewData.rows.length === 0) {
          updateFileInQueue(item.id, {
            status: 'failed',
            progress: 100,
            errorMsg: 'Không có dòng dữ liệu hợp lệ'
          });
          totalBatchFailed += previewData?.totalRows || 0;
          continue;
        }

        updateFileInQueue(item.id, {
          totalRows: previewData.rows.length,
          progress: 20
        });

        // Step 2: Confirm & start import job
        const res = await confirmApi(previewData.jobId, previewData.rows);
        const jobId = previewData.jobId;

        // Step 3: Track SSE / Polling progress until completed
        const jobResult = await monitorJobProgress(jobId, item.id);

        if (jobResult) {
          const success = jobResult.successRows || 0;
          const duplicate = jobResult.duplicateRows || 0;
          const failed = jobResult.failedRows || 0;
          const total = jobResult.totalRows || previewData.rows.length;

          totalBatchSuccess += success;
          totalBatchDuplicate += duplicate;
          totalBatchFailed += failed;
          totalBatchRows += total;

          updateFileInQueue(item.id, {
            status: jobResult.status === 'COMPLETED' ? 'completed' : 'failed',
            progress: 100,
            totalRows: total,
            successRows: success,
            duplicateRows: duplicate,
            failedRows: failed
          });
        }
      } catch (err) {
        console.error(`Lỗi xử lý file ${item.name}:`, err);
        updateFileInQueue(item.id, {
          status: 'failed',
          progress: 100,
          errorMsg: err.response?.data?.message || 'Lỗi xử lý tệp'
        });
      }

      // Compute overall progress
      const percent = Math.round(((i + 1) / filesQueue.length) * 100);
      setOverallProgress(percent);
    }

    setIsProcessing(false);
    isProcessingRef.current = false;
    setCurrentFileIndex(-1);

    setBatchSummary({
      totalFiles: filesQueue.length,
      totalRows: totalBatchRows,
      totalSuccess: totalBatchSuccess,
      totalDuplicate: totalBatchDuplicate,
      totalFailed: totalBatchFailed
    });

    toast.success('Đã hoàn tất tiến trình import tất cả tệp!');
    if (onPreviewSuccess) {
      onPreviewSuccess();
    }
  };

  const monitorJobProgress = (jobId, fileQueueId) => {
    return new Promise((resolve) => {
      const tokensStored = localStorage.getItem('auth_tokens');
      let token = '';
      if (tokensStored) {
        try {
          token = JSON.parse(tokensStored).accessToken || '';
        } catch (e) {}
      }

      const baseURL = api.defaults.baseURL || '/api/v1';
      const sseUrl = `${baseURL}/admin/import/jobs/${jobId}/progress?token=Bearer ${token}`;
      const eventSource = new EventSource(sseUrl);

      const timeoutId = setTimeout(() => {
        eventSource.close();
        // Fallback polling if SSE times out
        pollJobStatusFallback(jobId, fileQueueId, resolve);
      }, 45000);

      eventSource.addEventListener('progress', (e) => {
        try {
          const progressData = JSON.parse(e.data);
          updateFileInQueue(fileQueueId, {
            progress: Math.min(99, progressData.percentage || 10),
            processedRows: progressData.processedRows || 0,
            totalRows: progressData.totalRows || 0,
            successRows: progressData.successRows || 0,
            duplicateRows: progressData.duplicateRows || 0,
            failedRows: progressData.failedRows || 0
          });

          if (progressData.status === 'COMPLETED' || progressData.status === 'FAILED') {
            clearTimeout(timeoutId);
            eventSource.close();
            resolve(progressData);
          }
        } catch (err) {
          console.error('Lỗi đọc SSE data:', err);
        }
      });

      eventSource.addEventListener('error', () => {
        clearTimeout(timeoutId);
        eventSource.close();
        pollJobStatusFallback(jobId, fileQueueId, resolve);
      });
    });
  };

  const pollJobStatusFallback = async (jobId, fileQueueId, resolve) => {
    try {
      const res = await api.get(`/admin/import/jobs/${jobId}`);
      const job = res.data.data;

      const total = job.totalRows || 0;
      const success = job.successRows || 0;
      const duplicate = job.duplicateRows || 0;
      const failed = job.failedRows || 0;
      const processed = success + duplicate + failed;
      const percentage = total > 0 ? Math.round((processed / total) * 100) : 100;

      updateFileInQueue(fileQueueId, {
        progress: percentage,
        processedRows: processed,
        totalRows: total,
        successRows: success,
        duplicateRows: duplicate,
        failedRows: failed
      });

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        resolve({
          status: job.status,
          totalRows: total,
          successRows: success,
          duplicateRows: duplicate,
          failedRows: failed
        });
      } else {
        setTimeout(() => pollJobStatusFallback(jobId, fileQueueId, resolve), 1500);
      }
    } catch (err) {
      console.error('Lỗi fallback polling:', err);
      resolve(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Import Excel - {entityType === 'product' ? 'Sản phẩm' : 'Danh mục'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tải lên danh sách các tệp Excel để xử lý lần lượt từng tệp
            </p>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            disabled={isProcessing}
            className={`p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors ${
              isProcessing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Dropzone (When no processing or summary) */}
          {!isProcessing && !batchSummary && (
            <>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                    : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-3">
                  <Upload size={28} />
                </div>
                <p className="font-bold text-gray-800 text-sm">Kéo & thả hoặc chọn nhiều tệp Excel cùng lúc</p>
                <p className="text-xs text-gray-400 mt-1">Các tệp sẽ được xử lý chạy lần lượt từ trên xuống dưới (.xlsx, .xls)</p>
              </div>

              {/* Selected Files Queue List */}
              {filesQueue.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>DANH SÁCH TỆP ĐÃ CHỌN ({filesQueue.length})</span>
                    <button
                      onClick={() => setFilesQueue([])}
                      className="text-rose-600 hover:underline cursor-pointer font-semibold"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {filesQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400">{item.size}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFileFromQueue(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sequential Import Progress Tracker */}
          {isProcessing && (
            <div className="space-y-6 py-4">
              {/* Overall Batch Status */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-900 flex items-center gap-2">
                    <RefreshCw className="animate-spin text-emerald-600" size={16} />
                    ĐANG CHẠY LẦN LƯỢT TỆP {currentFileIndex + 1} / {filesQueue.length}
                  </span>
                  <span className="text-emerald-800 font-mono">{overallProgress}%</span>
                </div>

                <div className="w-full bg-emerald-200/50 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Individual Files Processing Queue List */}
              <div className="space-y-2.5">
                {filesQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all text-xs ${
                      item.status === 'processing'
                        ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                        : item.status === 'completed'
                        ? 'bg-gray-50/80 border-gray-200'
                        : item.status === 'failed'
                        ? 'bg-red-50/50 border-red-200'
                        : 'bg-gray-50/40 border-gray-150 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet
                          size={16}
                          className={
                            item.status === 'processing'
                              ? 'text-emerald-600'
                              : item.status === 'completed'
                              ? 'text-emerald-500'
                              : item.status === 'failed'
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }
                        />
                        <span className="font-bold text-gray-900 truncate">{item.name}</span>
                      </div>

                      {/* Status Badges */}
                      {item.status === 'processing' && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full animate-pulse flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin" /> ĐANG IMPORT ({item.progress}%)
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Check size={10} /> XONG
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <XCircle size={10} /> LỖI
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">
                          CHỜ CHẠY
                        </span>
                      )}
                    </div>

                    {/* Progress details for active file */}
                    {item.status === 'processing' && (
                      <div className="mt-2 space-y-1.5">
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                          <span>Thành công: <b className="text-emerald-700">{item.successRows}</b></span>
                          <span>Trùng lặp: <b className="text-amber-600">{item.duplicateRows}</b></span>
                          <span>Lỗi: <b className="text-red-600">{item.failedRows}</b></span>
                        </div>
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        ✓ Đã nhập thành công <b className="text-emerald-700">{item.successRows}</b> / {item.totalRows} bản ghi
                      </p>
                    )}

                    {item.status === 'failed' && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">
                        ✗ {item.errorMsg || 'Không thể nhập dữ liệu tệp này'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Batch Completion Summary */}
          {batchSummary && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full mb-1">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-lg font-bold text-gray-900">HOÀN TẤT IMPORT TẤT CẢ CÁC TỆP!</h4>
                <p className="text-xs text-gray-500">
                  Đã chạy xong lần lượt <b className="text-gray-900">{batchSummary.totalFiles}</b> tệp Excel vào cơ sở dữ liệu
                </p>
              </div>

              {/* Consolidated Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <p className="text-2xl font-bold text-emerald-800">{batchSummary.totalSuccess}</p>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">THÀNH CÔNG</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <p className="text-2xl font-bold text-amber-800">{batchSummary.totalDuplicate}</p>
                  <p className="text-xs font-semibold text-amber-700 mt-0.5">TRÙNG LẶP</p>
                </div>
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                  <p className="text-2xl font-bold text-red-800">{batchSummary.totalFailed}</p>
                  <p className="text-xs font-semibold text-red-700 mt-0.5">BỎ QUA / LỖI</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {filesQueue.length > 0 ? `Đã chọn ${filesQueue.length} tệp` : ''}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => {
                resetState();
                onClose();
              }}
              disabled={isProcessing}
              className={`px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors ${
                isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {batchSummary ? 'ĐÓNG' : 'HỦY'}
            </button>

            {!isProcessing && filesQueue.length > 0 && !batchSummary && (
              <button
                onClick={startSequentialImport}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
              >
                <Play size={14} /> BẮT ĐẦU IMPORT ({filesQueue.length} TỆP)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportExcelModal;
