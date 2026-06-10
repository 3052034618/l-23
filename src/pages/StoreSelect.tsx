import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, TrendingUp, Store } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getLevelColor, getLevelText } from '@/utils/scoreUtils';

export default function StoreSelect() {
  const navigate = useNavigate();
  const { stores, records } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const regions = useMemo(() => {
    const regionSet = new Set(stores.map((s) => s.region));
    return ['all', ...Array.from(regionSet)];
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || store.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [stores, searchQuery, selectedRegion]);

  const getLatestRecord = (storeId: string) => {
    const storeRecords = records.filter((r) => r.storeId === storeId);
    if (storeRecords.length === 0) return null;
    return storeRecords.sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    )[0];
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'pass';
    return 'fail';
  };

  const handleStoreClick = (storeId: string) => {
    navigate(`/store/${storeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white pt-8 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl">
              <Store size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">陈列评估工具</h1>
              <p className="text-primary-100 text-sm">智慧零售 · 标准巡店</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索门店名称或地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-400 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedRegion === region
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {region === 'all' ? '全部区域' : region}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredStores.map((store, index) => {
            const latestRecord = getLatestRecord(store.id);
            const scoreLevel = getScoreLevel(store.avgScore);

            return (
              <div
                key={store.id}
                onClick={() => handleStoreClick(store.id)}
                className="card p-5 cursor-pointer hover:scale-[1.02] transition-transform animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{store.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin size={14} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  </div>
                  <div className={`text-right ml-4`}>
                    <div className={`text-2xl font-bold ${getLevelColor(scoreLevel as any)}`}>
                      {store.avgScore}
                    </div>
                    <div className={`text-xs ${getLevelColor(scoreLevel as any)}`}>
                      {getLevelText(scoreLevel as any)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      <span>
                        {latestRecord ? latestRecord.visitDate : '暂无记录'}
                      </span>
                    </div>
                    <span className="tag tag-primary">{store.category}</span>
                  </div>
                  <div className="flex items-center text-accent-500">
                    <TrendingUp size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-16">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无匹配的门店</p>
          </div>
        )}
      </div>
    </div>
  );
}
