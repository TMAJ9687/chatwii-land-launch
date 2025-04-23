export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bans: {
        Row: {
          admin_id: string | null
          created_at: string
          expires_at: string | null
          id: number
          reason: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bans_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_config: {
        Row: {
          bot_user_id: string
          persona: string | null
          predefined_responses: Json | null
        }
        Insert: {
          bot_user_id: string
          persona?: string | null
          predefined_responses?: Json | null
        }
        Update: {
          bot_user_id?: string
          persona?: string | null
          predefined_responses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_config_bot_user_id_fkey"
            columns: ["bot_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_photo_uploads: {
        Row: {
          last_upload_date: string
          upload_count: number
          user_id: string
        }
        Insert: {
          last_upload_date?: string
          upload_count?: number
          user_id: string
        }
        Update: {
          last_upload_date?: string
          upload_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_photo_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          rating: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      message_media: {
        Row: {
          created_at: string
          file_url: string
          id: number
          media_type: string
          message_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: number
          media_type: string
          message_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: number
          media_type?: string
          message_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_media_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: number
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          gender: string | null
          id: string
          ip_country: string | null
          nickname: string
          profile_theme: string | null
          role: string
          updated_at: string
          vip_status: boolean | null
          visibility: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          gender?: string | null
          id: string
          ip_country?: string | null
          nickname: string
          profile_theme?: string | null
          role?: string
          updated_at?: string
          vip_status?: boolean | null
          visibility?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          gender?: string | null
          id?: string
          ip_country?: string | null
          nickname?: string
          profile_theme?: string | null
          role?: string
          updated_at?: string
          vip_status?: boolean | null
          visibility?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: number
          reason: string | null
          reported_id: string
          reporter_id: string
          resolved_at: string | null
          status: string | null
          suggest_ban: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          reason?: string | null
          reported_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string | null
          suggest_ban?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          reason?: string | null
          reported_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string | null
          suggest_ban?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: number
          settings: Json | null
        }
        Insert: {
          id?: number
          settings?: Json | null
        }
        Update: {
          id?: number
          settings?: Json | null
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          interest_id: number
          user_id: string
        }
        Insert: {
          interest_id: number
          user_id: string
        }
        Update: {
          interest_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: number
          is_active: boolean | null
          payment_intent_id: string | null
          payment_provider: string | null
          start_date: string
          subscription_plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: number
          is_active?: boolean | null
          payment_intent_id?: string | null
          payment_provider?: string | null
          start_date?: string
          subscription_plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          is_active?: boolean | null
          payment_intent_id?: string | null
          payment_provider?: string | null
          start_date?: string
          subscription_plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_message_user: {
        Args: { sender_id: string; receiver_id: string }
        Returns: boolean
      }
      is_nickname_available: {
        Args: { check_nickname: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
