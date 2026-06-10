import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store, ShelfRecord, OutOfStockItem, RectifyTask, PriceTagCheck, PromoCheck, Score } from '@/types';
import { mockStores, mockRecords, displayTemplates } from '@/data/mockData';
import { calculateScore } from '@/utils/scoreUtils';
import { generateId } from '@/utils/imageUtils';

interface AppState {
  stores: Store[];
  records: ShelfRecord[];
  templates: typeof displayTemplates;
  currentStoreId: string | null;
  currentRecordId: string | null;

  setCurrentStore: (storeId: string) => void;
  setCurrentRecord: (recordId: string) => void;

  createRecord: (storeId: string, shelfPhoto: string, templateId: string) => ShelfRecord;
  updateRecord: (recordId: string, updates: Partial<ShelfRecord>) => void;
  getRecord: (recordId: string) => ShelfRecord | undefined;

  addOutOfStock: (recordId: string, item: Omit<OutOfStockItem, 'id'>) => void;
  removeOutOfStock: (recordId: string, itemId: string) => void;
  updateOutOfStock: (recordId: string, itemId: string, updates: Partial<OutOfStockItem>) => void;

  updatePriceTagChecks: (recordId: string, checks: PriceTagCheck[]) => void;
  updatePromoChecks: (recordId: string, checks: PromoCheck[]) => void;

  calculateAndSetScore: (recordId: string, tidiness: number, visibility: number, focusRatio: number) => Score;

  addRectifyTask: (recordId: string, task: Omit<RectifyTask, 'id'>) => void;
  updateRectifyTask: (recordId: string, taskId: string, updates: Partial<RectifyTask>) => void;
  removeRectifyTask: (recordId: string, taskId: string) => void;
  generateRectifyTasksFromEvaluation: (recordId: string) => void;

  filteredRecords: (filters: {
    dateRange?: { start: string; end: string };
    storeId?: string;
    category?: string;
    scoreLevel?: string;
  }) => ShelfRecord[];
}

const defaultPriceTagChecks: PriceTagCheck[] = [
  { id: 'pt-1', name: '价格牌齐全', checked: true },
  { id: 'pt-2', name: '价格牌清晰', checked: true },
  { id: 'pt-3', name: '价格正确', checked: true },
  { id: 'pt-4', name: '会员价标识', checked: false },
];

const defaultPromoChecks: PromoCheck[] = [
  { id: 'pm-1', name: '促销海报到位', checked: false },
  { id: 'pm-2', name: '跳跳卡完好', checked: false },
  { id: 'pm-3', name: '价格签整齐', checked: true },
  { id: 'pm-4', name: '爆炸贴规范', checked: false },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      stores: mockStores,
      records: mockRecords,
      templates: displayTemplates,
      currentStoreId: null,
      currentRecordId: null,

      setCurrentStore: (storeId) => set({ currentStoreId: storeId }),
      setCurrentRecord: (recordId) => set({ currentRecordId: recordId }),

      createRecord: (storeId, shelfPhoto, templateId) => {
        const store = get().stores.find((s) => s.id === storeId);
        if (!store) throw new Error('Store not found');

        const newRecord: ShelfRecord = {
          id: generateId(),
          storeId: store.id,
          storeName: store.name,
          storeCategory: store.category,
          shelfPhoto,
          templateId,
          visitDate: new Date().toISOString().split('T')[0],
          inspector: '当前督导',
          outOfStockItems: [],
          priceTagChecks: JSON.parse(JSON.stringify(defaultPriceTagChecks)),
          promoChecks: JSON.parse(JSON.stringify(defaultPromoChecks)),
          score: {
            tidiness: 80,
            fullness: 100,
            visibility: 80,
            focusRatio: 80,
            total: 85,
            level: 'good',
          },
          rectifyTasks: [],
          notes: '',
        };

        set((state) => ({
          records: [newRecord, ...state.records],
          currentRecordId: newRecord.id,
        }));

        return newRecord;
      },

      updateRecord: (recordId, updates) =>
        set((state) => ({
          records: state.records.map((r) => (r.id === recordId ? { ...r, ...updates } : r)),
        })),

      getRecord: (recordId) => get().records.find((r) => r.id === recordId),

      addOutOfStock: (recordId, item) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? { ...r, outOfStockItems: [...r.outOfStockItems, { ...item, id: generateId() }] }
              : r
          ),
        })),

      removeOutOfStock: (recordId, itemId) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? { ...r, outOfStockItems: r.outOfStockItems.filter((i) => i.id !== itemId) }
              : r
          ),
        })),

      updateOutOfStock: (recordId, itemId, updates) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  outOfStockItems: r.outOfStockItems.map((i) =>
                    i.id === itemId ? { ...i, ...updates } : i
                  ),
                }
              : r
          ),
        })),

      updatePriceTagChecks: (recordId, checks) =>
        set((state) => ({
          records: state.records.map((r) => (r.id === recordId ? { ...r, priceTagChecks: checks } : r)),
        })),

      updatePromoChecks: (recordId, checks) =>
        set((state) => ({
          records: state.records.map((r) => (r.id === recordId ? { ...r, promoChecks: checks } : r)),
        })),

      calculateAndSetScore: (recordId, tidiness, visibility, focusRatio) => {
        const record = get().records.find((r) => r.id === recordId);
        if (!record) throw new Error('Record not found');

        const score = calculateScore(tidiness, record.outOfStockItems, visibility, focusRatio);

        set((state) => ({
          records: state.records.map((r) => (r.id === recordId ? { ...r, score } : r)),
        }));

        return score;
      },

      addRectifyTask: (recordId, task) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? { ...r, rectifyTasks: [...r.rectifyTasks, { ...task, id: generateId() }] }
              : r
          ),
        })),

      updateRectifyTask: (recordId, taskId, updates) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  rectifyTasks: r.rectifyTasks.map((t) =>
                    t.id === taskId ? { ...t, ...updates } : t
                  ),
                }
              : r
          ),
        })),

      removeRectifyTask: (recordId, taskId) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? { ...r, rectifyTasks: r.rectifyTasks.filter((t) => t.id !== taskId) }
              : r
          ),
        })),

      generateRectifyTasksFromEvaluation: (recordId) => {
        const record = get().records.find((r) => r.id === recordId);
        if (!record) throw new Error('Record not found');

        const existingTaskDescriptions = new Set(record.rectifyTasks.map((t) => t.description));
        const newTasks: Omit<RectifyTask, 'id'>[] = [];

        record.outOfStockItems.forEach((item) => {
          const description = `${item.description}，请及时补货`;
          if (!existingTaskDescriptions.has(description)) {
            newTasks.push({
              description,
              position: `货架位置 (${Math.round(item.x)}%, ${Math.round(item.y)}%)`,
              severity: item.severity === 'high' ? 'urgent' : item.severity === 'medium' ? 'high' : 'medium',
              status: 'pending',
            });
          }
        });

        record.priceTagChecks.forEach((check) => {
          if (!check.checked) {
            const description = `${check.name}未达标，请整改`;
            if (!existingTaskDescriptions.has(description)) {
              newTasks.push({
                description,
                position: '全场货架',
                severity: 'high',
                status: 'pending',
              });
            }
          }
        });

        record.promoChecks.forEach((check) => {
          if (!check.checked) {
            const description = `${check.name}未达标，请整改`;
            if (!existingTaskDescriptions.has(description)) {
              newTasks.push({
                description,
                position: '促销区域',
                severity: 'medium',
                status: 'pending',
              });
            }
          }
        });

        if (newTasks.length > 0) {
          set((state) => ({
            records: state.records.map((r) =>
              r.id === recordId
                ? {
                    ...r,
                    rectifyTasks: [
                      ...r.rectifyTasks,
                      ...newTasks.map((t) => ({ ...t, id: generateId() })),
                    ],
                  }
                : r
            ),
          }));
        }
      },

      filteredRecords: (filters) => {
        const { records, templates } = get();
        let result = [...records];

        if (filters.dateRange) {
          result = result.filter(
            (r) => r.visitDate >= filters.dateRange!.start && r.visitDate <= filters.dateRange!.end
          );
        }

        if (filters.storeId) {
          result = result.filter((r) => r.storeId === filters.storeId);
        }

        if (filters.category) {
          result = result.filter((r) => {
            const template = templates.find((t) => t.id === r.templateId);
            return template?.category === filters.category;
          });
        }

        if (filters.scoreLevel) {
          result = result.filter((r) => r.score.level === filters.scoreLevel);
        }

        return result.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
      },
    }),
    {
      name: 'retail-display-app-storage',
    }
  )
);
