
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
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        order: () => ({
          limit: () => ({
            range: async () => ({ data: [], error: null }),
          }),
        }),
      }),
      order: () => ({
        range: async () => ({ data: [], error: null }),
        limit: async () => ({ data: [], error: null }),
      }),
      in: () => ({
        range: async () => ({ data: [], error: null }),
      }),
      range: async () => ({ data: [], error: null }),
    }),
    insert: async () => ({ error: null }),
    update: async () => ({ error: null }),
    delete: async () => ({ error: null }),
    upsert: async () => ({ error: null }),
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: { path: "" }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
  rpc: (func: string, params: any) => ({ data: null, error: null }),
};
