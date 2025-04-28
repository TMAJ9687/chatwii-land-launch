import { 
  collection, getDocs, query, WhereFilterOp
} from 'firebase/firestore';
import { db } from './client';
import { uploadFile, getFileDownloadURL } from './storage';
import { auth } from './client';

export const firebaseClient = {
  auth: {
    async signInWithPassword({ email, password }: { email: string, password: string }) {
      try {
        const { signInWithEmail } = await import('./auth');
        const user = await signInWithEmail(email, password);
        return { data: { user }, error: null };
      } catch (error) {
        return { data: {}, error };
      }
    },
    async signUp({ email, password }: { email: string, password: string }) {
      try {
        const { signUpWithEmail } = await import('./auth');
        const user = await signUpWithEmail(email, password);
        return { data: { user }, error: null };
      } catch (error) {
        return { data: {}, error };
      }
    },
    async signOut() {
      try {
        const { signOutUser } = await import('./auth');
        await signOutUser();
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    async getSession() {
      const currentUser = auth.currentUser;
      if (!currentUser) return { data: { session: null } };
      return { data: { session: { user: currentUser } } };
    },
    async getUser() {
      const currentUser = auth.currentUser;
      if (!currentUser) return { data: { user: null } };
      return { data: { user: currentUser } };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        callback('SIGNED_IN', { user });
      });
      return { data: { subscription: { unsubscribe } } };
    },
    async updateUser(data: any) {
      // Placeholder for updating user in Firebase Auth
      return { data: {}, error: null };
    }
  },
  from(table: string) {
    // Firestore query helpers
    const runQuery = async (filters: any[] = [], sort?: string, order: 'asc' | 'desc' = 'asc', limitCount?: number) => {
      const { queryDocuments } = await import('./firestore');
      return queryDocuments(table, filters, sort, order, limitCount);
    };

    return {
      select(columns?: string) {
        return {
          eq(field: string, value: any) {
            return {
              async single() {
                const documents = await runQuery([{ field, operator: "==" as WhereFilterOp, value }]);
                return { data: documents[0] || null, error: null };
              },
              async maybeSingle() {
                const documents = await runQuery([{ field, operator: "==" as WhereFilterOp, value }]);
                return { data: documents[0] || null, error: null };
              },
              async range(from: number, to: number) {
                const documents = await runQuery([{ field, operator: "==" as WhereFilterOp, value }]);
                return { data: documents.slice(from, to + 1), error: null };
              },
              order(column: string, options?: { ascending?: boolean }) {
                return {
                  limit(count: number) {
                    return {
                      async range(from: number, to: number) {
                        const orderVal = options?.ascending ? "asc" : "desc";
                        const documents = await runQuery([{ field, operator: "==" as WhereFilterOp, value }], column, orderVal, count);
                        return { data: documents.slice(from, to + 1), error: null };
                      }
                    }
                  }
                }
              }
            }
          },
          order(column: string, options?: { ascending?: boolean }) {
            return {
              async range(from: number, to: number) {
                const orderVal = options?.ascending ? "asc" : "desc";
                const documents = await runQuery([], column, orderVal);
                return { data: documents.slice(from, to + 1), error: null };
              },
              limit(count: number) {
                return {
                  async range(from: number, to: number) {
                    const orderVal = options?.ascending ? "asc" : "desc";
                    const documents = await runQuery([], column, orderVal, count);
                    return { data: documents.slice(from, to + 1), error: null };
                  }
                }
              }
            }
          },
          in(field: string, values: any[]) {
            return {
              async range(from: number, to: number) {
                const documents = await runQuery([{ field, operator: "in" as WhereFilterOp, value: values }]);
                return { data: documents.slice(from, to + 1), error: null };
              }
            }
          },
          async range(from: number, to: number) {
            const collectionRef = collection(db, table);
            const q = query(collectionRef);
            const snapshot = await getDocs(q);
            const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { data: documents.slice(from, to + 1), error: null };
          }
        }
      },
      insert(values: any, options?: any) {
        const upsertHelper = async () => {
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
        };
        return {
          select(columns: string) {
            return { single: upsertHelper };
          },
          single: upsertHelper
        }
      },
      update(values: any) {
        return {
          eq(field: string, value: any) {
            return {
              async single() {
                const { queryDocuments, updateDocument, getDocument } = await import('./firestore');
                const documents = await queryDocuments(table, [{ field, operator: "==" as WhereFilterOp, value }]);
                if (documents && documents[0]) {
                  const docId = documents[0].id;
                  await updateDocument(table, docId, values);
                  const updated = await getDocument(table, docId);
                  return { data: updated, error: null };
                }
                return { data: null, error: new Error("Document not found") };
              }
            }
          },
          async match(criteria: any) {
            const { queryDocuments, updateDocument, getDocument } = await import('./firestore');
            const conditions = Object.entries(criteria).map(([field, value]) => ({
              field, operator: "==" as WhereFilterOp, value
            }));
            const documents = await queryDocuments(table, conditions as any[]);
            if (documents && documents[0]) {
              const docId = documents[0].id;
              await updateDocument(table, docId, values);
              const updated = await getDocument(table, docId);
              return { data: updated, error: null };
            }
            return { data: null, error: new Error("Document not found") };
          },
          async single() {
            const { updateDocument, getDocument } = await import('./firestore');
            if (!values.id) {
              return { data: null, error: new Error("ID is required for single update") };
            }
            await updateDocument(table, values.id, values);
            const updated = await getDocument(table, values.id);
            return { data: updated, error: null };
          }
        }
      },
      delete() {
        return {
          eq(field: string, value: any) {
            return {
              async single() {
                const { queryDocuments, deleteDocument } = await import('./firestore');
                const documents = await queryDocuments(table, [{ field, operator: "==" as WhereFilterOp, value }]);
                if (documents && documents[0]) {
                  const docId = documents[0].id;
                  await deleteDocument(table, docId);
                  return { data: { id: docId }, error: null };
                }
                return { data: null, error: new Error("Document not found") };
              }
            }
          },
          async match(criteria: any) {
            const { queryDocuments, deleteDocument } = await import('./firestore');
            const conditions = Object.entries(criteria).map(([field, value]) => ({
              field, operator: "==" as WhereFilterOp, value
            }));
            const documents = await queryDocuments(table, conditions as any[]);
            if (documents && documents[0]) {
              const docId = documents[0].id;
              await deleteDocument(table, docId);
              return { data: { id: docId }, error: null };
            }
            return { data: null, error: new Error("Document not found") };
          }
        }
      },
      upsert(values: any) {
        return {
          async single() {
            const { getDocument, updateDocument, setDocument, createDocument } = await import('./firestore');
            if (values.id) {
              const existing = await getDocument(table, values.id);
              if (existing) {
                await updateDocument(table, values.id, values);
              } else {
                await setDocument(table, values.id, values);
              }
              const document = await getDocument(table, values.id);
              return { data: document, error: null };
            } else {
              const newId = await createDocument(table, values);
              const document = await getDocument(table, newId);
              return { data: document, error: null };
            }
          }
        }
      }
    }
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: any) {
          try {
            const result = await uploadFile(bucket, path, file);
            return { data: { path: result.path }, error: null };
          } catch (error) {
            return { data: { path: "" }, error };
          }
        },
        async getPublicUrl(path: string) {
          try {
            const url = await getFileDownloadURL(path);
            return { data: { publicUrl: url } };
          } catch (error) {
            return { data: { publicUrl: "" } };
          }
        }
      }
    }
  },
  rpc(func: string, params: any) {
    // Placeholder for custom Firebase Cloud Functions
    return { data: null, error: null };
  }
};

// Export for backward compatibility (will be removed in future)
export { firebaseClient as supabase };
