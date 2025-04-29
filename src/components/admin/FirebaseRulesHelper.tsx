
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { firestoreRules, databaseRules, storageRules } from '@/config/firebaseRules';

export const FirebaseRulesHelper: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Firebase Security Rules</h2>
      <p className="text-muted-foreground">
        To fix permission errors, you need to update your Firebase security rules.
        Copy these rules and paste them into your Firebase console.
      </p>
      
      <Tabs defaultValue="database">
        <TabsList>
          <TabsTrigger value="firestore">Firestore Rules</TabsTrigger>
          <TabsTrigger value="database">Realtime DB Rules</TabsTrigger>
          <TabsTrigger value="storage">Storage Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="firestore" className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
              {firestoreRules}
            </pre>
          </div>
          <Button 
            onClick={() => copyToClipboard(firestoreRules, 'firestore')}
            variant="outline"
          >
            {copied === 'firestore' ? 'Copied!' : 'Copy Firestore Rules'}
          </Button>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
              {databaseRules}
            </pre>
          </div>
          <Button 
            onClick={() => copyToClipboard(databaseRules, 'database')}
            variant="outline"
          >
            {copied === 'database' ? 'Copied!' : 'Copy Database Rules'}
          </Button>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
              {storageRules}
            </pre>
          </div>
          <Button 
            onClick={() => copyToClipboard(storageRules, 'storage')}
            variant="outline"
          >
            {copied === 'storage' ? 'Copied!' : 'Copy Storage Rules'}
          </Button>
        </TabsContent>
      </Tabs>
      
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-md mt-4">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200">How to Update Rules</h3>
        <ol className="list-decimal list-inside text-sm mt-2 space-y-2 text-amber-700 dark:text-amber-300">
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
          <li>Select your project</li>
          <li>For Firestore rules: Go to Firestore Database → Rules</li>
          <li>For Realtime DB rules: Go to Realtime Database → Rules</li>
          <li>For Storage rules: Go to Storage → Rules</li>
          <li>Paste the rules and click "Publish"</li>
        </ol>
      </div>
    </div>
  );
};
