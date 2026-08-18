import type {
  CertListResponse,
  HealthResponse,
  RepoInfo,
} from "./types.js";

export class GitlawbClient {
  constructor(readonly node: string) {}

  private url(path: string): string {
    return `${this.node.replace(/\/$/, "")}${path}`;
  }

  async getJson<T>(path: string): Promise<T> {
    const res = await fetch(this.url(path), {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `GET ${path} failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`,
      );
    }
    return (await res.json()) as T;
  }

  async health(): Promise<HealthResponse> {
    return this.getJson<HealthResponse>("/health");
  }

  async repo(did: string, name: string): Promise<RepoInfo> {
    return this.getJson<RepoInfo>(
      `/api/v1/repos/${encodeURIComponent(did)}/${encodeURIComponent(name)}`,
    );
  }

  async certs(did: string, name: string): Promise<CertListResponse> {
    return this.getJson<CertListResponse>(
      `/api/v1/repos/${encodeURIComponent(did)}/${encodeURIComponent(name)}/certs`,
    );
  }

  async blob(did: string, name: string, path: string): Promise<string> {
    const res = await fetch(
      this.url(
        `/api/v1/repos/${encodeURIComponent(did)}/${encodeURIComponent(name)}/blob/${path}`,
      ),
    );
    if (!res.ok) {
      throw new Error(`blob ${path} failed: ${res.status}`);
    }
    return res.text();
  }
}
