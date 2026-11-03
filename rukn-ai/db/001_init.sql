CREATE SCHEMA IF NOT EXISTS rukn_ai;
CREATE TABLE IF NOT EXISTS rukn_ai.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);
CREATE TABLE IF NOT EXISTS rukn_ai.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES rukn_ai.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding jsonb,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);
CREATE TABLE IF NOT EXISTS rukn_ai.approval_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('knowledge','pricing','service','model_setting')),
  item_id uuid,
  action text NOT NULL CHECK (action IN ('create','update','archive')),
  proposed_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_by text,
  reviewed_by text,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE TABLE IF NOT EXISTS rukn_ai.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  message_id uuid,
  rating text NOT NULL CHECK (rating IN ('helpful','not_helpful','correction')),
  user_prompt text,
  ai_response text,
  correction text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);
CREATE TABLE IF NOT EXISTS rukn_ai.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'محادثة جديدة',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rukn_ai.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES rukn_ai.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rukn_ai.business_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  customer_name text,
  service_category text,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_cost numeric(14,2),
  final_cost numeric(14,2),
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','design','quoted','approved','production','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rukn_ai.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  production_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rukn_ai.pricing_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  material_name text,
  unit text,
  unit_cost numeric(14,4),
  labor_hours numeric(10,2),
  labor_cost numeric(14,2),
  quantity numeric(14,3),
  final_price numeric(14,2),
  currency text NOT NULL DEFAULT 'LYD',
  source_note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);
CREATE TABLE IF NOT EXISTS rukn_ai.ai_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
CREATE TABLE IF NOT EXISTS rukn_ai.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  actor text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_documents_status_idx ON rukn_ai.knowledge_documents(status, created_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx ON rukn_ai.knowledge_chunks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS approval_queue_status_idx ON rukn_ai.approval_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON rukn_ai.feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON rukn_ai.chat_messages(session_id, created_at);
