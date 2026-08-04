export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          market: string
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          market: string
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          market?: string
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      behaviour_journal_entries: {
        Row: {
          created_at: string
          entry_date: string
          felt_calm_before_trading: boolean
          felt_pressure_to_make_money: boolean
          followed_plan: boolean
          id: string
          net_positive: boolean | null
          notes: string | null
          overtraded: boolean
          respected_stop: boolean
          revenge_traded: boolean
          slept_well: boolean
          traded_after_a_loss: boolean
          traded_during_news: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          felt_calm_before_trading: boolean
          felt_pressure_to_make_money: boolean
          followed_plan: boolean
          id?: string
          net_positive?: boolean | null
          notes?: string | null
          overtraded: boolean
          respected_stop: boolean
          revenge_traded: boolean
          slept_well: boolean
          traded_after_a_loss: boolean
          traded_during_news: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          felt_calm_before_trading?: boolean
          felt_pressure_to_make_money?: boolean
          followed_plan?: boolean
          id?: string
          net_positive?: boolean | null
          notes?: string | null
          overtraded?: boolean
          respected_stop?: boolean
          revenge_traded?: boolean
          slept_well?: boolean
          traded_after_a_loss?: boolean
          traded_during_news?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behaviour_journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      market_briefs: {
        Row: {
          asset_id: string
          created_at: string
          date: string
          decision_summary: string
          id: string
          invalidation: string
          is_published: boolean
          long_case: string
          macro_backdrop: string
          market_conviction_score: number
          overall_bias: Database["public"]["Enums"]["market_bias"]
          price_behaviour: string
          risk_events: string[]
          sentiment_backdrop: string
          short_case: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          date: string
          decision_summary: string
          id?: string
          invalidation: string
          is_published?: boolean
          long_case: string
          macro_backdrop: string
          market_conviction_score?: number
          overall_bias: Database["public"]["Enums"]["market_bias"]
          price_behaviour: string
          risk_events?: string[]
          sentiment_backdrop: string
          short_case: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          date?: string
          decision_summary?: string
          id?: string
          invalidation?: string
          is_published?: boolean
          long_case?: string
          macro_backdrop?: string
          market_conviction_score?: number
          overall_bias?: Database["public"]["Enums"]["market_bias"]
          price_behaviour?: string
          risk_events?: string[]
          sentiment_backdrop?: string
          short_case?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_briefs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_briefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_trade_checklists: {
        Row: {
          asset_id: string
          created_at: string
          direction: Database["public"]["Enums"]["trade_direction"]
          economic_calendar_checked: boolean
          emotional_state_acceptable: boolean
          has_clear_invalidation: boolean
          id: string
          market_conditions_aligned: boolean
          notes: string | null
          reason_for_trade: string
          recommendation: Database["public"]["Enums"]["checklist_recommendation"]
          recommendation_reason: string
          risk_percent: number
          risk_reward_acceptable: boolean
          setup_type: string
          submitted_at: string
          trade_matches_plan: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["trade_direction"]
          economic_calendar_checked: boolean
          emotional_state_acceptable: boolean
          has_clear_invalidation?: boolean
          id?: string
          market_conditions_aligned: boolean
          notes?: string | null
          reason_for_trade: string
          recommendation: Database["public"]["Enums"]["checklist_recommendation"]
          recommendation_reason: string
          risk_percent: number
          risk_reward_acceptable?: boolean
          setup_type: string
          submitted_at?: string
          trade_matches_plan: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["trade_direction"]
          economic_calendar_checked?: boolean
          emotional_state_acceptable?: boolean
          has_clear_invalidation?: boolean
          id?: string
          market_conditions_aligned?: boolean
          notes?: string | null
          reason_for_trade?: string
          recommendation?: Database["public"]["Enums"]["checklist_recommendation"]
          recommendation_reason?: string
          risk_percent?: number
          risk_reward_acceptable?: boolean
          setup_type?: string
          submitted_at?: string
          trade_matches_plan?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_trade_checklists_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_trade_checklists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          after_screenshot_path: string | null
          asset_id: string
          before_analysis: string | null
          before_screenshot_path: string | null
          checklist_id: string | null
          closed_at: string | null
          closing_commentary: string | null
          created_at: string
          currency: string
          date: string
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price: number | null
          entry_reason: string | null
          exit_price: number | null
          followed_plan: boolean
          id: string
          mistake_type: string | null
          notes: string | null
          opened_at: string | null
          pnl: number | null
          realised_r_multiple: number | null
          respected_stop: boolean
          result: Database["public"]["Enums"]["trade_outcome"] | null
          result_conclusion: string | null
          review_notes: string | null
          risk_amount: number | null
          risk_percent: number | null
          setup_type: string | null
          status: Database["public"]["Enums"]["trade_status"]
          stop_loss: number | null
          take_profit: number | null
          target_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          after_screenshot_path?: string | null
          asset_id: string
          before_analysis?: string | null
          before_screenshot_path?: string | null
          checklist_id?: string | null
          closed_at?: string | null
          closing_commentary?: string | null
          created_at?: string
          currency?: string
          date?: string
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price?: number | null
          entry_reason?: string | null
          exit_price?: number | null
          followed_plan?: boolean
          id?: string
          mistake_type?: string | null
          notes?: string | null
          opened_at?: string | null
          pnl?: number | null
          realised_r_multiple?: number | null
          respected_stop?: boolean
          result?: Database["public"]["Enums"]["trade_outcome"] | null
          result_conclusion?: string | null
          review_notes?: string | null
          risk_amount?: number | null
          risk_percent?: number | null
          setup_type?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          stop_loss?: number | null
          take_profit?: number | null
          target_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          after_screenshot_path?: string | null
          asset_id?: string
          before_analysis?: string | null
          before_screenshot_path?: string | null
          checklist_id?: string | null
          closed_at?: string | null
          closing_commentary?: string | null
          created_at?: string
          currency?: string
          date?: string
          direction?: Database["public"]["Enums"]["trade_direction"]
          entry_price?: number | null
          entry_reason?: string | null
          exit_price?: number | null
          followed_plan?: boolean
          id?: string
          mistake_type?: string | null
          notes?: string | null
          opened_at?: string | null
          pnl?: number | null
          realised_r_multiple?: number | null
          respected_stop?: boolean
          result?: Database["public"]["Enums"]["trade_outcome"] | null
          result_conclusion?: string | null
          review_notes?: string | null
          risk_amount?: number | null
          risk_percent?: number | null
          setup_type?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          stop_loss?: number | null
          take_profit?: number | null
          target_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "pre_trade_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_insights: {
        Row: {
          checklist_compliance_rate: number | null
          correlations: Json
          created_at: string
          generated_at: string
          id: string
          negative_patterns: string[]
          net_pnl: number | null
          net_r_multiple: number | null
          positive_patterns: string[]
          recommendations: string[]
          summary: string
          top_behaviour_risks: string[]
          trades_taken: number
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
          win_rate: number | null
        }
        Insert: {
          checklist_compliance_rate?: number | null
          correlations?: Json
          created_at?: string
          generated_at?: string
          id?: string
          negative_patterns?: string[]
          net_pnl?: number | null
          net_r_multiple?: number | null
          positive_patterns?: string[]
          recommendations?: string[]
          summary: string
          top_behaviour_risks?: string[]
          trades_taken?: number
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
          win_rate?: number | null
        }
        Update: {
          checklist_compliance_rate?: number | null
          correlations?: Json
          created_at?: string
          generated_at?: string
          id?: string
          negative_patterns?: string[]
          net_pnl?: number | null
          net_r_multiple?: number | null
          positive_patterns?: string[]
          recommendations?: string[]
          summary?: string
          top_behaviour_risks?: string[]
          trades_taken?: number
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      checklist_recommendation: "proceed" | "wait" | "reduce_size" | "avoid"
      market_bias: "bullish" | "bearish" | "neutral" | "mixed"
      trade_direction: "long" | "short"
      trade_outcome: "win" | "loss" | "breakeven"
      trade_status: "planned" | "open" | "closed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      checklist_recommendation: ["proceed", "wait", "reduce_size", "avoid"],
      market_bias: ["bullish", "bearish", "neutral", "mixed"],
      trade_direction: ["long", "short"],
      trade_outcome: ["win", "loss", "breakeven"],
      trade_status: ["planned", "open", "closed", "cancelled"],
    },
  },
} as const
