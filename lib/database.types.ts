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
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          payload: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          banned: boolean
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          id_number: string
          id_type: Database["public"]["Enums"]["id_type"]
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          banned?: boolean
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          id_number: string
          id_type: Database["public"]["Enums"]["id_type"]
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          banned?: boolean
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          id_number?: string
          id_type?: Database["public"]["Enums"]["id_type"]
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      intakes: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          processor_id: string
          status: Database["public"]["Enums"]["intake_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          processor_id: string
          status?: Database["public"]["Enums"]["intake_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          processor_id?: string
          status?: Database["public"]["Enums"]["intake_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intakes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intakes_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      item_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          item_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          item_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          item_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      items: {
        Row: {
          brand: string | null
          category: string | null
          condition: string | null
          created_at: string
          description: string | null
          hold_expires_at: string | null
          id: string
          intake_id: string
          model: string | null
          purchase_price: number | null
          serial_number: string | null
          shopify_product_id: string | null
          status: Database["public"]["Enums"]["item_status"]
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          hold_expires_at?: string | null
          id?: string
          intake_id: string
          model?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          shopify_product_id?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          hold_expires_at?: string | null
          id?: string
          intake_id?: string
          model?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          shopify_product_id?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          store_location_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          store_location_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          store_location_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      id_type: "driver_license" | "passport" | "state_id" | "matricula_consular" | "other"
      intake_status: "draft" | "completed" | "canceled"
      item_status:
        | "intake_started"
        | "intake_completed"
        | "on_hold"
        | "cleared_for_resale"
        | "published"
        | "sold"
        | "flagged"
      user_role: "clerk" | "manager" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
