import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  MapPin,
  X,
  Plus,
  Check,
  Tag,
  Percent,
  ChevronRight,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { compressImage, generateId } from '@/utils/imageUtils';
import type { OutOfStockItem, PriceTagCheck, PromoCheck } from '@/types';

export default function ShelfEvaluate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  const { stores, templates, addOutOfStock, removeOutOfStock, updatePriceTagChecks, updatePromoChecks, createRecord, updateRecord, records } = useAppStore();

  const store = stores.find((s) => s.id === id);
  const existingRecord = records.find((r) => r.storeId === id && r.visitDate === new Date().toISOString().split('T')[0]);

  const [shelfPhoto, setShelfPhoto] = useState<string>(existingRecord?.shelfPhoto || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(existingRecord?.templateId || '');
  const [outOfStockItems, setOutOfStockItems] = useState<OutOfStockItem[]>(existingRecord?.outOfStockItems || []);
  const [priceTagChecks, setPriceTagChecks] = useState<PriceTagCheck[]>(
    existingRecord?.priceTagChecks || [
      { id: 'pt-1', name: '价格牌齐全', checked: true },
      { id: 'pt-2', name: '价格牌清晰', checked: true },
      { id: 'pt-3', name: '价格正确', checked: true },
      { id: 'pt-4', name: '会员价标识', checked: false },
    ]
  );
  const [promoChecks, setPromoChecks] = useState<PromoCheck[]>(
    existingRecord?.promoChecks || [
      { id: 'pm-1', name: '促销海报到位', checked: false },
      { id: 'pm-2', name: '跳跳卡完好', checked: false },
      { id: 'pm-3', name: '价格签整齐', checked: true },
      { id: 'pm-4', name: '爆炸贴规范', checked: false },
    ]
  );
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState<{ x: number; y: number } | null>(null);
  const [annotationDesc, setAnnotationDesc] = useState('');
  const [annotationSeverity, setAnnotationSeverity] = useState<'high' | 'medium' | 'low'>('medium');
  const [activeTab, setActiveTab] = useState<'photo' | 'template' | 'check'>('photo');

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setShelfPhoto(compressed);
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  }, []);

  const handlePhotoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!shelfPhoto) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewAnnotation({ x, y });
    setAnnotationDesc('');
    setAnnotationSeverity('medium');
    setShowAnnotationModal(true);
  }, [shelfPhoto]);

  const handleAddAnnotation = () => {
    if (!newAnnotation || !annotationDesc.trim()) return;

    const newItem: OutOfStockItem = {
      id: generateId(),
      x: newAnnotation.x,
      y: newAnnotation.y,
      description: annotationDesc,
      severity: annotationSeverity,
    };

    setOutOfStockItems([...outOfStockItems, newItem]);
    setShowAnnotationModal(false);
    setNewAnnotation(null);
  };

  const handleRemoveAnnotation = (itemId: string) => {
    setOutOfStockItems(outOfStockItems.filter((i) => i.id !== itemId));
  };

  const togglePriceTagCheck = (checkId: string) => {
    setPriceTagChecks(
      priceTagChecks.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c))
    );
  };

  const togglePromoCheck = (checkId: string) => {
    setPromoChecks(
      promoChecks.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleNext = () => {
    if (!store) return;

    let recordId: string;
    if (existingRecord) {
      recordId = existingRecord.id;
      updateRecord(recordId, {
        shelfPhoto,
        templateId: selectedTemplate,
        outOfStockItems: [...outOfStockItems],
        priceTagChecks: [...priceTagChecks],
        promoChecks: [...promoChecks],
      });
    } else if (shelfPhoto) {
      const newRecord = createRecord(store.id, shelfPhoto, selectedTemplate);
      recordId = newRecord.id;
      outOfStockItems.forEach((item) => {
        addOutOfStock(recordId, { x: item.x, y: item.y, description: item.description, severity: item.severity });
      });
      updatePriceTagChecks(recordId, priceTagChecks);
      updatePromoChecks(recordId, promoChecks);
    } else {
      alert('请先上传货架照片');
      return;
    }

    navigate(`/score/${recordId}`);
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="货架评估" showBack />
        <div className="p-8 text-center text-gray-500">门店不存在</div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="货架评估" showBack />

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-primary-500" />
          <span className="font-medium text-gray-900">{store.name}</span>
          <span className="text-gray-400">·</span>
          <span>{store.category}</span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white sticky top-14 z-30">
        {[
          { key: 'photo', label: '照片标注', icon: <Camera size={16} /> },
          { key: 'template', label: '陈列模板', icon: <ImageIcon size={16} /> },
          { key: 'check', label: '检查项', icon: <Check size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'photo' && (
          <div className="space-y-4">
            <div
              ref={photoContainerRef}
              onClick={handlePhotoClick}
              className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 ${
                shelfPhoto ? 'cursor-crosshair' : ''
              }`}
            >
              {shelfPhoto ? (
                <>
                  <img src={shelfPhoto} alt="货架照片" className="w-full h-full object-cover" />
                  {outOfStockItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${getSeverityColor(
                          item.severity
                        )} text-white flex items-center justify-center text-xs font-bold shadow-lg animate-pulse-slow cursor-pointer hover:scale-125 transition-transform`}
                      >
                        {index + 1}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAnnotation(item.id);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageIcon size={48} className="mb-2" />
                  <p className="text-sm">点击下方按钮上传货架照片</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 btn btn-primary"
              >
                <Camera size={18} className="mr-2" />
                拍照/上传
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertCircle size={18} className="text-accent-500" />
                  缺货标注
                  <span className="tag tag-accent">{outOfStockItems.length} 处</span>
                </h3>
              </div>
              {outOfStockItems.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {outOfStockItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full ${getSeverityColor(
                            item.severity
                          )} text-white flex items-center justify-center text-xs font-bold`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-500">
                            {item.severity === 'high'
                              ? '高优先级'
                              : item.severity === 'medium'
                              ? '中优先级'
                              : '低优先级'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAnnotation(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  点击照片添加缺货标注
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">选择对应的标准陈列模板进行对照</p>
            <div className="grid gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`card p-3 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        {selectedTemplate === template.id && (
                          <Check size={16} className="text-primary-500" />
                        )}
                      </div>
                      <span className="tag tag-primary text-xs mt-1">{template.category}</span>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'check' && (
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                <Tag size={18} className="text-primary-500" />
                价格牌检查
              </h3>
              <div className="space-y-2">
                {priceTagChecks.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => togglePriceTagCheck(check.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      check.checked ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm text-gray-700">{check.name}</span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        check.checked ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {check.checked && <Check size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                <Percent size={18} className="text-accent-500" />
                促销物料检查
              </h3>
              <div className="space-y-2">
                {promoChecks.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => togglePromoCheck(check.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      check.checked ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm text-gray-700">{check.name}</span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        check.checked ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {check.checked && <Check size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <button
          onClick={handleNext}
          disabled={!shelfPhoto}
          className="w-full btn btn-accent text-base py-3"
        >
          查看评分
          <ChevronRight size={20} className="ml-1" />
        </button>
      </div>

      {showAnnotationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">添加缺货标注</h3>
              <button
                onClick={() => setShowAnnotationModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  缺货商品描述
                </label>
                <input
                  type="text"
                  value={annotationDesc}
                  onChange={(e) => setAnnotationDesc(e.target.value)}
                  placeholder="例如：可乐330ml缺货"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'high', label: '高', color: 'bg-red-500' },
                    { value: 'medium', label: '中', color: 'bg-yellow-500' },
                    { value: 'low', label: '低', color: 'bg-green-500' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setAnnotationSeverity(s.value as any)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        annotationSeverity === s.value
                          ? `${s.color} text-white`
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddAnnotation}
                disabled={!annotationDesc.trim()}
                className="w-full btn btn-primary"
              >
                <Plus size={18} className="mr-1" />
                添加标注
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
