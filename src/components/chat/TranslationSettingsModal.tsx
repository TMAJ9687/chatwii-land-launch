
import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGE_OPTIONS } from '@/hooks/message/useMessageTranslation';

interface TranslationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
}

export const TranslationSettingsModal: React.FC<TranslationSettingsModalProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  setTargetLanguage,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Translation Settings"
      description="Choose your preferred language for message translations"
      footer={
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Language</label>
          <Select 
            value={targetLanguage} 
            onValueChange={setTargetLanguage}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Messages will be translated to this language
          </p>
        </div>
      </div>
    </Modal>
  );
};
