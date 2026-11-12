"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    try {
      if (mode === "register") {
        await register({
          prenom: String(data.get("prenom") ?? "").trim(),
          nom: String(data.get("nom") ?? "").trim(),
          email,
          password,
        });
      } else {
        await login(email, password);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentification impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" href="/">Lunetty</Link>
        <h1>{mode === "login" ? "Connexion" : "Créer votre compte"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Utilisez votre compte Lunetty pour continuer."
            : "Les comptes sont créés comme utilisateurs standards par le backend. L’accès opticien dépend de l’adhésion à une boutique."}
        </p>
        <form className="form-grid" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label className="field"><span>Prénom *</span><input name="prenom" maxLength={100} required /></label>
              <label className="field"><span>Nom *</span><input name="nom" maxLength={100} required /></label>
            </>
          )}
          <label className="field"><span>E-mail *</span><input autoComplete="email" name="email" type="email" maxLength={255} required /></label>
          <label className="field">
            <span>Mot de passe *</span>
            <input autoComplete={mode === "login" ? "current-password" : "new-password"} name="password" type="password" minLength={mode === "register" ? 12 : 1} required />
            {mode === "register" && <small>Au moins 12 caractères.</small>}
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="button primary full-width" type="submit" disabled={pending}>
            {pending ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "Nouveau sur Lunetty ?" : "Vous avez déjà un compte ?"}{" "}
          <Link href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Créer un compte" : "Se connecter"}
          </Link>
        </p>
      </section>
    </main>
  );
}
