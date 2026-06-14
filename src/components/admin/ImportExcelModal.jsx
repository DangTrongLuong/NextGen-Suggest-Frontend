import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Info, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../common/Loading';

const ImportExcelModal = ({ isOpen, onClose, entityType, onPreviewSuccess, previewApi, confirmApi }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
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
    try {
      const data = await confirmApi(previewData.jobId, previewData.rows);
      setImportResult(data);
      toast.success('Nhập dữ liệu thành công!');
      if (onPreviewSuccess) {
        onPreviewSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi trong quá trình import dữ liệu.');
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setLoading(false);
    setImporting(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm transition-opacity">
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
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
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

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Spinner size="lg" className="text-emerald-600" />
              <div className="text-center">
                <p className="font-bold text-gray-800 animate-pulse">Đang phân tích cấu trúc dữ liệu tệp Excel...</p>
                <p className="text-xs text-gray-500 mt-1">So khớp trường bằng AI Fuzzy Logic & Phân tích các ràng buộc</p>
              </div>
            </div>
          )}

          {/* Preview data details */}
          {previewData && !loading && !importResult && (
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

          {/* Import complete success result */}
          {importResult && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center animate-scale-up">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-600">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h4 className="text-xl font-black text-gray-900">Hoàn tất nhập dữ liệu Excel!</h4>
                <p className="text-sm text-gray-500 mt-1">Hệ thống đã thực thi import và chạy đồng bộ nền vector Qdrant</p>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-lg w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 shadow-inner">
                <div>
                  <p className="text-2xl font-black text-gray-900">{importResult.totalRows}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Đã xử lý</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-700">{importResult.successRows}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase tracking-wider">Thành công</p>
                </div>
                <div>
                  <p className={`text-2xl font-black ${importResult.failedRows > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {importResult.failedRows}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Lỗi</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="border border-red-100 rounded-2xl overflow-hidden bg-red-50/10 text-left max-w-2xl w-full">
                  <div className="px-5 py-3 bg-red-50/40 border-b border-red-100 flex items-center gap-2 text-red-700">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-bold">Lỗi phát sinh trong quá trình lưu DB</span>
                  </div>
                  <div className="p-4 space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-xs bg-white border border-red-50 p-2.5 rounded-lg">
                        <span className="font-black text-red-700 flex-shrink-0">Dòng {err.row}:</span>
                        <span className="text-gray-600 font-medium">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            {file && !loading && !importing && (
              <button
                onClick={resetState}
                className="px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Chọn lại file
              </button>
            )}
            
            <button
              onClick={() => { resetState(); onClose(); }}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Đóng
            </button>

            {previewData && !importResult && (
              <button
                onClick={handleConfirmImport}
                disabled={importing || previewData.validRows === 0}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-300 ${
                  previewData.validRows === 0 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg shadow-emerald-500/10'
                }`}
              >
                {importing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Đang nhập dữ liệu ({previewData.validRows} dòng)...
                  </>
                ) : (
                  'Xác nhận Import'
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportExcelModal;
