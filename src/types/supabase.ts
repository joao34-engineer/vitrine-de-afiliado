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
  readonly embedding: string | null;
  readonly is_active: boolean;
  readonly created_at: string | null;
  readonly department_slug: string | null;
  readonly subcategory_slug: string | null;
  readonly leaf_slug: string | null;
  readonly classification_source: string | null;
  readonly classification_confidence: number | null;
  readonly classification_review_status: string | null;
  readonly classification_suggested_department_slug: string | null;
  readonly classification_suggested_subcategory_slug: string | null;
  readonly classification_suggested_leaf_slug: string | null;
  readonly classification_reasons: string[] | null;
  readonly classification_revision: number;
  readonly classification_updated_at: string | null;
  readonly classification_reviewed_at: string | null;
  readonly classification_last_operation_id?: string | null;
  readonly classification_last_operation_kind?: "approve" | "deactivate" | null;
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

export type SupabaseReviewProductRow = Pick<
  SupabaseProductRow,
  | "id"
  | "product_id_shopee"
  | "title"
  | "image_url"
  | "category"
  | "classification_confidence"
  | "classification_suggested_department_slug"
  | "classification_suggested_subcategory_slug"
  | "classification_suggested_leaf_slug"
  | "classification_reasons"
  | "classification_revision"
  | "classification_updated_at"
  | "created_at"
> & {
  readonly classification_review_status: "review";
  readonly is_active: true;
};

export type SupabaseAffiliateProductIngestionResult = {
  readonly id: string;
  readonly product_id_shopee: string;
  readonly previous_public_eligible: boolean;
  readonly public_eligible: boolean;
  readonly classification_review_status: "auto" | "review" | null;
  readonly classification_revision: number;
  readonly changed: boolean;
  readonly created: boolean;
};

export type SupabaseAffiliateProductClassificationMutationResult = {
  readonly id: string;
  readonly public_eligible: boolean;
  readonly classification_revision: number;
  readonly changed: boolean;
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
      upsert_affiliate_product_ingestion: {
        Args: {
          p_product_id_shopee: string;
          p_title: string;
          p_price_original: number;
          p_price_discount: number;
          p_image_url: string;
          p_shopee_affiliate_link: string;
          p_ai_copy: string | null;
          p_category: string | null;
          p_department_slug: string | null;
          p_subcategory_slug: string | null;
          p_leaf_slug: string | null;
          p_classification_source: string;
          p_classification_confidence: number;
          p_classification_review_status: "auto" | "review";
          p_suggested_department_slug: string | null;
          p_suggested_subcategory_slug: string | null;
          p_suggested_leaf_slug: string | null;
          p_classification_reasons: string[];
        };
        Returns: SupabaseAffiliateProductIngestionResult[];
      };
      approve_affiliate_product_classification: {
        Args: {
          p_product_id: string;
          p_department_slug: string;
          p_subcategory_slug: string | null;
          p_leaf_slug: string;
          p_expected_revision: number;
          p_operation_id: string;
        };
        Returns: SupabaseAffiliateProductClassificationMutationResult[];
      };
      deactivate_affiliate_product: {
        Args: {
          p_product_id: string;
          p_expected_revision: number;
          p_operation_id: string;
        };
        Returns: SupabaseAffiliateProductClassificationMutationResult[];
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
