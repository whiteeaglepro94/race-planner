const BASE_URL = 'https://members-ng.iracing.com';

export class IracingApiClient {
  private cookies: string[] = [];
  private _authenticated = false;

  get isAuthenticated(): boolean {
    return this._authenticated;
  }

  setCookies(cookies: string[]): void {
    this.cookies = cookies;
    this._authenticated = cookies.length > 0;
  }

  async getData<T = unknown>(endpoint: string): Promise<T> {
    if (!this._authenticated) throw new Error('Non authentifié');

    const res = await fetch(`${BASE_URL}/data/${endpoint}`, {
      headers: { Cookie: this.cookies.join('; ') },
    });

    if (res.status === 401) {
      this._authenticated = false;
      throw new Error('Session expirée — reconnectez-vous');
    }

    if (!res.ok) throw new Error(`Erreur API iRacing: HTTP ${res.status}`);

    const json = await res.json();

    if (json.link) {
      const s3Res = await fetch(json.link);
      if (!s3Res.ok) throw new Error(`Erreur de téléchargement des données: HTTP ${s3Res.status}`);
      return s3Res.json() as T;
    }

    return json as T;
  }

  logout(): void {
    this.cookies = [];
    this._authenticated = false;
  }
}
