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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          input_snapshot: Json | null
          output_snapshot: Json | null
          related_entity_id: string | null
          related_entity_table: string | null
          started_at: string
          status: string
          trigger_source: string
          workflow_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input_snapshot?: Json | null
          output_snapshot?: Json | null
          related_entity_id?: string | null
          related_entity_table?: string | null
          started_at?: string
          status: string
          trigger_source: string
          workflow_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input_snapshot?: Json | null
          output_snapshot?: Json | null
          related_entity_id?: string | null
          related_entity_table?: string | null
          started_at?: string
          status?: string
          trigger_source?: string
          workflow_name?: string
        }
        Relationships: []
      }
      availability_windows: {
        Row: {
          collaborator_id: string
          created_at: string
          day_of_week: number
          effective_from: string | null
          effective_to: string | null
          end_time: string
          id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          day_of_week: number
          effective_from?: string | null
          effective_to?: string | null
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          day_of_week?: number
          effective_from?: string | null
          effective_to?: string | null
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_windows_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          collaborator_id: string
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_times_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_parameters: {
        Row: {
          active: boolean
          created_at: string
          field_type: string
          id: string
          label: string
          patient_id: string
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          field_type: string
          id?: string
          label: string
          patient_id: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          field_type?: string
          id?: string
          label?: string
          patient_id?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_parameters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          active: boolean
          contact_phone: string | null
          created_at: string
          default_payout_cents: number
          id: string
          name: string
          notes: string | null
          profession: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          contact_phone?: string | null
          created_at?: string
          default_payout_cents?: number
          id?: string
          name: string
          notes?: string | null
          profession?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          contact_phone?: string | null
          created_at?: string
          default_payout_cents?: number
          id?: string
          name?: string
          notes?: string | null
          profession?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string
          contact_phone: string
          created_at: string
          id: string
          last_message_at: string | null
          patient_id: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          channel?: string
          contact_phone: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          channel?: string
          contact_phone?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_rentals: {
        Row: {
          created_at: string
          created_by: string | null
          equipment_name: string
          id: string
          monthly_charge_cents: number
          patient_id: string
          period_end: string | null
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          equipment_name: string
          id?: string
          monthly_charge_cents: number
          patient_id: string
          period_end?: string | null
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          equipment_name?: string
          id?: string
          monthly_charge_cents?: number
          patient_id?: string
          period_end?: string | null
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_rentals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rentals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_adjustments: {
        Row: {
          amount_cents: number
          collaborator_id: string | null
          created_at: string
          created_by: string | null
          id: string
          patient_id: string | null
          reason: string
          visit_id: string | null
        }
        Insert: {
          amount_cents: number
          collaborator_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string | null
          reason: string
          visit_id?: string | null
        }
        Update: {
          amount_cents?: number
          collaborator_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string | null
          reason?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_adjustments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_adjustments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_adjustments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_shifts: {
        Row: {
          collaborator_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          shift_code_id: string | null
          source: string
          source_label: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          shift_code_id?: string | null
          source?: string
          source_label?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          shift_code_id?: string | null
          source?: string
          source_label?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_shifts_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_shifts_shift_code_id_fkey"
            columns: ["shift_code_id"]
            isOneToOne: false
            referencedRelation: "shift_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          name: string
          patient_charge_price_cents: number
          status: Database["public"]["Enums"]["supply_status"]
          stock_quantity: number | null
          track_stock: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_charge_price_cents?: number
          status?: Database["public"]["Enums"]["supply_status"]
          stock_quantity?: number | null
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_charge_price_cents?: number
          status?: Database["public"]["Enums"]["supply_status"]
          stock_quantity?: number | null
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      patient_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          assigned_by: string | null
          collaborator_id: string
          created_at: string
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          collaborator_id: string
          created_at?: string
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          collaborator_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          payment_method: string
          received_at: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["patient_payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          payment_method?: string
          received_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["patient_payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          payment_method?: string
          received_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["patient_payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_payout_rates: {
        Row: {
          active: boolean
          collaborator_id: string
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          payout_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          collaborator_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          payout_cents: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          collaborator_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          payout_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_payout_rates_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payout_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payout_rates_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          age: number | null
          clinical_summary: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          full_name: string
          id: string
          preferred_schedule: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
          visit_frequency: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          clinical_summary?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          full_name: string
          id?: string
          preferred_schedule?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
          visit_frequency?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          clinical_summary?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          full_name?: string
          id?: string
          preferred_schedule?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
          visit_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_lines: {
        Row: {
          amount_cents: number
          collaborator_id: string
          created_at: string
          id: string
          patient_id: string
          payout_period_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          visit_id: string
        }
        Insert: {
          amount_cents: number
          collaborator_id: string
          created_at?: string
          id?: string
          patient_id: string
          payout_period_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          visit_id: string
        }
        Update: {
          amount_cents?: number
          collaborator_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          payout_period_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_lines_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_lines_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_lines_payout_period_id_fkey"
            columns: ["payout_period_id"]
            isOneToOne: false
            referencedRelation: "payout_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_lines_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_periods: {
        Row: {
          collaborator_id: string
          created_at: string
          id: string
          paid_at: string | null
          paid_by: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payout_status"]
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount_cents?: number
          updated_at?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_periods_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_periods_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          email: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          email: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reschedule_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          requested_by: string
          requested_end: string | null
          requested_start: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["reschedule_request_status"]
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_by: string
          requested_end?: string | null
          requested_start?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["reschedule_request_status"]
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_by?: string
          requested_end?: string | null
          requested_start?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["reschedule_request_status"]
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_code_collaborators: {
        Row: {
          active: boolean
          collaborator_id: string
          created_at: string
          id: string
          shift_code_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          collaborator_id: string
          created_at?: string
          id?: string
          shift_code_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          collaborator_id?: string
          created_at?: string
          id?: string
          shift_code_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_code_collaborators_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_code_collaborators_shift_code_id_fkey"
            columns: ["shift_code_id"]
            isOneToOne: false
            referencedRelation: "shift_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_codes: {
        Row: {
          active: boolean
          applies_globally: boolean
          availability_behavior: Database["public"]["Enums"]["shift_availability_behavior"]
          code: string
          created_at: string
          created_by: string | null
          end_time: string
          hours: number
          id: string
          name: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          applies_globally?: boolean
          availability_behavior?: Database["public"]["Enums"]["shift_availability_behavior"]
          code: string
          created_at?: string
          created_by?: string | null
          end_time: string
          hours: number
          id?: string
          name: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          applies_globally?: boolean
          availability_behavior?: Database["public"]["Enums"]["shift_availability_behavior"]
          code?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          hours?: number
          id?: string
          name?: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_clinical_notes: {
        Row: {
          author_id: string
          created_at: string
          dictation_source: string | null
          evolution_text: string
          id: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          dictation_source?: string | null
          evolution_text: string
          id?: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          dictation_source?: string | null
          evolution_text?: string
          id?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_clinical_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_clinical_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_substitutions: {
        Row: {
          created_at: string
          id: string
          new_collaborator_id: string
          previous_collaborator_id: string
          reason: string | null
          substituted_at: string
          substituted_by: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_collaborator_id: string
          previous_collaborator_id: string
          reason?: string | null
          substituted_at?: string
          substituted_by?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_collaborator_id?: string
          previous_collaborator_id?: string
          reason?: string | null
          substituted_at?: string
          substituted_by?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_substitutions_new_collaborator_id_fkey"
            columns: ["new_collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_substitutions_previous_collaborator_id_fkey"
            columns: ["previous_collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_substitutions_substituted_by_fkey"
            columns: ["substituted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_substitutions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_supplies: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          quantity: number
          total_price_cents: number
          unit_price_snapshot_cents: number
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          quantity: number
          total_price_cents: number
          unit_price_snapshot_cents: number
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          quantity?: number
          total_price_cents?: number
          unit_price_snapshot_cents?: number
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_supplies_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_supplies_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          collaborator_id: string
          collaborator_payout_cents: number
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_charge_cents: number
          patient_id: string
          payout_rate_source: Database["public"]["Enums"]["payout_rate_source"]
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          collaborator_id: string
          collaborator_payout_cents?: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_charge_cents?: number
          patient_id: string
          payout_rate_source?: Database["public"]["Enums"]["payout_rate_source"]
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          collaborator_id?: string
          collaborator_payout_cents?: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_charge_cents?: number
          patient_id?: string
          payout_rate_source?: Database["public"]["Enums"]["payout_rate_source"]
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "collaborator"
      conversation_status:
        | "open"
        | "waiting_for_admin"
        | "resolved"
        | "archived"
      patient_payment_status: "unpaid" | "partially_paid" | "paid" | "overdue"
      patient_status:
        | "new"
        | "active"
        | "in_treatment"
        | "paused"
        | "medical_discharge"
        | "finalized"
      payout_rate_source:
        | "collaborator_default"
        | "patient_specific"
        | "manual_override"
      payout_status: "pending" | "ready" | "paid" | "adjusted"
      reschedule_request_status: "pending" | "approved" | "rejected"
      shift_availability_behavior: "unavailable" | "available" | "neutral"
      shift_type: "day" | "night" | "mixed" | "custom"
      supply_status: "active" | "inactive"
      visit_status:
        | "scheduled"
        | "confirmed"
        | "reschedule_requested"
        | "completed"
        | "pending_validation"
        | "approved_for_payment"
        | "rejected"
        | "canceled"
        | "rescheduled"
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
      app_role: ["admin", "collaborator"],
      conversation_status: [
        "open",
        "waiting_for_admin",
        "resolved",
        "archived",
      ],
      patient_payment_status: ["unpaid", "partially_paid", "paid", "overdue"],
      patient_status: [
        "new",
        "active",
        "in_treatment",
        "paused",
        "medical_discharge",
        "finalized",
      ],
      payout_rate_source: [
        "collaborator_default",
        "patient_specific",
        "manual_override",
      ],
      payout_status: ["pending", "ready", "paid", "adjusted"],
      reschedule_request_status: ["pending", "approved", "rejected"],
      shift_availability_behavior: ["unavailable", "available", "neutral"],
      shift_type: ["day", "night", "mixed", "custom"],
      supply_status: ["active", "inactive"],
      visit_status: [
        "scheduled",
        "confirmed",
        "reschedule_requested",
        "completed",
        "pending_validation",
        "approved_for_payment",
        "rejected",
        "canceled",
        "rescheduled",
      ],
    },
  },
} as const
