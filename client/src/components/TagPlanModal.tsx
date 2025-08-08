import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import API from '@/utils/axiosInstance';

export type PlanLite = {
  _id: string;
  title: string;
  author: { displayName: string };
};

interface TagPlanModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (plan: PlanLite) => void;
}

export default function TagPlanModal({
  open,
  onClose,
  onSelect,
}: TagPlanModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlanLite[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = query.trim();
      if (q.length === 0) {
        setResults([]);
        return;
      }
      setLoading(true);
      API.get(`/plans/search-for-tagging`, { params: { q } })
        .then((res) => {
          const data = res.data?.data || [];
          setResults(data);
        })
        .catch((err) => {
          console.error('Search plans error', err);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Gắn thẻ Kế hoạch</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            placeholder='Tìm theo tên kế hoạch hoặc điểm đến...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className='max-h-72 overflow-y-auto divide-y border rounded'>
            {loading && (
              <div className='p-3 text-sm text-gray-500'>Đang tìm...</div>
            )}
            {!loading && results.length === 0 && query.trim().length > 0 && (
              <div className='p-3 text-sm text-gray-500'>
                Không tìm thấy kế hoạch phù hợp
              </div>
            )}
            {!loading &&
              results.map((p) => (
                <button
                  key={p._id}
                  type='button'
                  className='w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50'
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                >
                  <div className='font-medium'>{p.title}</div>
                  <div className='text-xs text-gray-500'>
                    Tác giả: {p.author?.displayName || 'Ẩn danh'}
                  </div>
                </button>
              ))}
          </div>
          <div className='flex justify-end'>
            <Button variant='outline' onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
