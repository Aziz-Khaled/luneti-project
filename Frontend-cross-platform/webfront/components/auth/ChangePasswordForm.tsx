"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function ChangePasswordForm() {
  const { changePassword, user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setPending(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de modifier le mot de passe.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" href="/">Lunetty</Link>
        <h1>Définir votre mot de passe</h1>
        <p className="muted">
          Bienvenue{user?.prenom ? `, ${user.prenom}` : ""}. Remplacez le mot de passe temporaire
          avant de continuer.
        </p>
        <form className="form-grid" onSubmit={submit}>
          <label className="field">
            <span>Mot de passe temporaire</span>
            <input
              autoComplete="current-password"
              name="currentPassword"
              type="password"
              required
            />
          </label>
          <label className="field">
            <span>Nouveau mot de passe</span>
            <input
              autoComplete="new-password"
              name="newPassword"
              type="password"
              minLength={12}
              required
            />
            <small>Utilisez au moins 12 caractères.</small>
          </label>
          <label className="field">
            <span>Confirmer le nouveau mot de passe</span>
            <input
              autoComplete="new-password"
              name="confirmPassword"
              type="password"
              minLength={12}
              required
            />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button
            className="button primary full-width"
            disabled={pending || loading}
            type="submit"
          >
            {pending ? "Mise à jour…" : "Changer le mot de passe"}
          </button>
        </form>
      </section>
    </main>
  );
}
