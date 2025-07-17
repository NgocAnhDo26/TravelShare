import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { User } from '@/context/AuthContext';
import { canEditPlan } from '@/utils/planPermissions';

interface EditButtonProps {
  plan: Trip;
  user: User | null;
  onClick: () => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: React.ReactNode;
}

/**
 * A button that only renders when the user can edit the plan
 */
const EditButton: React.FC<EditButtonProps> = ({
  plan,
  user,
  onClick,
  className = '',
  size = 'sm',
  variant = 'outline',
  children
}) => {
  if (!canEditPlan(plan, user)) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={className}
    >
      <Pencil className="w-4 h-4 mr-2" />
      {children || 'Edit'}
    </Button>
  );
};

export default EditButton; 