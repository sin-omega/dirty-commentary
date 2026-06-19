// lib/database.types.ts
//
// Typy odpowiadające schemie z supabase/migrations/.
// W realnym projekcie można je wygenerować automatycznie:
//   npx supabase gen types typescript --project-id <id> > lib/database.types.ts
// Tutaj są napisane ręcznie, zgodnie z migracją SQL, w kształcie zgodnym z
// tym co generuje oficjalne narzędzie (osobne płaskie interfejsy Row/Insert/
// Update zamiast intersection types z Partial<>) - intersection types
// potrafią psuć wnioskowanie przeciążeń insert/upsert/update w postgrest-js.

export type SubmissionStatus = 'pending' | 'scheduled' | 'done';

export interface AdminProfile {
  id: string;
  username: string;
  display_name: string;
  signature: string;
  is_operator: boolean;
  created_at: string;
}

export interface AdminProfileInsert {
  id: string;
  username: string;
  display_name: string;
  signature?: string;
  is_operator?: boolean;
  created_at?: string;
}

export interface AdminProfileUpdate {
  id?: string;
  username?: string;
  display_name?: string;
  signature?: string;
  is_operator?: boolean;
  created_at?: string;
}

export interface InviteToken {
  id: string;
  token: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  created_admin_id: string | null;
  created_at: string;
}

export interface InviteTokenInsert {
  id?: string;
  token: string;
  created_by: string;
  expires_at: string;
  used_at?: string | null;
  created_admin_id?: string | null;
  created_at?: string;
}

export interface InviteTokenUpdate {
  id?: string;
  token?: string;
  created_by?: string;
  expires_at?: string;
  used_at?: string | null;
  created_admin_id?: string | null;
  created_at?: string;
}

export interface Submission {
  id: string;
  image_path: string;
  sender_nickname: string;
  channel_link: string | null;
  status: SubmissionStatus;
  comment_body: string;
  handled_by: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionInsert {
  id?: string;
  image_path: string;
  sender_nickname: string;
  channel_link?: string | null;
  status?: SubmissionStatus;
  comment_body?: string;
  handled_by?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionUpdate {
  id?: string;
  image_path?: string;
  sender_nickname?: string;
  channel_link?: string | null;
  status?: SubmissionStatus;
  comment_body?: string;
  handled_by?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: AdminProfile;
        Insert: AdminProfileInsert;
        Update: AdminProfileUpdate;
        Relationships: [];
      };
      invite_tokens: {
        Row: InviteToken;
        Insert: InviteTokenInsert;
        Update: InviteTokenUpdate;
        Relationships: [];
      };
      submissions: {
        Row: Submission;
        Insert: SubmissionInsert;
        Update: SubmissionUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      submission_status: SubmissionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
