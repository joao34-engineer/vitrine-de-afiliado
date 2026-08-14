export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SupabaseProductRow = {
  readonly id: string;
  readonly product_id_shopee: string;
  readonly title: string;
  readonly price_original: number;
  readonly price_discount: number;
  readonly image_url: string;
  readonly shopee_affiliate_link: string;
  readonly ai_copy: string | null;
  readonly category: string | null;
  readonly sales: number | null;
  readonly embedding: string | null;
  readonly is_active: boolean;
  readonly created_at: string | null;
  readonly department_slug: string | null;
  readonly subcategory_slug: string | null;
  readonly leaf_slug: string | null;
  readonly classification_source: string | null;
  readonly classification_confidence: number | null;
  readonly classification_review_status: string | null;
  readonly search_document: string | null;
};

export type SupabasePublicProductRow = Pick<
  SupabaseProductRow,
  | "id"
  | "product_id_shopee"
  | "title"
  | "price_original"
  | "price_discount"
  | "image_url"
  | "category"
  | "is_active"
  | "created_at"
  | "department_slug"
  | "subcategory_slug"
  | "leaf_slug"
>;

export type SupabasePublicAffiliateProductDetailRow = SupabasePublicProductRow &
  Pick<SupabaseProductRow, "shopee_affiliate_link">;

export type SupabaseProductClassificationUpdate = {
  readonly department_slug?: string | null;
  readonly subcategory_slug?: string | null;
  readonly leaf_slug?: string | null;
  readonly classification_source?: string | null;
  readonly classification_confidence?: number | null;
  readonly classification_review_status?: "auto" | "review" | null;
};

export type SupabaseSearchProductRow = SupabasePublicProductRow & {
  readonly relevance_rank: number;
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: SupabaseProductRow;
        Insert: Partial<SupabaseProductRow>;
        Update: SupabaseProductClassificationUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      list_public_affiliate_products: {
        Args: {
          p_cursor_created_at?: string | null;
          p_cursor_id?: string | null;
          p_department_slug?: string | null;
          p_leaf_slug?: string | null;
          p_limit?: number;
        };
        Returns: SupabasePublicProductRow[];
      };
      search_public_affiliate_products: {
        Args: {
          p_cursor_created_at?: string | null;
          p_cursor_id?: string | null;
          p_cursor_rank?: number | null;
          p_department_slug?: string | null;
          p_leaf_slug?: string | null;
          p_limit?: number;
          p_query: string;
        };
        Returns: SupabaseSearchProductRow[];
      };
      get_public_affiliate_product: {
        Args: {
          p_product_id: string;
        };
        Returns: SupabasePublicAffiliateProductDetailRow[];
      };
      record_click: {
        Args: {
          p_campaign_id?: string | null;
          p_copy_id?: string | null;
          p_event_id: string;
          p_group_id?: string | null;
          p_post_id?: string | null;
          p_product_id?: string | null;
          p_referer_origin?: string | null;
          p_source: string;
          p_tracking_code: string;
          p_user_agent_class?: string | null;
        };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
