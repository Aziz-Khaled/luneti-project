import { apiRequest, setAccessToken } from "./api";

export interface User {
  id: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  prenom: string;
  nom: string;
  nom_utilisateur?: string | null;
  email: string;
  telephone?: string | null;
  url_image_profil?: string | null;
  statut?: string;
  doit_changer_mot_de_passe: boolean;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const response = await apiRequest<AuthResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(response.accessToken);
    return this.me();
  },

  async register(input: {
    prenom: string;
    nom: string;
    email: string;
    password: string;
  }): Promise<User> {
    const response = await apiRequest<AuthResponse>("auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setAccessToken(response.accessToken);
    return this.me();
  },

  me(): Promise<User> {
    return apiRequest<User>("auth/me");
  },

  changePassword(currentPassword: string, newPassword: string): Promise<User> {
    return apiRequest<User>("auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
