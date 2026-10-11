
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "allergens": {
                  Row: {
                    "code": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"label": string
                  }
                  Update: {
                    "code"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"app_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"diets": {
                  Row: {
                    "code": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"label": string
                  }
                  Update: {
                    "code"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"household_invitations": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"created_at": string,"created_by": string,"email": string,"expires_at": string,"household_id": string,"id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by": string,"email": string,"expires_at": string,"household_id": string,"id"?: string,"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string,"email"?: string,"expires_at"?: string,"household_id"?: string,"id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_invitations_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"household_members": {
                  Row: {
                    "household_id": string,"joined_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "household_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "household_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_members_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "created_at": string,"created_by": string | null,"currency": string,"id": string,"max_prep_minutes": number | null,"name": string,"people_count": number,"timezone": string,"updated_at": string,"weekly_budget_cents": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"max_prep_minutes"?: number | null,"name": string,"people_count"?: number,"timezone"?: string,"updated_at"?: string,"weekly_budget_cents"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"max_prep_minutes"?: number | null,"name"?: string,"people_count"?: number,"timezone"?: string,"updated_at"?: string,"weekly_budget_cents"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"ingredient_aliases": {
                  Row: {
                    "alias_normalized": string,"ingredient_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alias_normalized": string,"ingredient_id": string
                  }
                  Update: {
                    "alias_normalized"?: string,"ingredient_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredient_aliases_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredient_allergens": {
                  Row: {
                    "allergen_code": string,"ingredient_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allergen_code": string,"ingredient_id": string
                  }
                  Update: {
                    "allergen_code"?: string,"ingredient_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredient_allergens_allergen_code_fkey"
      columns: ["allergen_code"]
isOneToOne: false
      referencedRelation: "allergens"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "ingredient_allergens_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredient_diet_conflicts": {
                  Row: {
                    "diet_code": string,"ingredient_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "diet_code": string,"ingredient_id": string
                  }
                  Update: {
                    "diet_code"?: string,"ingredient_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredient_diet_conflicts_diet_code_fkey"
      columns: ["diet_code"]
isOneToOne: false
      referencedRelation: "diets"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "ingredient_diet_conflicts_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredients": {
                  Row: {
                    "category": string,"created_at": string,"default_dimension": Database["public"]['Enums']["dimension"],"default_shelf_life_days": number | null,"density_g_per_ml": number | null,"id": string,"is_validated": boolean,"name": string,"piece_weight_g": number | null,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"default_dimension": Database["public"]['Enums']["dimension"],"default_shelf_life_days"?: number | null,"density_g_per_ml"?: number | null,"id"?: string,"is_validated"?: boolean,"name": string,"piece_weight_g"?: number | null,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"default_dimension"?: Database["public"]['Enums']["dimension"],"default_shelf_life_days"?: number | null,"density_g_per_ml"?: number | null,"id"?: string,"is_validated"?: boolean,"name"?: string,"piece_weight_g"?: number | null,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active_household_id": string | null,"created_at": string,"display_name": string | null,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_household_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "active_household_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_active_household_id_fkey"
      columns: ["active_household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"units": {
                  Row: {
                    "code": string,"dimension": Database["public"]['Enums']["dimension"],"label": string,"sort_order": number,"to_base": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"dimension": Database["public"]['Enums']["dimension"],"label": string,"sort_order"?: number,"to_base": number
                  }
                  Update: {
                    "code"?: string,"dimension"?: Database["public"]['Enums']["dimension"],"label"?: string,"sort_order"?: number,"to_base"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_household_invitation":
{ Args: { "p_token": string }; Returns: string
                           },
"create_household_invitation":
{ Args: { "p_email": string,"p_household_id": string }; Returns: string
                           },
"is_app_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_household_member":
{ Args: { "hid": string }; Returns: boolean
                           },
"is_household_owner":
{ Args: { "hid": string }; Returns: boolean
                           },
"my_household_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"normalize_alias":
{ Args: { "input": string }; Returns: string
                           },
"resolve_ingredient":
{ Args: { "p_label": string }; Returns: string
                           }
          }
          Enums: {
            "dimension": "mass"|"volume"|"count","expiry_kind": "use_by"|"best_before","item_status": "active"|"depleted"|"discarded","list_status": "draft"|"active"|"completed"|"archived","meal_slot": "breakfast"|"lunch"|"dinner","meal_status": "planned"|"cooked"|"skipped","member_role": "owner"|"member","movement_kind": "initial"|"purchase"|"consumption"|"cooking"|"correction"|"loss"|"leftover","price_kind": "estimated"|"paid","recipe_source": "curated"|"ai"|"user","recipe_status": "draft"|"published"|"rejected","storage_loc": "pantry"|"fridge"|"freezer"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "dimension": ["mass", "volume", "count"],"expiry_kind": ["use_by", "best_before"],"item_status": ["active", "depleted", "discarded"],"list_status": ["draft", "active", "completed", "archived"],"meal_slot": ["breakfast", "lunch", "dinner"],"meal_status": ["planned", "cooked", "skipped"],"member_role": ["owner", "member"],"movement_kind": ["initial", "purchase", "consumption", "cooking", "correction", "loss", "leftover"],"price_kind": ["estimated", "paid"],"recipe_source": ["curated", "ai", "user"],"recipe_status": ["draft", "published", "rejected"],"storage_loc": ["pantry", "fridge", "freezer"]
          }
        }
} as const
