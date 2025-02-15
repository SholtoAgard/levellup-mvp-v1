
export interface RoleplaySession {
  id: string;
  avatar_id: string;
  avatar_voice_id?: string;
  roleplay_type: string;
  scenario_description: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  score?: number;
  feedback?: string;
}

export interface RoleplayMessage {
  id: string;
  session_id: string;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}
