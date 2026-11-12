"use client";

import { useState } from "react";
import { IconCheck } from "../ui/Icons";

interface OpticianProfileProps {
  profileData: unknown;
  onUpdateProfile: (input: Record<string, unknown>) => Promise<void>;
}

export function OpticianProfile({
  profileData,
  onUpdateProfile,
}: OpticianProfileProps) {
  const profile = (profileData ?? {}) as Record<string, unknown>;

  const [title, setTitle] = useState(String(profile.titre_professionnel || ""));
  const [number, setNumber] = useState(String(profile.numero_professionnel || ""));
  const [bio, setBio] = useState(String(profile.biographie || ""));

  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessNotice(false);
    try {
      await onUpdateProfile({
        titre_professionnel: title || undefined,
        numero_professionnel: number || undefined,
        biographie: bio || undefined,
      });
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="opt-profile-page">
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Profil professionnel de l&apos;opticien</h3>
            <p className="opt-card-sub">
              Titres académiques, numéro d&apos;agrément d&apos;exercice et présentation de vos spécialités
            </p>
          </div>
        </div>

        {successNotice && (
          <div className="notice success">
            <IconCheck height={16} width={16} /> Profil d&apos;opticien mis à jour avec succès.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="opt-card-body">
            <div className="opt-row-2">
              <div className="field">
                <span>Titre professionnel</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Opticien-Lunetier & Optométriste D.E."
                />
              </div>

              <div className="field">
                <span>Numéro professionnel / Agrément d&apos;exercice</span>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: OPT-TN-2024-489"
                />
                <small>Numéro officiel d&apos;exercice figurant sur les devis et ordonnances.</small>
              </div>
            </div>

            <div className="field">
              <span>Biographie & Présentation professionnelle</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Présentez votre parcours, vos diplômes et vos expertises (lentilles de contact, basse vision, adaptation verres progressifs)..."
                rows={4}
              />
            </div>

            <div className="opt-form-action-row">
              <button className="button primary large" disabled={submitting} type="submit">
                {submitting ? "Enregistrement…" : "Enregistrer mon profil professionnel"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
