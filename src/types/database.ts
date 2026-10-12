
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ai_generations": {
                  Row: {
                    "created_at": string,"household_id": string,"id": string,"model": string,"request_payload": NonNullable<Json>,"requested_by": string | null,"response_payload": Json | null,"validation_errors": NonNullable<Json>,"validation_status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"household_id": string,"id"?: string,"model": string,"request_payload": NonNullable<Json>,"requested_by"?: string | null,"response_payload"?: Json | null,"validation_errors"?: NonNullable<Json>,"validation_status": string
                  }
                  Update: {
                    "created_at"?: string,"household_id"?: string,"id"?: string,"model"?: string,"request_payload"?: NonNullable<Json>,"requested_by"?: string | null,"response_payload"?: Json | null,"validation_errors"?: NonNullable<Json>,"validation_status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_generations_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"allergens": {
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
                },"app_errors": {
                  Row: {
                    "digest": string | null,"id": number,"kind": string,"message": string,"occurred_at": string,"path": string | null,"release": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "digest"?: string | null,"id"?: never,"kind": string,"message": string,"occurred_at"?: string,"path"?: string | null,"release"?: string | null
                  }
                  Update: {
                    "digest"?: string | null,"id"?: never,"kind"?: string,"message"?: string,"occurred_at"?: string,"path"?: string | null,"release"?: string | null
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
                },"equipment": {
                  Row: {
                    "code": string,"label": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"label": string,"position": number
                  }
                  Update: {
                    "code"?: string,"label"?: string,"position"?: number
                  }
                  Relationships: [
                    
                  ]
                },"household_diets": {
                  Row: {
                    "created_at": string,"diet_code": string,"household_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"diet_code": string,"household_id": string
                  }
                  Update: {
                    "created_at"?: string,"diet_code"?: string,"household_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_diets_diet_code_fkey"
      columns: ["diet_code"]
isOneToOne: false
      referencedRelation: "diets"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "household_diets_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"household_exclusions": {
                  Row: {
                    "allergen_code": string | null,"created_at": string,"household_id": string,"id": string,"ingredient_id": string | null,"is_allergy": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "allergen_code"?: string | null,"created_at"?: string,"household_id": string,"id"?: string,"ingredient_id"?: string | null,"is_allergy": boolean
                  }
                  Update: {
                    "allergen_code"?: string | null,"created_at"?: string,"household_id"?: string,"id"?: string,"ingredient_id"?: string | null,"is_allergy"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_exclusions_allergen_code_fkey"
      columns: ["allergen_code"]
isOneToOne: false
      referencedRelation: "allergens"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "household_exclusions_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "household_exclusions_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"household_food_profile": {
                  Row: {
                    "eating_style": string,"equipment": (string)[] | null,"household_id": string,"objectives": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "eating_style"?: string,"equipment"?: (string)[] | null,"household_id": string,"objectives"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "eating_style"?: string,"equipment"?: (string)[] | null,"household_id"?: string,"objectives"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_food_profile_household_id_fkey"
      columns: ["household_id"]
isOneToOne: true
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
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
                },"household_prices": {
                  Row: {
                    "cents_per_ref": number,"created_at": string,"created_by": string | null,"dimension": Database["public"]['Enums']["dimension"],"household_id": string,"ingredient_id": string,"observed_on": string,"source_url": string | null,"store_label": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cents_per_ref": number,"created_at"?: string,"created_by"?: string | null,"dimension": Database["public"]['Enums']["dimension"],"household_id": string,"ingredient_id": string,"observed_on"?: string,"source_url"?: string | null,"store_label"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "cents_per_ref"?: number,"created_at"?: string,"created_by"?: string | null,"dimension"?: Database["public"]['Enums']["dimension"],"household_id"?: string,"ingredient_id"?: string,"observed_on"?: string,"source_url"?: string | null,"store_label"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_prices_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "household_prices_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"household_staples": {
                  Row: {
                    "created_at": string,"created_by": string | null,"household_id": string,"ingredient_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"household_id": string,"ingredient_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"household_id"?: string,"ingredient_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_staples_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "household_staples_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "created_at": string,"created_by": string | null,"currency": string,"id": string,"max_prep_minutes": number | null,"name": string,"people_count": number,"reference_store": string | null,"timezone": string,"updated_at": string,"weekly_budget_cents": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"max_prep_minutes"?: number | null,"name": string,"people_count"?: number,"reference_store"?: string | null,"timezone"?: string,"updated_at"?: string,"weekly_budget_cents"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"max_prep_minutes"?: number | null,"name"?: string,"people_count"?: number,"reference_store"?: string | null,"timezone"?: string,"updated_at"?: string,"weekly_budget_cents"?: number | null
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
                },"ingredient_price_sources": {
                  Row: {
                    "approximate": boolean,"ingredient_id": string,"kind": string,"tags": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approximate"?: boolean,"ingredient_id": string,"kind": string,"tags"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "approximate"?: boolean,"ingredient_id"?: string,"kind"?: string,"tags"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredient_price_sources_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: true
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredients": {
                  Row: {
                    "category": string,"created_at": string,"default_dimension": Database["public"]['Enums']["dimension"],"default_shelf_life_days": number | null,"density_g_per_ml": number | null,"id": string,"is_staple": boolean,"is_validated": boolean,"name": string,"parent_id": string | null,"piece_weight_g": number | null,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"default_dimension": Database["public"]['Enums']["dimension"],"default_shelf_life_days"?: number | null,"density_g_per_ml"?: number | null,"id"?: string,"is_staple"?: boolean,"is_validated"?: boolean,"name": string,"parent_id"?: string | null,"piece_weight_g"?: number | null,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"default_dimension"?: Database["public"]['Enums']["dimension"],"default_shelf_life_days"?: number | null,"density_g_per_ml"?: number | null,"id"?: string,"is_staple"?: boolean,"is_validated"?: boolean,"name"?: string,"parent_id"?: string | null,"piece_weight_g"?: number | null,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredients_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"meal_cookings": {
                  Row: {
                    "cooked_at": string,"cooked_by": string | null,"household_id": string,"id": string,"missing": NonNullable<Json>,"operation_id": string,"plan_id": string,"recipe_id": string,"servings": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cooked_at"?: string,"cooked_by"?: string | null,"household_id": string,"id"?: string,"missing"?: NonNullable<Json>,"operation_id": string,"plan_id": string,"recipe_id": string,"servings": number
                  }
                  Update: {
                    "cooked_at"?: string,"cooked_by"?: string | null,"household_id"?: string,"id"?: string,"missing"?: NonNullable<Json>,"operation_id"?: string,"plan_id"?: string,"recipe_id"?: string,"servings"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_cookings_operation_id_fkey"
      columns: ["operation_id"]
isOneToOne: false
      referencedRelation: "stock_operations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meal_cookings_plan_id_household_id_fkey"
      columns: ["plan_id","household_id"]
isOneToOne: false
      referencedRelation: "meal_plans"
      referencedColumns: ["id","household_id"]
    },{
      foreignKeyName: "meal_cookings_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"meal_plan_entries": {
                  Row: {
                    "created_at": string,"household_id": string,"id": string,"locked": boolean,"meal_slot": string | null,"plan_id": string,"planned_on": string | null,"position": number,"recipe_id": string,"servings": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"household_id": string,"id"?: string,"locked"?: boolean,"meal_slot"?: string | null,"plan_id": string,"planned_on"?: string | null,"position": number,"recipe_id": string,"servings": number
                  }
                  Update: {
                    "created_at"?: string,"household_id"?: string,"id"?: string,"locked"?: boolean,"meal_slot"?: string | null,"plan_id"?: string,"planned_on"?: string | null,"position"?: number,"recipe_id"?: string,"servings"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_plan_entries_plan_id_household_id_fkey"
      columns: ["plan_id","household_id"]
isOneToOne: false
      referencedRelation: "meal_plans"
      referencedColumns: ["id","household_id"]
    },{
      foreignKeyName: "meal_plan_entries_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"meal_plans": {
                  Row: {
                    "budget_cents": number | null,"created_at": string,"created_by": string | null,"household_id": string,"id": string,"last_idempotency_key": string | null,"meal_count": number,"people": number,"seed": number,"shopping_done_at": string | null,"updated_at": string,"version": number,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_cents"?: number | null,"created_at"?: string,"created_by"?: string | null,"household_id": string,"id"?: string,"last_idempotency_key"?: string | null,"meal_count": number,"people": number,"seed"?: number,"shopping_done_at"?: string | null,"updated_at"?: string,"version"?: number,"week_start": string
                  }
                  Update: {
                    "budget_cents"?: number | null,"created_at"?: string,"created_by"?: string | null,"household_id"?: string,"id"?: string,"last_idempotency_key"?: string | null,"meal_count"?: number,"people"?: number,"seed"?: number,"shopping_done_at"?: string | null,"updated_at"?: string,"version"?: number,"week_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_plans_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"pantry_items": {
                  Row: {
                    "created_at": string,"created_by": string | null,"dimension": Database["public"]['Enums']["dimension"],"display_unit": string,"expires_on": string | null,"expiry_kind": Database["public"]['Enums']["expiry_kind"] | null,"household_id": string,"id": string,"ingredient_id": string,"location": Database["public"]['Enums']["storage_loc"],"opened_at": string | null,"quantity_base": number | null,"status": Database["public"]['Enums']["item_status"],"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"dimension": Database["public"]['Enums']["dimension"],"display_unit": string,"expires_on"?: string | null,"expiry_kind"?: Database["public"]['Enums']["expiry_kind"] | null,"household_id": string,"id"?: string,"ingredient_id": string,"location": Database["public"]['Enums']["storage_loc"],"opened_at"?: string | null,"quantity_base"?: number | null,"status"?: Database["public"]['Enums']["item_status"],"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"dimension"?: Database["public"]['Enums']["dimension"],"display_unit"?: string,"expires_on"?: string | null,"expiry_kind"?: Database["public"]['Enums']["expiry_kind"] | null,"household_id"?: string,"id"?: string,"ingredient_id"?: string,"location"?: Database["public"]['Enums']["storage_loc"],"opened_at"?: string | null,"quantity_base"?: number | null,"status"?: Database["public"]['Enums']["item_status"],"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pantry_items_display_unit_fkey"
      columns: ["display_unit"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "pantry_items_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pantry_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"price_sync_runs": {
                  Row: {
                    "details": NonNullable<Json>,"finished_at": string | null,"id": number,"ingredients_priced": number | null,"ingredients_total": number | null,"started_at": string,"started_by": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "details"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: never,"ingredients_priced"?: number | null,"ingredients_total"?: number | null,"started_at"?: string,"started_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "details"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: never,"ingredients_priced"?: number | null,"ingredients_total"?: number | null,"started_at"?: string,"started_by"?: string | null,"status"?: string
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
                },"recipe_equipment": {
                  Row: {
                    "equipment_code": string,"recipe_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "equipment_code": string,"recipe_id": string
                  }
                  Update: {
                    "equipment_code"?: string,"recipe_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_equipment_equipment_code_fkey"
      columns: ["equipment_code"]
isOneToOne: false
      referencedRelation: "equipment"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "recipe_equipment_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"recipe_ingredients": {
                  Row: {
                    "dimension": Database["public"]['Enums']["dimension"] | null,"id": string,"ingredient_id": string,"is_optional": boolean,"position": number,"preparation_note": string | null,"quantity": number | null,"quantity_base": number | null,"recipe_id": string,"unit_code": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "dimension"?: Database["public"]['Enums']["dimension"] | null,"id"?: string,"ingredient_id": string,"is_optional"?: boolean,"position": number,"preparation_note"?: string | null,"quantity"?: number | null,"quantity_base"?: number | null,"recipe_id": string,"unit_code"?: string | null
                  }
                  Update: {
                    "dimension"?: Database["public"]['Enums']["dimension"] | null,"id"?: string,"ingredient_id"?: string,"is_optional"?: boolean,"position"?: number,"preparation_note"?: string | null,"quantity"?: number | null,"quantity_base"?: number | null,"recipe_id"?: string,"unit_code"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipe_ingredients_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipe_ingredients_unit_code_fkey"
      columns: ["unit_code"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["code"]
    }
                  ]
                },"recipe_ratings": {
                  Row: {
                    "household_id": string,"rated_by": string | null,"rating": number,"recipe_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "household_id": string,"rated_by"?: string | null,"rating": number,"recipe_id": string,"updated_at"?: string
                  }
                  Update: {
                    "household_id"?: string,"rated_by"?: string | null,"rating"?: number,"recipe_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_ratings_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipe_ratings_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"recipe_steps": {
                  Row: {
                    "instruction": string,"position": number,"recipe_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "instruction": string,"position": number,"recipe_id": string
                  }
                  Update: {
                    "instruction"?: string,"position"?: number,"recipe_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_steps_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"recipes": {
                  Row: {
                    "ai_generation_id": string | null,"cook_minutes": number,"created_at": string,"description": string | null,"household_id": string | null,"id": string,"image_path": string | null,"prep_minutes": number,"servings": number,"slug": string,"source": Database["public"]['Enums']["recipe_source"],"source_ref": string | null,"status": Database["public"]['Enums']["recipe_status"],"storage_note": string | null,"tags": (string)[],"title": string,"updated_at": string,"validated_at": string | null,"validated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_generation_id"?: string | null,"cook_minutes"?: number,"created_at"?: string,"description"?: string | null,"household_id"?: string | null,"id"?: string,"image_path"?: string | null,"prep_minutes": number,"servings": number,"slug": string,"source": Database["public"]['Enums']["recipe_source"],"source_ref"?: string | null,"status"?: Database["public"]['Enums']["recipe_status"],"storage_note"?: string | null,"tags"?: (string)[],"title": string,"updated_at"?: string,"validated_at"?: string | null,"validated_by"?: string | null
                  }
                  Update: {
                    "ai_generation_id"?: string | null,"cook_minutes"?: number,"created_at"?: string,"description"?: string | null,"household_id"?: string | null,"id"?: string,"image_path"?: string | null,"prep_minutes"?: number,"servings"?: number,"slug"?: string,"source"?: Database["public"]['Enums']["recipe_source"],"source_ref"?: string | null,"status"?: Database["public"]['Enums']["recipe_status"],"storage_note"?: string | null,"tags"?: (string)[],"title"?: string,"updated_at"?: string,"validated_at"?: string | null,"validated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipes_ai_generation_id_fkey"
      columns: ["ai_generation_id"]
isOneToOne: false
      referencedRelation: "ai_generations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipes_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"reference_prices": {
                  Row: {
                    "cents_per_ref": number,"computed_at": string,"dimension": Database["public"]['Enums']["dimension"],"ingredient_id": string,"observed_from": string | null,"observed_to": string | null,"sample_size": number,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cents_per_ref": number,"computed_at"?: string,"dimension": Database["public"]['Enums']["dimension"],"ingredient_id": string,"observed_from"?: string | null,"observed_to"?: string | null,"sample_size": number,"source": string
                  }
                  Update: {
                    "cents_per_ref"?: number,"computed_at"?: string,"dimension"?: Database["public"]['Enums']["dimension"],"ingredient_id"?: string,"observed_from"?: string | null,"observed_to"?: string | null,"sample_size"?: number,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reference_prices_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: true
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"shopping_checks": {
                  Row: {
                    "checked_at": string,"checked_by": string | null,"dimension": Database["public"]['Enums']["dimension"],"household_id": string,"ingredient_id": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_at"?: string,"checked_by"?: string | null,"dimension": Database["public"]['Enums']["dimension"],"household_id": string,"ingredient_id": string,"week_start": string
                  }
                  Update: {
                    "checked_at"?: string,"checked_by"?: string | null,"dimension"?: Database["public"]['Enums']["dimension"],"household_id"?: string,"ingredient_id"?: string,"week_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shopping_checks_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shopping_checks_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"shopping_extras": {
                  Row: {
                    "checked": boolean,"created_at": string,"created_by": string | null,"household_id": string,"id": string,"ingredient_id": string | null,"label": string,"quantity_text": string | null,"source_recipe_id": string | null,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked"?: boolean,"created_at"?: string,"created_by"?: string | null,"household_id": string,"id"?: string,"ingredient_id"?: string | null,"label": string,"quantity_text"?: string | null,"source_recipe_id"?: string | null,"week_start": string
                  }
                  Update: {
                    "checked"?: boolean,"created_at"?: string,"created_by"?: string | null,"household_id"?: string,"id"?: string,"ingredient_id"?: string | null,"label"?: string,"quantity_text"?: string | null,"source_recipe_id"?: string | null,"week_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shopping_extras_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shopping_extras_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shopping_extras_source_recipe_id_fkey"
      columns: ["source_recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_movements": {
                  Row: {
                    "created_at": string,"created_by": string | null,"delta_base": number | null,"household_id": string,"id": number,"ingredient_id": string,"kind": Database["public"]['Enums']["movement_kind"],"note": string | null,"operation_id": string,"pantry_item_id": string,"quantity_after_base": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"delta_base"?: number | null,"household_id": string,"id"?: never,"ingredient_id": string,"kind": Database["public"]['Enums']["movement_kind"],"note"?: string | null,"operation_id": string,"pantry_item_id": string,"quantity_after_base"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"delta_base"?: number | null,"household_id"?: string,"id"?: never,"ingredient_id"?: string,"kind"?: Database["public"]['Enums']["movement_kind"],"note"?: string | null,"operation_id"?: string,"pantry_item_id"?: string,"quantity_after_base"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_movements_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_operation_id_fkey"
      columns: ["operation_id"]
isOneToOne: false
      referencedRelation: "stock_operations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_pantry_item_id_fkey"
      columns: ["pantry_item_id"]
isOneToOne: false
      referencedRelation: "pantry_items"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_operations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"household_id": string,"id": string,"idempotency_key": string,"kind": Database["public"]['Enums']["movement_kind"],"result": Json | null,"source_id": string | null,"source_table": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"household_id": string,"id"?: string,"idempotency_key": string,"kind": Database["public"]['Enums']["movement_kind"],"result"?: Json | null,"source_id"?: string | null,"source_table"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"household_id"?: string,"id"?: string,"idempotency_key"?: string,"kind"?: Database["public"]['Enums']["movement_kind"],"result"?: Json | null,"source_id"?: string | null,"source_table"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_operations_household_id_fkey"
      columns: ["household_id"]
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
            "recipe_allergens": {
                  Row: {
                    "allergen_code": string | null,"recipe_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "ingredient_allergens_allergen_code_fkey"
      columns: ["allergen_code"]
isOneToOne: false
      referencedRelation: "allergens"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "recipe_ingredients_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"recipe_diet_conflicts": {
                  Row: {
                    "diet_code": string | null,"recipe_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "ingredient_diet_conflicts_diet_code_fkey"
      columns: ["diet_code"]
isOneToOne: false
      referencedRelation: "diets"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "recipe_ingredients_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "_recipe_equipment_compute":
{ Args: { "p_recipe_id": string }; Returns: undefined
                           },
"_stock_begin_operation":
{ Args: { "p_household_id": string,"p_idempotency_key": string,"p_kind": Database["public"]['Enums']["movement_kind"] }; Returns: Record<string, unknown>
                           },
"_stock_finish_operation":
{ Args: { "p_item_id": string,"p_operation_id": string,"p_result": Json }; Returns: Json
                           },
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
"meal_cook":
{ Args: { "p_consumptions": Json,"p_household_id": string,"p_idempotency_key": string,"p_missing": Json,"p_recipe_id": string,"p_servings": number,"p_week_start": string }; Returns: Json
                           },
"meal_plan_save":
{ Args: { "p_budget_cents": number,"p_entries": Json,"p_expected_version": number,"p_household_id": string,"p_idempotency_key": string,"p_meal_count": number,"p_people": number,"p_seed": number,"p_week_start": string }; Returns: {
              "plan_id": string,"plan_version": number
            }[]
                           },
"my_household_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"normalize_alias":
{ Args: { "input": string }; Returns: string
                           },
"pantry_add_item":
{ Args: { "p_display_unit": string,"p_expires_on": string,"p_expiry_kind": Database["public"]['Enums']["expiry_kind"],"p_household_id": string,"p_idempotency_key": string,"p_ingredient_id": string,"p_location": Database["public"]['Enums']["storage_loc"],"p_note"?: string,"p_opened": boolean,"p_quantity": number }; Returns: Json
                           },
"pantry_apply_movement":
{ Args: { "p_expected_version": number,"p_idempotency_key": string,"p_item_id": string,"p_kind": Database["public"]['Enums']["movement_kind"],"p_note"?: string,"p_quantity": number,"p_unit": string }; Returns: Json
                           },
"pantry_update_details":
{ Args: { "p_expected_version": number,"p_expires_on": string,"p_expiry_kind": Database["public"]['Enums']["expiry_kind"],"p_item_id": string,"p_location": Database["public"]['Enums']["storage_loc"],"p_opened": boolean }; Returns: Json
                           },
"report_app_error":
{ Args: { "p_digest"?: string,"p_kind": string,"p_message": string,"p_path"?: string,"p_release"?: string }; Returns: undefined
                           },
"resolve_ingredient":
{ Args: { "p_label": string }; Returns: string
                           },
"set_food_profile":
{ Args: { "p_allergens": (string)[],"p_eating_style": string,"p_equipment": (string)[],"p_household_id": string,"p_no_pork": boolean,"p_objectives": (string)[] }; Returns: undefined
                           },
"set_household_preferences":
{ Args: { "p_allergens": (string)[],"p_diets": (string)[],"p_household_id": string }; Returns: undefined
                           },
"shopping_finish":
{ Args: { "p_household_id": string,"p_idempotency_key": string,"p_items": Json,"p_week_start": string }; Returns: Json
                           },
"shopping_put_away":
{ Args: { "p_household_id": string,"p_idempotency_key": string,"p_items": Json }; Returns: Json
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
