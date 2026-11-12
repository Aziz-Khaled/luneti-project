"use client";

import { useState } from "react";
import {
  IconLocations,
  IconPlus,
  IconCheck,
  IconX,
} from "../ui/Icons";

interface OpticianLocationsProps {
  locationsData: unknown;
  storeId?: string;
  onCreateLocation: (input: Record<string, unknown>) => Promise<void>;
  onUpdateLocation: (locationId: string, input: Record<string, unknown>) => Promise<void>;
}

export function OpticianLocations({
  locationsData,
  onCreateLocation,
  onUpdateLocation,
}: OpticianLocationsProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [locType, setLocType] = useState("STORE");
  const [locDefault, setLocDefault] = useState(false);

  const [editModal, setEditModal] = useState<{
    id: string;
    nom: string;
    code: string;
    est_actif: boolean;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const rawLocations = Array.isArray(locationsData)
    ? (locationsData as Array<Record<string, unknown>>)
    : [];

  return (
    <div className="opt-locations-page">
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Emplacements et dépôts de stockage ({rawLocations.length})</h3>
            <p className="opt-card-sub">Boutique physique, ateliers de montage et entrepôts de réserve</p>
          </div>
          <button
            className="button primary"
            onClick={() => {
              setLocName("");
              setLocCode("");
              setLocType("STORE");
              setLocDefault(false);
              setCreateModalOpen(true);
            }}
            type="button"
          >
            <IconPlus height={16} width={16} /> Nouvel emplacement
          </button>
        </div>

        <div className="opt-card-body-tight">
          {rawLocations.length > 0 ? (
            <div className="opt-location-grid">
              {rawLocations.map((loc) => {
                const id = String(loc.id);
                const isDefault = Boolean(loc.est_par_defaut);
                const isActive = loc.est_actif !== false;

                return (
                  <div key={id} className="opt-location-card">
                    <div className="opt-loc-top">
                      <div className="opt-loc-icon">
                        <IconLocations height={22} width={22} />
                      </div>
                      <div className="opt-loc-meta">
                        <h4>{String(loc.nom)}</h4>
                        <span className="opt-loc-code">Code: {String(loc.code || "—")} • Type: {String(loc.type)}</span>
                      </div>
                    </div>

                    <div className="opt-loc-badges">
                      {isDefault && (
                        <span className="opt-status-pill badge-gold">
                          <IconCheck height={12} width={12} /> Emplacement principal
                        </span>
                      )}
                      <span className={`opt-status-pill ${isActive ? "badge-emerald" : "badge-rose"}`}>
                        {isActive ? "Actif" : "Désactivé"}
                      </span>
                    </div>

                    <div className="opt-loc-actions">
                      <button
                        className="button secondary small"
                        onClick={() => setEditModal({
                          id,
                          nom: String(loc.nom || ""),
                          code: String(loc.code || ""),
                          est_actif: isActive,
                        })}
                        type="button"
                      >
                        Modifier l&apos;emplacement
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconLocations height={36} width={36} />
              <h4>Aucun emplacement configuré</h4>
              <p>Créez votre premier emplacement (ex: Magasin principal) pour gérer votre inventaire.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Location */}
      {createModalOpen && (
        <div className="opt-modal-overlay" onClick={() => setCreateModalOpen(false)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Créer un emplacement de stock</h3>
                  <p className="opt-modal-sub">Définir un nouveau point de stockage physique</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setCreateModalOpen(false)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Nom de l&apos;emplacement *</span>
                <input
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Ex: Vitrine principale / Rayon Solaire"
                  required
                />
              </div>

              <div className="field">
                <span>Code court interne</span>
                <input
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder="Ex: MAG-01"
                />
              </div>

              <div className="field">
                <span>Type d&apos;espace</span>
                <select value={locType} onChange={(e) => setLocType(e.target.value)}>
                  <option value="STORE">Boutique / Rayon de vente</option>
                  <option value="ENTREPOT">Entrepôt / Arrière-boutique</option>
                  <option value="AUTRE">Atelier de montage / Autre</option>
                </select>
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={locDefault}
                  onChange={(e) => setLocDefault(e.target.checked)}
                />
                <span>Définir comme emplacement par défaut pour les réceptions</span>
              </label>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setCreateModalOpen(false)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting || !locName}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onCreateLocation({
                      nom: locName,
                      code: locCode || undefined,
                      type: locType,
                      est_par_defaut: locDefault,
                    });
                    setCreateModalOpen(false);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Création…" : "Créer l'emplacement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Location */}
      {editModal && (
        <div className="opt-modal-overlay" onClick={() => setEditModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconLocations height={18} width={18} />
                </div>
                <div>
                  <h3>Modifier l&apos;emplacement</h3>
                  <p className="opt-modal-sub">{editModal.nom}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setEditModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Nom de l&apos;emplacement</span>
                <input
                  value={editModal.nom}
                  onChange={(e) => setEditModal({ ...editModal, nom: e.target.value })}
                />
              </div>

              <div className="field">
                <span>Code interne</span>
                <input
                  value={editModal.code}
                  onChange={(e) => setEditModal({ ...editModal, code: e.target.value })}
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={editModal.est_actif}
                  onChange={(e) => setEditModal({ ...editModal, est_actif: e.target.checked })}
                />
                <span>Emplacement actif</span>
              </label>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setEditModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onUpdateLocation(editModal.id, {
                      nom: editModal.nom,
                      code: editModal.code || undefined,
                      est_actif: editModal.est_actif,
                    });
                    setEditModal(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Mise à jour…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
