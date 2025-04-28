
// This is a mock implementation to replace Supabase

export const supabase = {
  auth: {
    signInWithPassword: async () => ({ data: {}, error: null }),
    signUp: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    updateUser: async () => ({ error: null })
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (field: string, value: any) => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        order: (column: string, options?: { ascending?: boolean }) => ({
          limit: (count: number) => ({
            range: async (from: number, to: number) => ({ data: [], error: null }),
          }),
        }),
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        range: async (from: number, to: number) => ({ data: [], error: null }),
        limit: async (count: number) => ({ data: [], error: null }),
      }),
      in: (field: string, values: any[]) => ({
        range: async (from: number, to: number) => ({ data: [], error: null }),
      }),
      range: async (from: number, to: number) => ({ data: [], error: null }),
    }),
    insert: async (values: any, options?: any) => ({ error: null }),
    update: (values: any) => ({
      eq: async (field: string, value: any) => ({ error: null }),
      match: async (criteria: any) => ({ error: null }),
    }),
    delete: () => ({
      eq: async (field: string, value: any) => ({ error: null }),
      match: async (criteria: any) => ({ error: null }),
    }),
    upsert: async (values: any) => ({ error: null }),
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ data: { path: "" }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: "" } }),
    }),
  },
  rpc: (func: string, params: any) => ({ data: null, error: null }),
};
