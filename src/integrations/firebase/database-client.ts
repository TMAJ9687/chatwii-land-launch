import { 
  collection, doc, getDocs, query, where, orderBy, limit,
  serverTimestamp, Timestamp, DocumentData, 
  WhereFilterOp
} from 'firebase/firestore';
import { ref } from 'firebase/storage';
import { db, auth, storage } from './client';
import { uploadFile, getFileDownloadURL, deleteFile } from './storage';
import { getUserProfile } from './auth';

// Firebase database client
export const firebaseClient = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      try {
        const { signInWithEmail } = await import('./auth');
        const user = await signInWithEmail(email, password);
        return { data: { user }, error: null };
      } catch (error) {
        return { data: {}, error };
      }
    },
    signUp: async ({ email, password }: { email: string, password: string }) => {
      try {
        const { signUpWithEmail } = await import('./auth');
        const user = await signUpWithEmail(email, password);
        return { data: { user }, error: null };
      } catch (error) {
        return { data: {}, error };
      }
    },
    signOut: async () => {
      try {
        const { signOutUser } = await import('./auth');
        await signOutUser();
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    getSession: async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return { data: { session: null } };
      
      return { 
        data: { 
          session: {
            user: currentUser
          } 
        } 
      };
    },
    getUser: async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return { data: { user: null } };
      return { data: { user: currentUser } };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        callback('SIGNED_IN', { user });
      });
      
      return { data: { subscription: { unsubscribe } } };
    },
    updateUser: async (data: any) => {
      try {
        // This would need to be implemented with proper Firebase Auth functionality
        return { data: {}, error: null };
      } catch (error) {
        return { error };
      }
    }
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (field: string, value: any) => ({
        single: async () => {
          try {
            const { queryDocuments } = await import('./firestore');
            const documents = await queryDocuments(table, [
              { field, operator: "==" as WhereFilterOp, value }
            ]);
            return { data: documents[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        maybeSingle: async () => {
          try {
            const { queryDocuments } = await import('./firestore');
            const documents = await queryDocuments(table, [
              { field, operator: "==" as WhereFilterOp, value }
            ]);
            return { data: documents[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        range: async (from: number, to: number) => {
          try {
            const { queryDocuments } = await import('./firestore');
            const documents = await queryDocuments(table, [
              { field, operator: "==" as WhereFilterOp, value }
            ]);
            // Implement range pagination (this is simplified)
            return { data: documents.slice(from, to + 1), error: null };
          } catch (error) {
            return { data: [], error };
          }
        },
        order: (column: string, options?: { ascending?: boolean }) => ({
          limit: (count: number) => ({
            range: async (from: number, to: number) => {
              try {
                const { queryDocuments } = await import('./firestore');
                const documents = await queryDocuments(
                  table, 
                  [{ field, operator: "==" as WhereFilterOp, value }],
                  column,
                  options?.ascending ? "asc" : "desc",
                  count
                );
                return { data: documents.slice(from, to + 1), error: null };
              } catch (error) {
                return { data: [], error };
              }
            },
          }),
        }),
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        range: async (from: number, to: number) => {
          try {
            const { queryDocuments } = await import('./firestore');
            const documents = await queryDocuments(
              table, 
              [],
              column,
              options?.ascending ? "asc" : "desc"
            );
            return { data: documents.slice(from, to + 1), error: null };
          } catch (error) {
            return { data: [], error };
          }
        },
        limit: (count: number) => ({
          range: async (from: number, to: number) => {
            try {
              const { queryDocuments } = await import('./firestore');
              const documents = await queryDocuments(
                table, 
                [],
                column,
                options?.ascending ? "asc" : "desc",
                count
              );
              return { data: documents.slice(from, to + 1), error: null };
            } catch (error) {
              return { data: [], error };
            }
          },
        }),
      }),
      in: (field: string, values: any[]) => ({
        range: async (from: number, to: number) => {
          try {
            const { queryDocuments } = await import('./firestore');
            // Firebase doesn't have direct 'in' operator in the same way
            // Use "in" operator in Firebase
            const documents = await queryDocuments(table, [
              { field, operator: "in" as WhereFilterOp, value: values }
            ]);
            return { data: documents.slice(from, to + 1), error: null };
          } catch (error) {
            return { data: [], error };
          }
        },
      }),
      range: async (from: number, to: number) => {
        try {
          const collectionRef = collection(db, table);
          const q = query(collectionRef);
          const snapshot = await getDocs(q);
          
          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          return { data: documents.slice(from, to + 1), error: null };
        } catch (error) {
          return { data: [], error };
        }
      },
    }),
    insert: (values: any, options?: any) => ({
      select: (columns: string) => ({
        single: async () => {
          try {
            const { setDocument, createDocument, getDocument } = await import('./firestore');
            let insertId: string;
            if (values.id) {
              await setDocument(table, values.id, values);
              insertId = values.id;
            } else {
              insertId = await createDocument(table, values);
            }
            
            const document = await getDocument(table, insertId);
            return { data: document, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
      }),
      single: async () => {
        try {
          const { setDocument, createDocument, getDocument } = await import('./firestore');
          let insertId: string;
          if (values.id) {
            await setDocument(table, values.id, values);
            insertId = values.id;
          } else {
            insertId = await createDocument(table, values);
          }
          
          const document = await getDocument(table, insertId);
          return { data: document, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
    update: (values: any) => ({
      eq: (field: string, value: any) => ({
        single: async () => {
          try {
            const { queryDocuments, updateDocument, getDocument } = await import('./firestore');
            // Find document by field
            const documents = await queryDocuments(table, [
              { field, operator: "==" as WhereFilterOp, value }
            ]);
            
            if (documents && documents[0]) {
              const docId = documents[0].id;
              await updateDocument(table, docId, values);
              const updated = await getDocument(table, docId);
              return { data: updated, error: null };
            }
            
            return { data: null, error: new Error("Document not found") };
          } catch (error) {
            return { data: null, error };
          }
        },
      }),
      match: async (criteria: any) => {
        try {
          const { queryDocuments, updateDocument, getDocument } = await import('./firestore');
          // Find document by multiple criteria
          const conditions = Object.entries(criteria).map(([field, value]) => ({
            field, 
            operator: "==" as WhereFilterOp, 
            value
          }));
          
          const documents = await queryDocuments(table, conditions as any[]);
          
          if (documents && documents[0]) {
            const docId = documents[0].id;
            await updateDocument(table, docId, values);
            const updated = await getDocument(table, docId);
            return { data: updated, error: null };
          }
          
          return { data: null, error: new Error("Document not found") };
        } catch (error) {
          return { data: null, error };
        }
      },
      single: async () => {
        try {
          const { updateDocument, getDocument } = await import('./firestore');
          if (!values.id) {
            return { data: null, error: new Error("ID is required for single update") };
          }
          
          await updateDocument(table, values.id, values);
          const updated = await getDocument(table, values.id);
          return { data: updated, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
    delete: () => ({
      eq: (field: string, value: any) => ({
        single: async () => {
          try {
            const { queryDocuments, deleteDocument } = await import('./firestore');
            // Find document by field
            const documents = await queryDocuments(table, [
              { field, operator: "==" as WhereFilterOp, value }
            ]);
            
            if (documents && documents[0]) {
              const docId = documents[0].id;
              await deleteDocument(table, docId);
              return { data: { id: docId }, error: null };
            }
            
            return { data: null, error: new Error("Document not found") };
          } catch (error) {
            return { data: null, error };
          }
        },
      }),
      match: async (criteria: any) => {
        try {
          const { queryDocuments, deleteDocument } = await import('./firestore');
          // Find document by multiple criteria
          const conditions = Object.entries(criteria).map(([field, value]) => ({
            field, 
            operator: "==" as WhereFilterOp, 
            value
          }));
          
          const documents = await queryDocuments(table, conditions as any[]);
          
          if (documents && documents[0]) {
            const docId = documents[0].id;
            await deleteDocument(table, docId);
            return { data: { id: docId }, error: null };
          }
          
          return { data: null, error: new Error("Document not found") };
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
    upsert: (values: any) => ({
      single: async () => {
        try {
          const { getDocument, updateDocument, setDocument, createDocument } = await import('./firestore');
          if (values.id) {
            // Check if document exists
            const existing = await getDocument(table, values.id);
            if (existing) {
              await updateDocument(table, values.id, values);
            } else {
              await setDocument(table, values.id, values);
            }
            
            const document = await getDocument(table, values.id);
            return { data: document, error: null };
          } else {
            // No ID provided, create new document
            const newId = await createDocument(table, values);
            const document = await getDocument(table, newId);
            return { data: document, error: null };
          }
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        try {
          const result = await uploadFile(bucket, path, file);
          return { data: { path: result.path }, error: null };
        } catch (error) {
          return { data: { path: "" }, error };
        }
      },
      getPublicUrl: async (path: string) => {
        try {
          const url = await getFileDownloadURL(path);
          return { data: { publicUrl: url } };
        } catch (error) {
          return { data: { publicUrl: "" } };
        }
      }
    })
  },
  rpc: (func: string, params: any) => {
    // This would need to be replaced with Firebase Cloud Functions calls
    return { data: null, error: null };
  },
};

// Export for backward compatibility (will be removed in future)
export { firebaseClient as supabase };
