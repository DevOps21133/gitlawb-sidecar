export const DEFAULT_NODE = "https://node.gitlawb.com";
export const EXPLORER = "https://explorer.gitlawb.com";
export const MAPPING_FILE = ".gitlawb-sidecar.json";
export const WORKFLOW_PATH = ".github/workflows/gitlawb-sidecar.yml";
export const STICKY_MARKER = "<!-- gitlawb-sidecar -->";

export type GithubRepo = {
  owner: string;
  repo: string;
};

export type SidecarMapping = {
  version: 1;
  github: GithubRepo | null;
  gitlawbDid: string;
  gitlawbRepo: string;
  node: string;
  createdAt: string;
};

export type RefCertificate = {
  id: string;
  issued_at: string;
  new_sha: string;
  old_sha: string;
  node_did: string;
  pusher_did: string;
  ref_name: string;
  repo_id?: string;
  signature: string;
};

export type CertListResponse = {
  certificates: RefCertificate[];
  count: number;
};

export type RepoInfo = {
  id: string;
  name: string;
  owner_did: string;
  description: string | null;
  is_public: boolean;
  default_branch: string;
  clone_url: string;
  star_count: number;
  created_at: string;
  updated_at: string;
};

export type HealthResponse = {
  status: string;
};

export type DoctorCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type CliOptions = {
  command: string;
  node: string;
  dir?: string;
  json: boolean;
  integrate: boolean;
  name?: string;
  description?: string;
  ref?: string;
  commentPr: boolean;
  showPemHint: boolean;
  help: boolean;
};
