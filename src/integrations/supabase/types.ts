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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string
          detail: Json
          id: string
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: string
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apex_exports: {
        Row: {
          created_at: string
          duration_seconds: number | null
          format: string
          id: string
          job_id: string | null
          owner_id: string
          project_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          format?: string
          id?: string
          job_id?: string | null
          owner_id: string
          project_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          format?: string
          id?: string
          job_id?: string | null
          owner_id?: string
          project_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "apex_exports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "apex_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apex_exports_project_id_owner_id_fkey"
            columns: ["project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "apex_projects"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      apex_jobs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          job_type: string
          owner_id: string
          progress: number
          project_id: string
          request: Json
          result: Json
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          owner_id: string
          progress?: number
          project_id: string
          request?: Json
          result?: Json
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          owner_id?: string
          progress?: number
          project_id?: string
          request?: Json
          result?: Json
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "apex_jobs_project_id_owner_id_fkey"
            columns: ["project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "apex_projects"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      apex_media: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          media_type: string
          mime_type: string | null
          original_name: string
          owner_id: string
          project_id: string
          rights_confirmed: boolean
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type: string
          mime_type?: string | null
          original_name: string
          owner_id?: string
          project_id: string
          rights_confirmed?: boolean
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          original_name?: string
          owner_id?: string
          project_id?: string
          rights_confirmed?: boolean
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "apex_media_project_id_owner_id_fkey"
            columns: ["project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "apex_projects"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      apex_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apex_projects: {
        Row: {
          aspect_ratio: string
          created_at: string
          description: string | null
          id: string
          owner_id: string
          target_language: string
          title: string
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          target_language?: string
          title: string
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          target_language?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      apex_scenes: {
        Row: {
          created_at: string
          end_seconds: number
          id: string
          media_id: string
          owner_id: string
          project_id: string
          start_seconds: number
          summary: string | null
          transcript: string | null
          visual_tags: Json
        }
        Insert: {
          created_at?: string
          end_seconds: number
          id?: string
          media_id: string
          owner_id: string
          project_id: string
          start_seconds: number
          summary?: string | null
          transcript?: string | null
          visual_tags?: Json
        }
        Update: {
          created_at?: string
          end_seconds?: number
          id?: string
          media_id?: string
          owner_id?: string
          project_id?: string
          start_seconds?: number
          summary?: string | null
          transcript?: string | null
          visual_tags?: Json
        }
        Relationships: [
          {
            foreignKeyName: "apex_scenes_media_id_project_id_owner_id_fkey"
            columns: ["media_id", "project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "apex_media"
            referencedColumns: ["id", "project_id", "owner_id"]
          },
          {
            foreignKeyName: "apex_scenes_project_id_owner_id_fkey"
            columns: ["project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "apex_projects"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      apex_scripts: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          language: string
          narration: string
          owner_id: string
          project_id: string
          timeline: Json
          title: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          language?: string
          narration?: string
          owner_id?: string
          project_id: string
          timeline?: Json
          title: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          language?: string
          narration?: string
          owner_id?: string
          project_id?: string
          timeline?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apex_scripts_project_id_owner_id_fkey"
            columns: ["project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "apex_projects"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      approvals: {
        Row: {
          action: string
          choices: Json
          cost: string | null
          created_at: string
          data: string
          decided_at: string | null
          decision: string | null
          evidence: Json
          expires_at: string
          id: string
          impact: string
          next_step: string
          recommendation: string
          status: string
          target: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          choices?: Json
          cost?: string | null
          created_at?: string
          data?: string
          decided_at?: string | null
          decision?: string | null
          evidence?: Json
          expires_at: string
          id?: string
          impact: string
          next_step?: string
          recommendation?: string
          status?: string
          target: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          choices?: Json
          cost?: string | null
          created_at?: string
          data?: string
          decided_at?: string | null
          decision?: string | null
          evidence?: Json
          expires_at?: string
          id?: string
          impact?: string
          next_step?: string
          recommendation?: string
          status?: string
          target?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          accuracy_m: number | null
          created_at: string
          id: string
          last_seen_at: string
          latitude: number | null
          location_at: string | null
          longitude: number | null
          name: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string
          id: string
          last_seen_at?: string
          latitude?: number | null
          location_at?: string | null
          longitude?: number | null
          name?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string
          id?: string
          last_seen_at?: string
          latitude?: number | null
          location_at?: string | null
          longitude?: number | null
          name?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      home_alerts: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      home_events: {
        Row: {
          capture_path: string | null
          confidence: number
          created_at: string
          id: string
          occurred_at: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capture_path?: string | null
          confidence: number
          created_at?: string
          id?: string
          occurred_at?: string
          session_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          capture_path?: string | null
          confidence?: number
          created_at?: string
          id?: string
          occurred_at?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "home_monitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      home_monitor_sessions: {
        Row: {
          capture_enabled: boolean
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capture_enabled?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          capture_enabled?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          budget_max: number
          budget_min: number
          created_at: string
          currency: string
          history: Json
          horizon: string
          id: string
          progress: number
          region: string
          skills: string[]
          status: string
          success_criteria: string
          theme: string
          title: string
          updated_at: string
          user_id: string
          weights: Json
        }
        Insert: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          currency?: string
          history?: Json
          horizon?: string
          id?: string
          progress?: number
          region: string
          skills?: string[]
          status?: string
          success_criteria?: string
          theme: string
          title: string
          updated_at?: string
          user_id?: string
          weights: Json
        }
        Update: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          currency?: string
          history?: Json
          horizon?: string
          id?: string
          progress?: number
          region?: string
          skills?: string[]
          status?: string
          success_criteria?: string
          theme?: string
          title?: string
          updated_at?: string
          user_id?: string
          weights?: Json
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          canonical_key: string
          confidence: number
          created_at: string
          criteria: Json
          facts: Json
          hypotheses: Json
          id: string
          inferences: Json
          missing_data: Json
          mission_id: string
          next_experiment: string
          projections: Json
          risks: Json
          sources: Json
          stable_id: string | null
          summary: string
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          canonical_key: string
          confidence?: number
          created_at?: string
          criteria?: Json
          facts?: Json
          hypotheses?: Json
          id?: string
          inferences?: Json
          missing_data?: Json
          mission_id: string
          next_experiment?: string
          projections?: Json
          risks?: Json
          sources?: Json
          stable_id?: string | null
          summary?: string
          title: string
          updated_at?: string
          url?: string
          user_id: string
        }
        Update: {
          canonical_key?: string
          confidence?: number
          created_at?: string
          criteria?: Json
          facts?: Json
          hypotheses?: Json
          id?: string
          inferences?: Json
          missing_data?: Json
          mission_id?: string
          next_experiment?: string
          projections?: Json
          risks?: Json
          sources?: Json
          stable_id?: string | null
          summary?: string
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          capture_consent: boolean
          cooldown_s: number
          created_at: string
          display_name: string
          notifications_internal: boolean
          notifications_push: boolean
          retention_days: number
          sensitivity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          capture_consent?: boolean
          cooldown_s?: number
          created_at?: string
          display_name?: string
          notifications_internal?: boolean
          notifications_push?: boolean
          retention_days?: number
          sensitivity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          capture_consent?: boolean
          cooldown_s?: number
          created_at?: string
          display_name?: string
          notifications_internal?: boolean
          notifications_push?: boolean
          retention_days?: number
          sensitivity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approval_decide: {
        Args: { _approval_id: string; _choice?: string; _decision: string }
        Returns: {
          action: string
          choices: Json
          cost: string | null
          created_at: string
          data: string
          decided_at: string | null
          decision: string | null
          evidence: Json
          expires_at: string
          id: string
          impact: string
          next_step: string
          recommendation: string
          status: string
          target: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "approvals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mcp_audit: { Args: { _detail: Json; _kind: string }; Returns: undefined }
      mission_transition: {
        Args: { _action: string; _mission_id: string }
        Returns: {
          budget_max: number
          budget_min: number
          created_at: string
          currency: string
          history: Json
          horizon: string
          id: string
          progress: number
          region: string
          skills: string[]
          status: string
          success_criteria: string
          theme: string
          title: string
          updated_at: string
          user_id: string
          weights: Json
        }
        SetofOptions: {
          from: "*"
          to: "missions"
          isOneToOne: true
          isSetofReturn: false
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
