
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VipSettingsButtonProps {
  isVipUser: boolean;
}

export const VipSettingsButton = ({ isVipUser }: VipSettingsButtonProps) => {
  const navigate = useNavigate();

  if (!isVipUser) {
    return null;
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full"
      onClick={() => navigate('/vip/settings')}
      title="VIP Settings"
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
};
