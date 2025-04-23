
import React from "react";

interface NicknameSectionProps {
  nickname: string;
  error?: string;
}

export const NicknameSection: React.FC<NicknameSectionProps> = ({ nickname, error }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Nickname
      </label>
      <input
        type="text"
        value={nickname}
        readOnly
        tabIndex={-1}
        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md text-gray-400 cursor-not-allowed"
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
