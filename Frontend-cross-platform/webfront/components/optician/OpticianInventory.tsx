"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, getMovementTypeBadge } from "./formatters";
import {
  IconInventory,
  IconPlus,
  IconSearch,
  IconClock,
  IconX,
  IconAlertCircle,
} from "../ui/Icons";

interface OpticianInventoryProps {
  inventoryData: unknown;
  locationsData: unknown;
  locationTypesData: unknown;
  onApplyMovement: (stockId: string, input: Record<string, unknown>) => Promise<void>;
  onUpdateThreshold: (stockId: string, threshold: number) => Promise<void>;
  onCreateStock: (input: Record<string, unknown>) => Promise<void>;
  onScanReference: (image: File) => Promise<string>;
  onCreateLocation: (input: Record<string, unknown>) => Promise<unknown>;
  onUpdateLocation: (locationId: string, input: Record<string, unknown>) => Promise<unknown>;
  onCreateLocationType: (input: Record<string, unknown>) => Promise<unknown>;
  onUpdateLocationType: (typeId: string, input: Record<string, unknown>) => Promise<unknown>;
  onLoadMovements: (stockId: string) => Promise<unknown>;
}

export function OpticianInventory({
  inventoryData,
  locationsData,
  locationTypesData,
  onApplyMovement,
  onUpdateThreshold,
  onCreateStock,
  onScanReference,
  onCreateLocation,
  onUpdateLocation,
  onCreateLocationType,
  onUpdateLocationType,
  onLoadMovements,
}: OpticianInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "low" | "out">("all");

  // Movement Modal State
  const [movementModal, setMovementModal] = useState<{
    stockId: string;
    productTitle: string;
    currentQty: number;
  } | null>(null);
  const [movType, setMovType] = useState<string>("RECEPTION");
  const [movQty, setMovQty] = useState<number>(1);
  const [movRef, setMovRef] = useState<string>("");
  const [movNote, setMovNote] = useState<string>("");

  // History Drawer State
  const [historyModal, setHistoryModal] = useState<{
    stockId: string;
    productTitle: string;
    movements: Array<Record<string, unknown>>;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Stock Modal State
  const [newStockOpen, setNewStockOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [articleType, setArticleType] = useState("VERRE_VUE");
  const [lensDesign, setLensDesign] = useState("SIMPLE");
  const [lensTreatment, setLensTreatment] = useState("BLEU");
  const [rightPower, setRightPower] = useState("");
  const [leftPower, setLeftPower] = useState("");
  const [frameBrandReference, setFrameBrandReference] = useState("");
  const [referenceScanError, setReferenceScanError] = useState("");
  const [scanningReference, setScanningReference] = useState(false);
  const referenceImageInput = useRef<HTMLInputElement>(null);
  const [frameAge, setFrameAge] = useState("ADULTE");
  const [frameSex, setFrameSex] = useState("MIXTE");
  const [frameSize, setFrameSize] = useState("");
  const [newLocationOpen, setNewLocationOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationType, setNewLocationType] = useState("standard:STORE");
  const [locationOverrides, setLocationOverrides] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [newLocationError, setNewLocationError] = useState("");
  const [editingLocation, setEditingLocation] = useState<{
    id: string;
    nom: string;
    type: string;
  } | null>(null);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState("");
  const [editingTypeName, setEditingTypeName] = useState("");
  const [locationTypeOverrides, setLocationTypeOverrides] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [locationCrudError, setLocationCrudError] = useState("");
  const [initialQty, setInitialQty] = useState<number>(10);
  const [initialThreshold, setInitialThreshold] = useState<number>(3);

  // Edit threshold modal
  const [editThresholdModal, setEditThresholdModal] = useState<{
    stockId: string;
    productTitle: string;
    threshold: number;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Extract raw inventory items
  const rawItems = Array.isArray(inventoryData)
    ? inventoryData
    : (inventoryData as Record<string, unknown>)?.data &&
      Array.isArray((inventoryData as Record<string, unknown>).data)
      ? ((inventoryData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  // Extract locations
  const loadedLocations = recordsFromResponse(locationsData).filter(isActiveRecord);
  const locations = [
    ...loadedLocations.filter(
      (location) => !locationOverrides.some((override) => override.id === location.id),
    ),
    ...locationOverrides.filter(isActiveRecord),
  ];
  const loadedLocationTypes = recordsFromResponse(locationTypesData);
  const locationTypes = [
    ...loadedLocationTypes.filter(
      (type) => !locationTypeOverrides.some((override) => override.id === type.id),
    ),
    ...locationTypeOverrides,
  ];
  const activeLocationTypes = locationTypes.filter(isActiveRecord);
  const selectedLocation = locations.find((location) => location.id === selectedLocationId);
  const locationTypeValue = (location: Record<string, unknown>) => {
    const customType = location.type_personnalise as Record<string, unknown> | null;
    return customType?.id
      ? `custom:${String(customType.id)}`
      : `standard:${String(location.type || "STORE")}`;
  };
  const locationTypeInput = (value: string) =>
    value.startsWith("custom:")
      ? { type_personnalise_id: value.slice("custom:".length) }
      : { type: value.slice("standard:".length), type_personnalise_id: null };
  const isLensItem =
    articleType === "VERRE_VUE" || articleType === "VERRE_SOLEIL";
  const isStockFormValid =
    isLensItem
      ? rightPower.trim() !== "" && leftPower.trim() !== ""
      : frameBrandReference.trim() !== "" &&
        frameAge !== "" &&
        frameSex !== "" &&
        frameSize.trim() !== "";
  const saveLocationTypeOverride = (type: Record<string, unknown>) => {
    setLocationTypeOverrides((current) => [
      ...current.filter((item) => item.id !== type.id),
      type,
    ]);
  };
  const saveLocationOverride = (location: Record<string, unknown>) => {
    setLocationOverrides((current) => [
      ...current.filter((item) => item.id !== location.id),
      location,
    ]);
  };

  // Metrics
  const totalOnHand = rawItems.reduce((acc, it) => acc + Number(it.quantite_disponible ?? 0), 0);
  const totalReserved = rawItems.reduce((acc, it) => acc + Number(it.quantite_reservee ?? 0), 0);
  const lowStockItems = rawItems.filter((it) => {
    const q = Number(it.quantite_disponible ?? 0);
    const th = Number(it.seuil_reapprovisionnement ?? 0);
    return q > 0 && q <= th;
  });
  const outOfStockItems = rawItems.filter((it) => Number(it.quantite_disponible ?? 0) <= 0);

  // Filter items
  const filteredItems = rawItems.filter((it) => {
    const searchText = `${inventoryItemTitle(it)} ${String(it.marque_reference ?? "")}`.toLowerCase();
    const matchesSearch = !searchTerm || searchText.includes(searchTerm.toLowerCase());

    const qty = Number(it.quantite_disponible ?? 0);
    const threshold = Number(it.seuil_reapprovisionnement ?? 0);

    if (!matchesSearch) return false;
    if (activeTab === "low") return qty > 0 && qty <= threshold;
    if (activeTab === "out") return qty <= 0;
    return true;
  });

  async function openHistory(stockId: string, productTitle: string) {
    setLoadingHistory(true);
    setHistoryModal({ stockId, productTitle, movements: [] });
    try {
      const res = await onLoadMovements(stockId);
      const movs = Array.isArray(res)
        ? res
        : (res as Record<string, unknown>)?.data && Array.isArray((res as Record<string, unknown>).data)
          ? ((res as Record<string, unknown>).data as Array<Record<string, unknown>>)
          : [];
      setHistoryModal({ stockId, productTitle, movements: movs as Array<Record<string, unknown>> });
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className="opt-inventory-page">
      {/* KPI Stats Bar */}
      <div className="opt-kpi-grid">
        <div className="opt-kpi-card emerald-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Total en stock physique</span>
            <div className="opt-kpi-icon-bubble emerald">
              <IconInventory height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{totalOnHand} <span className="opt-kpi-unit">unités</span></div>
          <div className="opt-kpi-footer">
            <span className="opt-kpi-pill success">{rawItems.length} références gérées</span>
          </div>
        </div>

        <div className="opt-kpi-card blue-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Quantités réservées</span>
            <div className="opt-kpi-icon-bubble blue">
              <IconClock height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{totalReserved} <span className="opt-kpi-unit">unités</span></div>
          <div className="opt-kpi-footer">
            <span className="opt-kpi-pill neutral">En attente de retrait client</span>
          </div>
        </div>

        <div className="opt-kpi-card amber-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Alertes stock bas</span>
            <div className="opt-kpi-icon-bubble amber">
              <IconAlertCircle height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{lowStockItems.length}</div>
          <div className="opt-kpi-footer">
            <span className="opt-kpi-pill warning">Inférieur ou égal au seuil</span>
          </div>
        </div>

        <div className="opt-kpi-card rose-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Ruptures de stock</span>
            <div className="opt-kpi-icon-bubble rose">
              <IconX height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{outOfStockItems.length}</div>
          <div className="opt-kpi-footer">
            <span className="opt-kpi-pill danger">0 unité disponible</span>
          </div>
        </div>
      </div>

      {/* Main Stock Table Card */}
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Registre des stocks magasin</h3>
            <p className="opt-card-sub">Gestion des quantités, alertes de réapprovisionnement et traçabilité</p>
          </div>
          <button
            className="button primary"
            onClick={() => {
              if (locations.length > 0 && !selectedLocationId) {
                setSelectedLocationId(String(locations[0].id));
              }
              setNewStockOpen(true);
            }}
            type="button"
          >
            <IconPlus height={16} width={16} /> Nouveau stock article
          </button>
        </div>

        <div className="opt-card-body">
          {/* Search & Tabs */}
          <div className="opt-filter-bar">
            <div className="opt-search-input-wrap">
              <IconSearch className="opt-search-icon" height={16} width={16} />
              <input
                className="opt-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer par monture, marque, SKU..."
              />
            </div>
            <div className="opt-status-tabs">
              <button
                className={`opt-tab-pill ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
                type="button"
                aria-pressed={activeTab === "all"}
              >
                Tous ({rawItems.length})
              </button>
              <button
                className={`opt-tab-pill ${activeTab === "low" ? "active" : ""}`}
                onClick={() => setActiveTab("low")}
                type="button"
                aria-pressed={activeTab === "low"}
              >
                Stock bas ({lowStockItems.length})
              </button>
              <button
                className={`opt-tab-pill ${activeTab === "out" ? "active" : ""}`}
                onClick={() => setActiveTab("out")}
                type="button"
                aria-pressed={activeTab === "out"}
              >
                Ruptures ({outOfStockItems.length})
              </button>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="opt-table-wrap">
              <table className="opt-table opt-inventory-table">
                <thead>
                  <tr>
                    <th>Article / Monture</th>
                    <th>Emplacement</th>
                    <th>Disponible</th>
                    <th>Réservé</th>
                    <th>Seuil réappro.</th>
                    <th>État</th>
                    <th style={{ textAlign: "right" }}>Actions directes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const listingVar = (
                      item.variante_annonce ?? item.store_listing_variant
                    ) as Record<string, unknown> | undefined;
                    const loc = item.location as Record<string, unknown> | undefined;

                    const title = inventoryItemTitle(item);
                    const sku = String(
                      item.marque_reference || listingVar?.reference_magasin || "—",
                    );
                    const qty = Number(item.quantite_disponible ?? 0);
                    const reserved = Number(item.quantite_reservee ?? 0);
                    const threshold = Number(item.seuil_reapprovisionnement ?? 0);

                    const isOut = qty <= 0;
                    const isLow = !isOut && qty <= threshold;

                    return (
                      <tr key={item.id as string}>
                        <td data-label="Article / Monture">
                          <div className="opt-table-cell-title">
                            <strong>{title}</strong>
                            <span className="opt-table-cell-sub">{sku}</span>
                          </div>
                        </td>
                        <td data-label="Emplacement">
                          <span className="opt-location-chip">{String(loc?.nom || "Boutique")}</span>
                        </td>
                        <td data-label="Disponible">
                          <span className={`opt-qty-badge ${isOut ? "out" : isLow ? "low" : "ok"}`}>
                            {qty}
                          </span>
                        </td>
                        <td data-label="Réservé">
                          <span className="opt-reserved-val">{reserved}</span>
                        </td>
                        <td data-label="Seuil réappro.">
                          <button
                            className="opt-threshold-btn"
                            onClick={() => setEditThresholdModal({
                              stockId: String(item.id),
                              productTitle: title,
                              threshold,
                            })}
                            type="button"
                            title="Modifier le seuil d'alerte"
                          >
                            {threshold} ✎
                          </button>
                        </td>
                        <td data-label="État">
                          {isOut ? (
                            <span className="opt-status-pill badge-rose">Rupture</span>
                          ) : isLow ? (
                            <span className="opt-status-pill badge-amber">Alerte stock</span>
                          ) : (
                            <span className="opt-status-pill badge-emerald">Optimal</span>
                          )}
                        </td>
                        <td data-label="Actions" style={{ textAlign: "right" }}>
                          <div className="opt-row-action-group">
                            <button
                              className="button secondary small"
                              onClick={() => setMovementModal({
                                stockId: String(item.id),
                                productTitle: title,
                                currentQty: qty,
                              })}
                              type="button"
                            >
                              + Mouvement
                            </button>
                            <button
                              className="button secondary small"
                              onClick={() => openHistory(String(item.id), title)}
                              type="button"
                            >
                              Historique
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconInventory height={36} width={36} />
              <h4>Aucun article en inventaire</h4>
              <p>Ajoutez un premier article à votre inventaire magasin ci-dessus.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Record Stock Movement */}
      {movementModal && (
        <div className="opt-modal-overlay" onClick={() => setMovementModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconInventory height={18} width={18} />
                </div>
                <div>
                  <h3>Enregistrer un mouvement de stock</h3>
                  <p className="opt-modal-sub">{movementModal.productTitle}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setMovementModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="opt-stock-current-bar">
                <span>Stock physique actuel :</span>
                <strong>{movementModal.currentQty} unités</strong>
              </div>

              <div className="field">
                <span>Type d&apos;opération</span>
                <select value={movType} onChange={(e) => setMovType(e.target.value)}>
                  <option value="RECEPTION">Livraison / Réception fournisseur (+)</option>
                  <option value="VENTE">Vente directe comptoir (-)</option>
                  <option value="RETOUR">Retour / Reprise client (+)</option>
                  <option value="AJUSTEMENT">Ajustement inventaire physique</option>
                  <option value="ENDOMMAGE">Casse / Monture abîmée (-)</option>
                  <option value="TRANSFERT_ENTRANT">Transfert entrant (+)</option>
                  <option value="TRANSFERT_SORTANT">Transfert sortant (-)</option>
                </select>
              </div>

              <div className="field">
                <span>Quantité du mouvement</span>
                <input
                  type="number"
                  min={1}
                  value={movQty}
                  onChange={(e) => setMovQty(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div className="field">
                <span>Référence (n° bon de livraison, facture...)</span>
                <input
                  value={movRef}
                  onChange={(e) => setMovRef(e.target.value)}
                  placeholder="Ex: BL-2026-894"
                />
              </div>

              <div className="field">
                <span>Note interne / Remarque</span>
                <textarea
                  value={movNote}
                  onChange={(e) => setMovNote(e.target.value)}
                  placeholder="Ex: Réception commande fournisseur Luxottica."
                  rows={2}
                />
              </div>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setMovementModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onApplyMovement(movementModal.stockId, {
                      type: movType,
                      quantite: movQty,
                      reference: movRef || undefined,
                      note: movNote || undefined,
                    });
                    setMovementModal(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Application…" : "Valider le mouvement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Movement History */}
      {historyModal && (
        <div className="opt-modal-overlay" onClick={() => setHistoryModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconClock height={18} width={18} />
                </div>
                <div>
                  <h3>Historique des mouvements</h3>
                  <p className="opt-modal-sub">{historyModal.productTitle}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setHistoryModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              {loadingHistory ? (
                <div className="opt-loading-skeleton">Chargement des mouvements…</div>
              ) : historyModal.movements.length > 0 ? (
                <div className="opt-history-list">
                  {historyModal.movements.map((m, idx) => {
                    const badge = getMovementTypeBadge(m.type as string);
                    const delta = Number(m.quantite ?? 0);
                    const isPlus = ["RECEPTION", "RETOUR", "AJUSTEMENT", "TRANSFERT_ENTRANT"].includes(String(m.type));

                    return (
                      <div key={m.id as string || idx} className="opt-history-item">
                        <div className="opt-history-left">
                          <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                          <span className="opt-history-date">{formatDate(m.cree_le)}</span>
                        </div>
                        <div className="opt-history-mid">
                          <span>Évolution : {String(m.quantite_precedente ?? "—")} → {String(m.quantite_suivante ?? "—")}</span>
                          {m.note ? <p className="opt-history-note">{String(m.note)}</p> : null}
                        </div>
                        <div className="opt-history-right">
                          <span className={`opt-stock-delta ${isPlus ? "plus" : "minus"}`}>
                            {isPlus ? `+${delta}` : `-${delta}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted opt-pad">Aucun mouvement antérieur pour cet article.</p>
              )}
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setHistoryModal(null)} type="button">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Stock Creation */}
      {newStockOpen && (
        <div
          className="opt-modal-overlay"
          style={{ display: newLocationOpen || manageTypesOpen ? "none" : undefined }}
          onClick={() => setNewStockOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Ajouter un article au stock</h3>
                  <p className="opt-modal-sub">Choisissez le produit, son emplacement et sa quantité.</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setNewStockOpen(false)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Type d’article</span>
                <select
                  value={articleType}
                  onChange={(event) => setArticleType(event.target.value)}
                >
                  <option value="VERRE_VUE">Verres de vue</option>
                  <option value="VERRE_SOLEIL">Verres solaires</option>
                  <option value="MONTURE">Monture</option>
                </select>
              </div>

              {articleType === "VERRE_VUE" || articleType === "VERRE_SOLEIL" ? (
                <>
                  <div className="field">
                    <span>Type de verres</span>
                    <select
                      value={lensDesign}
                      onChange={(event) => setLensDesign(event.target.value)}
                    >
                      <option value="SIMPLE">Simple</option>
                      <option value="PROGRESSIF">Progressif</option>
                    </select>
                  </div>
                  <div className="field">
                    <span>Traitement des verres</span>
                    <select
                      value={lensTreatment}
                      onChange={(event) => setLensTreatment(event.target.value)}
                    >
                      <option value="BLEU">Filtre lumière bleue</option>
                      <option value="PHOTO">Photochromique</option>
                      <option value="PHOTO_HYBRIDE">Photochromique hybride</option>
                    </select>
                  </div>
                  <div className="field">
                    <span>Puissance œil droit (dioptries)</span>
                    <input
                      type="number"
                      step="0.25"
                      value={rightPower}
                      onChange={(event) => setRightPower(event.target.value)}
                      placeholder="Ex. : -2,00"
                    />
                  </div>
                  <div className="field">
                    <span>Puissance œil gauche (dioptries)</span>
                    <input
                      type="number"
                      step="0.25"
                      value={leftPower}
                      onChange={(event) => setLeftPower(event.target.value)}
                      placeholder="Ex. : -1,50"
                    />
                    <small>Indiquez les valeurs comme sur l’ordonnance, avec le signe + ou −.</small>
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <span>Marque ou référence de la monture</span>
                    <div className="inventory-reference-input">
                      <input
                        value={frameBrandReference}
                        onChange={(event) => setFrameBrandReference(event.target.value)}
                        maxLength={160}
                        placeholder="Ex. : RB5154 2000 49-21 140"
                      />
                      <input
                        ref={referenceImageInput}
                        hidden
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={async (event) => {
                          const image = event.target.files?.[0];
                          event.target.value = "";
                          if (!image) return;
                          setReferenceScanError("");
                          setScanningReference(true);
                          try {
                            const reference = await onScanReference(image);
                            if (!reference.trim()) {
                              throw new Error("Aucune référence lisible. Réessayez avec une photo plus nette.");
                            }
                            setFrameBrandReference(reference);
                          } catch (error) {
                            setReferenceScanError(
                              error instanceof Error
                                ? error.message
                                : "Impossible de lire la référence. Réessayez.",
                            );
                          } finally {
                            setScanningReference(false);
                          }
                        }}
                      />
                      <button
                        className="button secondary inventory-scan-button"
                        type="button"
                        disabled={scanningReference}
                        onClick={() => referenceImageInput.current?.click()}
                      >
                        {scanningReference ? "Lecture…" : "Prendre une photo"}
                      </button>
                    </div>
                    <small>Photographiez l’inscription gravée sur la branche de la monture.</small>
                    {scanningReference && (
                      <small role="status">Lecture de la référence en cours…</small>
                    )}
                    {referenceScanError && (
                      <small className="error-message" role="alert">
                        {referenceScanError}
                      </small>
                    )}
                  </div>
                  <div className="field">
                    <span>Âge</span>
                    <select
                      value={frameAge}
                      onChange={(event) => setFrameAge(event.target.value)}
                    >
                      <option value="ADULTE">Adulte</option>
                      <option value="ENFANT">Enfant</option>
                    </select>
                  </div>
                  <div className="field">
                    <span>Sexe</span>
                    <select
                      value={frameSex}
                      onChange={(event) => setFrameSex(event.target.value)}
                    >
                      <option value="MIXTE">Mixte</option>
                      <option value="FEMME">Femme</option>
                      <option value="HOMME">Homme</option>
                    </select>
                  </div>
                  <div className="field">
                    <span>Taille de la monture</span>
                    <input
                      value={frameSize}
                      onChange={(event) => setFrameSize(event.target.value)}
                      maxLength={60}
                      placeholder="Ex. : M ou 52-18"
                    />
                  </div>
                </>
              )}

              <div className="field">
                <span>Emplacement de stockage</span>
                <div className="inventory-location-select">
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    required
                  >
                    <option value="">
                      {locations.length > 0 ? "Choisir un emplacement…" : "Aucun emplacement disponible"}
                    </option>
                    {locations.map((loc) => (
                      <option key={loc.id as string} value={loc.id as string}>
                        {String(loc.nom)} — {String(
                          (loc.type_personnalise as Record<string, unknown> | null)?.nom ??
                          (loc.type === "ENTREPOT" ? "Entrepôt" : loc.type === "AUTRE" ? "Autre" : "Boutique"),
                        )}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button secondary inventory-add-location"
                    onClick={() => {
                      setNewLocationName("");
                      setNewLocationType("standard:STORE");
                      setNewLocationError("");
                      setNewLocationOpen((open) => !open);
                      setEditingLocation(null);
                    }}
                    type="button"
                    aria-label="Ajouter un emplacement"
                    title="Ajouter un emplacement"
                  >
                    <IconPlus height={16} width={16} />
                  </button>
                </div>
                {selectedLocation && !newLocationOpen && (
                  <div className="inventory-location-actions">
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => {
                        setEditingLocation({
                          id: String(selectedLocation.id),
                          nom: String(selectedLocation.nom ?? ""),
                          type: locationTypeValue(selectedLocation),
                        });
                        setNewLocationName(String(selectedLocation.nom ?? ""));
                        setNewLocationType(locationTypeValue(selectedLocation));
                        setNewLocationOpen(true);
                        setLocationCrudError("");
                      }}
                    >
                      Modifier cet emplacement
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        setLocationCrudError("");
                        try {
                          const updated = await onUpdateLocation(
                            String(selectedLocation.id),
                            { est_actif: false },
                          );
                          saveLocationOverride({
                            ...selectedLocation,
                            ...(updated && typeof updated === "object"
                              ? (updated as Record<string, unknown>)
                              : {}),
                            est_actif: false,
                          });
                          setSelectedLocationId("");
                          setEditingLocation(null);
                        } catch (reason) {
                          setLocationCrudError(reason instanceof Error ? reason.message : "Impossible de désactiver cet emplacement.");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Désactiver
                    </button>
                  </div>
                )}
                {locationCrudError && !editingLocation && (
                  <p className="error-message" role="alert">{locationCrudError}</p>
                )}
                {newLocationOpen && typeof document !== "undefined" && createPortal(
                  <div
                    className="inventory-secondary-overlay"
                    style={{ display: manageTypesOpen ? "none" : undefined }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingLocation ? "Modifier un emplacement" : "Ajouter un emplacement"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setNewLocationOpen(false);
                      setEditingLocation(null);
                    }}
                  >
                    <div className="opt-modal-card inventory-secondary-card" onClick={(event) => event.stopPropagation()}>
                    <div className="inventory-secondary-header">
                      <strong>{editingLocation ? "Modifier l’emplacement" : "Ajouter un emplacement"}</strong>
                      <button
                        className="opt-modal-close"
                        type="button"
                        aria-label="Fermer"
                        onClick={() => {
                          setNewLocationOpen(false);
                          setEditingLocation(null);
                        }}
                      >
                        <IconX height={18} width={18} />
                      </button>
                    </div>
                    <div className="field">
                      <span>Nom de l’emplacement</span>
                      <input
                        autoFocus
                        value={editingLocation?.nom ?? newLocationName}
                        onChange={(e) => {
                          if (editingLocation) {
                            setEditingLocation({ ...editingLocation, nom: e.target.value });
                          } else {
                            setNewLocationName(e.target.value);
                          }
                          setNewLocationError("");
                        }}
                        placeholder="Ex. : Magasin principal"
                        maxLength={120}
                      />
                    </div>
                    <div className="field">
                      <span>Type</span>
                      <div className="inventory-location-select">
                        <select
                          value={editingLocation?.type ?? newLocationType}
                          onChange={(e) => {
                            if (editingLocation) {
                              setEditingLocation({ ...editingLocation, type: e.target.value });
                            } else {
                              setNewLocationType(e.target.value);
                            }
                          }}
                        >
                          <option value="standard:STORE">Boutique</option>
                          <option value="standard:ENTREPOT">Entrepôt</option>
                          <option value="standard:AUTRE">Autre</option>
                          {activeLocationTypes.map((type) => (
                            <option key={String(type.id)} value={`custom:${String(type.id)}`}>
                              {String(type.nom)}
                            </option>
                          ))}
                        </select>
                        <button
                          className="button secondary inventory-add-location"
                          type="button"
                          aria-label="Ajouter un type d’emplacement"
                          title="Ajouter un type d’emplacement"
                          onClick={() => {
                            setNewTypeName("");
                            setLocationCrudError("");
                            setManageTypesOpen(true);
                          }}
                        >
                          <IconPlus height={16} width={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setManageTypesOpen((open) => !open)}
                    >
                      Gérer les types
                    </button>
                    {manageTypesOpen && typeof document !== "undefined" && createPortal(
                      <div
                        className="inventory-secondary-overlay inventory-types-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Gérer les types d’emplacement"
                        onClick={(event) => {
                          event.stopPropagation();
                          setManageTypesOpen(false);
                        }}
                      >
                      <div className="opt-modal-card inventory-secondary-card inventory-types-card" onClick={(event) => event.stopPropagation()}>
                      <div className="inventory-secondary-header">
                        <strong>Types personnalisés</strong>
                        <button
                          className="opt-modal-close"
                          type="button"
                          aria-label="Fermer"
                          onClick={() => setManageTypesOpen(false)}
                        >
                          <IconX height={18} width={18} />
                        </button>
                      </div>
                      <div className="inventory-location-type-manager">
                        <div className="field">
                          <span>Ajouter un type</span>
                          <input
                            value={newTypeName}
                            maxLength={80}
                            onChange={(event) => setNewTypeName(event.target.value)}
                            placeholder="Ex. : Vitrine"
                          />
                        </div>
                        <button
                          className="button secondary"
                          type="button"
                          disabled={submitting || !newTypeName.trim()}
                          onClick={async () => {
                            setSubmitting(true);
                            setLocationCrudError("");
                            try {
                              const created = await onCreateLocationType({ nom: newTypeName.trim() });
                              if (created && typeof created === "object" && "id" in created && typeof created.id === "string") {
                                saveLocationTypeOverride(created as Record<string, unknown>);
                                const selectedType = `custom:${created.id}`;
                                if (editingLocation) {
                                  setEditingLocation({ ...editingLocation, type: selectedType });
                                } else {
                                  setNewLocationType(selectedType);
                                }
                              }
                              setNewTypeName("");
                              setManageTypesOpen(false);
                            } catch (reason) {
                              setLocationCrudError(reason instanceof Error ? reason.message : "Impossible d’ajouter ce type.");
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          Enregistrer le type
                        </button>
                        {locationTypes.map((type) => (
                          <div className="inventory-location-type-row" key={String(type.id)}>
                            {editingTypeId === type.id ? (
                              <>
                                <input
                                  value={editingTypeName}
                                  maxLength={80}
                                  onChange={(event) => setEditingTypeName(event.target.value)}
                                />
                                <button
                                  className="button secondary"
                                  type="button"
                                  disabled={submitting || !editingTypeName.trim()}
                                  onClick={async () => {
                                    setSubmitting(true);
                                    setLocationCrudError("");
                                    try {
                                      const updated = await onUpdateLocationType(String(type.id), { nom: editingTypeName.trim() });
                                      if (updated && typeof updated === "object" && "id" in updated) {
                                        saveLocationTypeOverride(updated as Record<string, unknown>);
                                      }
                                      setEditingTypeId("");
                                    } catch (reason) {
                                      setLocationCrudError(reason instanceof Error ? reason.message : "Impossible de modifier ce type.");
                                    } finally {
                                      setSubmitting(false);
                                    }
                                  }}
                                >
                                  Enregistrer
                                </button>
                                <button className="button secondary" type="button" onClick={() => setEditingTypeId("")}>
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <span>
                                  {String(type.nom)}{type.est_actif === false ? " (désactivé)" : ""}
                                </span>
                                <button
                                  className="button secondary"
                                  type="button"
                                  onClick={() => {
                                    setEditingTypeId(String(type.id));
                                    setEditingTypeName(String(type.nom));
                                  }}
                                >
                                  Renommer
                                </button>
                                {type.est_actif !== false && (
                                  <button
                                    className="button secondary"
                                    type="button"
                                    disabled={submitting}
                                    onClick={async () => {
                                      setSubmitting(true);
                                      setLocationCrudError("");
                                      try {
                                        const updated = await onUpdateLocationType(String(type.id), { est_actif: false });
                                        if (updated && typeof updated === "object" && "id" in updated) {
                                          saveLocationTypeOverride(updated as Record<string, unknown>);
                                        }
                                      } catch (reason) {
                                        setLocationCrudError(reason instanceof Error ? reason.message : "Impossible de désactiver ce type.");
                                      } finally {
                                        setSubmitting(false);
                                      }
                                    }}
                                  >
                                    Désactiver
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                        {locationCrudError && <p className="error-message" role="alert">{locationCrudError}</p>}
                      </div>
                      </div>
                      </div>,
                      document.body,
                    )}
                    {newLocationError && (
                      <p className="error-message" role="alert">{newLocationError}</p>
                    )}
                    {locationCrudError && !manageTypesOpen && (
                      <p className="error-message" role="alert">{locationCrudError}</p>
                    )}
                    <button
                      className="button secondary"
                    disabled={submitting || !(editingLocation?.nom ?? newLocationName).trim()}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                        if (editingLocation) {
                          const input = {
                            nom: editingLocation.nom.trim(),
                            ...locationTypeInput(editingLocation.type),
                          };
                          const updated = await onUpdateLocation(editingLocation.id, input);
                          const customTypeId = input.type_personnalise_id;
                          saveLocationOverride({
                            ...selectedLocation,
                            ...input,
                            ...(updated && typeof updated === "object"
                              ? (updated as Record<string, unknown>)
                              : {}),
                            id: editingLocation.id,
                            est_actif: true,
                            type_personnalise: customTypeId
                              ? activeLocationTypes.find((type) => type.id === customTypeId) ?? null
                              : null,
                          });
                        } else {
                          const input = {
                            nom: newLocationName.trim(),
                            ...locationTypeInput(newLocationType),
                          };
                          const created = await onCreateLocation(input);
                          if (
                            created &&
                            typeof created === "object" &&
                            "id" in created &&
                            typeof created.id === "string"
                          ) {
                            const customTypeId = input.type_personnalise_id;
                            saveLocationOverride({
                              ...input,
                              ...(created as Record<string, unknown>),
                              id: created.id,
                              est_actif: true,
                              type_personnalise: customTypeId
                                ? activeLocationTypes.find((type) => type.id === customTypeId) ?? null
                                : null,
                            });
                            setSelectedLocationId(created.id);
                          }
                        }
                        setNewLocationOpen(false);
                        setEditingLocation(null);
                      } catch (reason) {
                        setNewLocationError(
                          reason instanceof Error
                            ? reason.message
                            : "Impossible d’enregistrer cet emplacement.",
                        );
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      type="button"
                    >
                      {submitting ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setNewLocationOpen(false);
                        setEditingLocation(null);
                      }}
                    >
                      Annuler
                    </button>
                    </div>
                  </div>,
                  document.body,
                )}
              </div>

              <div className="field">
                <span>Quantité de départ</span>
                <input
                  type="number"
                  min={0}
                  value={initialQty}
                  onChange={(e) => setInitialQty(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <span>Seuil de réapprovisionnement (alerte)</span>
                <input
                  type="number"
                  min={0}
                  value={initialThreshold}
                  onChange={(e) => setInitialThreshold(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setNewStockOpen(false)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting || !isStockFormValid || !selectedLocationId}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onCreateStock({
                      emplacement_id: selectedLocationId,
                      type_article: articleType,
                      ...(isLensItem
                        ? {
                            conception_verre: lensDesign,
                            traitement_verre: lensTreatment,
                            puissance_droite: Number(rightPower),
                            puissance_gauche: Number(leftPower),
                          }
                        : {
                            marque_reference: frameBrandReference.trim(),
                            age_monture: frameAge,
                            public_cible: frameSex,
                            taille_monture: frameSize.trim(),
                          }),
                      quantite_disponible: initialQty,
                      seuil_reapprovisionnement: initialThreshold,
                    });
                    setNewStockOpen(false);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Création…" : "Créer le stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Threshold */}
      {editThresholdModal && (
        <div className="opt-modal-overlay" onClick={() => setEditThresholdModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconAlertCircle height={18} width={18} />
                </div>
                <div>
                  <h3>Seuil de réapprovisionnement</h3>
                  <p className="opt-modal-sub">{editThresholdModal.productTitle}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setEditThresholdModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Quantité minimale avant alerte</span>
                <input
                  type="number"
                  min={0}
                  value={editThresholdModal.threshold}
                  onChange={(e) => setEditThresholdModal({
                    ...editThresholdModal,
                    threshold: Math.max(0, Number(e.target.value)),
                  })}
                />
                <small>Une alerte s&apos;affichera sur votre tableau de bord dès que le stock physique atteint ou descend sous ce chiffre.</small>
              </div>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setEditThresholdModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onUpdateThreshold(editThresholdModal.stockId, editThresholdModal.threshold);
                    setEditThresholdModal(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Enregistrement…" : "Enregistrer le seuil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function recordsFromResponse(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
  }
  if (!value || typeof value !== "object") return [];
  const response = value as Record<string, unknown>;
  for (const key of ["data", "items", "results"]) {
    if (Array.isArray(response[key])) {
      return recordsFromResponse(response[key]);
    }
  }
  return [];
}

function inventoryItemTitle(item: Record<string, unknown>): string {
  const type = String(item.type_article ?? "");
  const listingVariant = (
    item.variante_annonce ?? item.store_listing_variant
  ) as Record<string, unknown> | undefined;
  const listing = (
    listingVariant?.annonce ?? listingVariant?.listing
  ) as Record<string, unknown> | undefined;
  const product = listing?.produit as Record<string, unknown> | undefined;

  if (type === "VERRE_VUE" || type === "VERRE_SOLEIL") {
    const category = type === "VERRE_VUE" ? "Verres de vue" : "Verres solaires";
    const design = item.conception_verre === "PROGRESSIF" ? "Progressif" : "Simple";
    const treatments: Record<string, string> = {
      BLEU: "Filtre lumière bleue",
      PHOTO: "Photochromique",
      PHOTO_HYBRIDE: "Photochromique hybride",
    };
    return `${category} — ${design} — ${treatments[String(item.traitement_verre)] ?? "Verre"}` +
      ` — D ${String(item.puissance_droite ?? "—")} / G ${String(item.puissance_gauche ?? "—")}`;
  }

  if (type === "MONTURE") {
    const ages: Record<string, string> = {
      ADULTE: "Adulte",
      ENFANT: "Enfant",
    };
    const sexes: Record<string, string> = {
      FEMME: "Femme",
      HOMME: "Homme",
      MIXTE: "Mixte",
    };
    return `Monture — ${String(item.marque_reference ?? "Sans marque")}` +
      ` — ${ages[String(item.age_monture)] ?? ""}` +
      ` — ${sexes[String(item.public_cible)] ?? ""}` +
      ` — Taille ${String(item.taille_monture ?? "—")}`;
  }

  return String(
    listing?.titre_personnalise || product?.nom || "Article optique",
  );
}

function isActiveRecord(record: Record<string, unknown>): boolean {
  const active = record.est_actif ?? record.is_active ?? record.isActive;
  return active !== false;
}
