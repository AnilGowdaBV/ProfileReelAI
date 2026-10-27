import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface MockBadgeProps {
  sourceType?: string;
}

export const MockBadge: React.FC<MockBadgeProps> = ({ sourceType = 'MOCK_FIXTURE' }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
      <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
      <span>Demo / Mock Data Source ({sourceType})</span>
    </div>
  );
};
