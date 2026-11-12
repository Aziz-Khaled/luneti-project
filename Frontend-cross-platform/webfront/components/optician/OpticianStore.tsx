"use client";

import { useRef, useState } from "react";
import {
  IconCheck,
  IconEyeglasses,
} from "../ui/Icons";

interface OpticianStoreProps {
  storeData: unknown;
  storeId?: string;
  onUpdateStore: (input: Record<string, unknown>) => Promise<void>;
  onUploadImage: (type: "logo" | "cover", file: File) => Promise<string>;
  onArchiveStore: () => Promise<void>;
}

export function OpticianStore({
  storeData,
  onUpdateStore,
  onUploadImage,
  onArchiveStore,
}: OpticianStoreProps) {
  const store = (storeData ?? {}) as Record<string, unknown>;

  const nom = String(store.nom || "");
  const slug = String(store.slug || "");
  const codeRne = String(store.code_enregistrement || "");
  const storeAddress = Array.isArray(store.adresses)
    ? (store.adresses[0] as Record<string, unknown> | undefined)
    : undefined;
  const addressLabel = [
    storeAddress?.ligne_1,
    storeAddress?.code_postal,
    storeAddress?.ville,
    storeAddress?.region,
  ].filter((part): part is string => typeof part === "string" && part.trim() !== "").join(", ");
  const [description, setDescription] = useState(String(store.description || ""));
  const [email, setEmail] = useState(String(store.email || ""));
  const [telephone, setTelephone] = useState(String(store.telephone || ""));
  const [siteWeb, setSiteWeb] = useState(String(store.url_site_web || ""));
  const [logoUrl, setLogoUrl] = useState(String(store.url_logo || ""));
  const [coverUrl, setCoverUrl] = useState(String(store.url_image_couverture || ""));
  const [timezone, setTimezone] = useState(String(store.fuseau_horaire || "Africa/Tunis"));
  const [devise, setDevise] = useState(String(store.devise || "TND"));

  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"logo" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function handleImageUpload(type: "logo" | "cover", file?: File) {
    if (!file) return;
    setUploadingImage(type);
    setUploadError("");
    try {
      const url = await onUploadImage(type, file);
      if (type === "logo") setLogoUrl(url);
      else setCoverUrl(url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Le téléversement a échoué.");
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessNotice(false);
    try {
      await onUpdateStore({
        description,
        email: email || undefined,
        telephone: telephone || undefined,
        url_site_web: siteWeb || undefined,
        url_logo: logoUrl || undefined,
        url_image_couverture: coverUrl || undefined,
        fuseau_horaire: timezone,
        devise,
      });
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="opt-store-page">
      {/* Visual Brand Preview Header Banner */}
      <div className="opt-brand-banner">
        {coverUrl ? (
          <div
            className="opt-banner-cover"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div className="opt-banner-cover default-gradient" />
        )}

        <div className="opt-banner-content">
          <div className="opt-banner-avatar">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={nom || "Boutique"} />
            ) : (
              <div className="opt-avatar-placeholder">
                <IconEyeglasses height={32} width={32} />
              </div>
            )}
          </div>

          <div className="opt-banner-titles">
            <h2>{nom || "Nom de votre boutique"}</h2>
            <div className="opt-banner-meta">
              <span className="opt-slug-chip">lunetty.tn/{slug || "boutique"}</span>
              <span className="opt-currency-chip">{devise}</span>
              <span className="opt-tz-chip">{timezone}</span>
            </div>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="notice success">
          <IconCheck height={16} width={16} /> Informations de la boutique mises à jour avec succès.
        </div>
      )}
      {uploadError && <p className="opt-upload-error" role="alert">{uploadError}</p>}

      {/* Store Settings Form */}
      <form onSubmit={handleSubmit}>
        <div className="opt-settings-sections">
          <div className="opt-card">
            <div className="opt-card-header">
              <div>
                <h3>Informations de votre boutique</h3>
                <p className="opt-card-sub">Remplissez les informations principales pour que votre boutique soit facile à trouver.</p>
              </div>
            </div>
            <div className="opt-card-body">
              <div className="opt-row-2">
                <div className="field">
                  <span>Nom de votre boutique</span>
                  <p>{nom || "Non renseigné"}</p>
                  <small>Ce nom ne peut pas être modifié après la création.</small>
                </div>
                <div className="field">
                  <span>Code RNE</span>
                  <p>{codeRne || "Non renseigné"}</p>
                </div>
              </div>

              <div className="field">
                <span>Adresse de la boutique</span>
                <p>{addressLabel || "Non renseignée"}</p>
                <small>Cette adresse ne peut pas être modifiée après la création.</small>
              </div>

              <div className="field">
                <span>Présentation de votre boutique</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre magasin, vos services et ce qui le rend unique..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="opt-card">
            <div className="opt-card-header">
              <div>
                <h3>Contact et visibilité</h3>
                <p className="opt-card-sub">Ces informations apparaissent pour vos clients.</p>
              </div>
            </div>
            <div className="opt-card-body">
              <div className="opt-row-2">
                <div className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@optiquerepublique.tn"
                  />
                </div>
                <div className="field">
                  <span>Téléphone</span>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+216 71 000 000"
                  />
                </div>
              </div>

              <div className="field">
                <span>Site internet</span>
                <input
                  type="url"
                  value={siteWeb}
                  onChange={(e) => setSiteWeb(e.target.value)}
                  placeholder="https://www.optiquerepublique.tn"
                />
              </div>
            </div>
          </div>

          <div className="opt-card">
            <div className="opt-card-header">
              <div>
                <h3>Images de la boutique</h3>
                <p className="opt-card-sub">Ajoutez votre logo et votre illustration pour une meilleure présentation.</p>
              </div>
            </div>
            <div className="opt-card-body">
              <div className="opt-row-2">
                <div className="field">
                  <span>Logo</span>
                  <small>Le logo apparaît dans l&apos;en-tête et sur les fiches de boutique.</small>
                  <input
                    ref={logoInput}
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    hidden
                    onChange={(e) => {
                      void handleImageUpload("logo", e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                    type="file"
                  />
                  <button
                    className="button secondary"
                    disabled={uploadingImage !== null}
                    onClick={() => logoInput.current?.click()}
                    type="button"
                  >
                    {uploadingImage === "logo" ? "Téléversement…" : "Choisir le logo"}
                  </button>
                </div>
                <div className="field">
                  <span>Illustration / bannière</span>
                  <small>Cette image donne un meilleur aperçu de votre boutique.</small>
                  <input
                    ref={coverInput}
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    hidden
                    onChange={(e) => {
                      void handleImageUpload("cover", e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                    type="file"
                  />
                  <button
                    className="button secondary"
                    disabled={uploadingImage !== null}
                    onClick={() => coverInput.current?.click()}
                    type="button"
                  >
                    {uploadingImage === "cover" ? "Téléversement…" : "Choisir l’illustration"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="opt-card">
            <div className="opt-card-header">
              <div>
                <h3>Réglages pratiques</h3>
                <p className="opt-card-sub">Ajustez la devise et le fuseau horaire de votre boutique.</p>
              </div>
            </div>
            <div className="opt-card-body">
              <div className="opt-row-2">
                <div className="field">
                  <span>Devise principale</span>
                  <select value={devise} onChange={(e) => setDevise(e.target.value)}>
                    <option value="TND">TND (Dinar Tunisien)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="USD">USD ($ Dollar US)</option>
                  </select>
                </div>
                <div className="field">
                  <span>Fuseau horaire</span>
                  <input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Africa/Tunis"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="opt-form-action-row">
            <button className="button primary large" disabled={submitting} type="submit">
              {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>

          <div className="opt-card danger-zone">
            <div className="opt-card-header">
              <div>
                <h4 className="danger-title">Fermer la boutique</h4>
                <p className="opt-card-sub">La boutique sera retirée de votre espace actif. Ses données resteront conservées dans Lunetty.</p>
              </div>
              <button
                className="button danger"
                onClick={async () => {
                  if (window.confirm("Fermer cette boutique ? Elle ne sera plus active ni visible dans votre espace de gestion. Ses données resteront conservées dans Lunetty.")) {
                    await onArchiveStore();
                  }
                }}
                type="button"
              >
                Fermer la boutique
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
