"use client";

import { useState } from "react";
import { formatCurrency } from "./formatters";
import {
  IconCatalog,
  IconPlus,
  IconSearch,
  IconX,
  IconEyeglasses,
} from "../ui/Icons";

interface OpticianProductsProps {
  catalogData: unknown;
  listingsData: unknown;
  storeId?: string;
  resourceId?: string;
  onCreateListing: (input: Record<string, unknown>) => Promise<void>;
  onAddListingVariant: (listingId: string, input: Record<string, unknown>) => Promise<void>;
}

export function OpticianProducts({
  catalogData,
  listingsData,
  onCreateListing,
  onAddListingVariant,
}: OpticianProductsProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "catalog">("listings");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal: Create Listing from catalog item
  const [createListingModal, setCreateListingModal] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [listingTitle, setListingTitle] = useState("");
  const [listingDesc, setListingDesc] = useState("");
  const [listingStatus, setListingStatus] = useState("ACTIVE");

  // Modal: Add Priced Variant to existing listing
  const [addVariantModal, setAddVariantModal] = useState<{
    listingId: string;
    listingTitle: string;
  } | null>(null);
  const [variantCatalogId, setVariantCatalogId] = useState("");
  const [variantPrice, setVariantPrice] = useState<number>(150);
  const [variantComparePrice, setVariantComparePrice] = useState<number>(0);
  const [variantSku, setVariantSku] = useState("");
  const [variantCurrency] = useState("TND");
  const [variantAvailable, setVariantAvailable] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Extract catalog items
  const rawCatalog = Array.isArray(catalogData)
    ? catalogData
    : (catalogData as Record<string, unknown>)?.data &&
      Array.isArray((catalogData as Record<string, unknown>).data)
      ? ((catalogData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  // Extract store listings
  const rawListings = Array.isArray(listingsData)
    ? listingsData
    : (listingsData as Record<string, unknown>)?.data &&
      Array.isArray((listingsData as Record<string, unknown>).data)
      ? ((listingsData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  return (
    <div className="opt-products-page">
      {/* Top Tab Switcher */}
      <div className="opt-card">
        <div className="opt-filter-bar">
          <div className="opt-status-tabs">
            <button
              className={`opt-tab-pill ${activeTab === "listings" ? "active" : ""}`}
              onClick={() => setActiveTab("listings")}
              type="button"
            >
              Annonces de ma boutique ({rawListings.length})
            </button>
            <button
              className={`opt-tab-pill ${activeTab === "catalog" ? "active" : ""}`}
              onClick={() => setActiveTab("catalog")}
              type="button"
            >
              Catalogue général Lunetty ({rawCatalog.length})
            </button>
          </div>

          <div className="opt-search-input-wrap">
            <IconSearch className="opt-search-icon" height={16} width={16} />
            <input
              className="opt-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher monture, marque, modèle…"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Store Listings */}
      {activeTab === "listings" && (
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Annonces et tarifs de votre magasin</h3>
              <p className="opt-card-sub">Montures et verres proposés aux clients avec vos tarifs personnalisés</p>
            </div>
          </div>

          <div className="opt-card-body-tight">
            {rawListings.length > 0 ? (
              <div className="opt-listing-grid">
                {rawListings.map((listing) => {
                  const product = listing.produit as Record<string, unknown> | undefined;
                  const variants = Array.isArray(listing.variantes)
                    ? (listing.variantes as Array<Record<string, unknown>>)
                    : [];
                  const status = String(listing.statut || "ACTIVE");
                  const title = String(listing.titre_personnalise || product?.nom || "Monture");

                  return (
                    <div key={listing.id as string} className="opt-listing-card">
                      <div className="opt-listing-top">
                        <div className="opt-listing-icon">
                          <IconEyeglasses height={24} width={24} />
                        </div>
                        <div className="opt-listing-head">
                          <h4>{title}</h4>
                          <span className={`opt-status-pill ${status === "ACTIVE" ? "badge-emerald" : "badge-gray"}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      {listing.description_personnalisee ? (
                        <p className="opt-listing-desc">{String(listing.description_personnalisee)}</p>
                      ) : null}

                      {/* Variants with prices */}
                      <div className="opt-listing-variants">
                        <span className="opt-variants-title">Variantes tarifées ({variants.length})</span>
                        {variants.length > 0 ? (
                          <div className="opt-variant-pills">
                            {variants.map((v) => (
                              <div key={v.id as string} className="opt-variant-chip">
                                <span className="opt-var-sku">{String(v.reference_magasin || "Ref").slice(0, 10)}</span>
                                <span className="opt-var-price">{formatCurrency(v.prix, (v.devise as string) || "TND")}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted">Aucun tarif défini pour le moment.</p>
                        )}
                      </div>

                      <div className="opt-listing-footer">
                        <button
                          className="button secondary small"
                          onClick={() => {
                            setAddVariantModal({
                              listingId: String(listing.id),
                              listingTitle: title,
                            });
                            setVariantPrice(180);
                            setVariantComparePrice(0);
                            setVariantSku("");
                            setVariantCatalogId("");
                          }}
                          type="button"
                        >
                          <IconPlus height={12} width={12} /> Ajouter un tarif / variante
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconCatalog height={36} width={36} />
                <h4>Aucune annonce active</h4>
                <p>Consultez le catalogue général pour sélectionner des montures et créer vos annonces boutique.</p>
                <button
                  className="button primary"
                  onClick={() => setActiveTab("catalog")}
                  type="button"
                >
                  Parcourir le catalogue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Global Master Catalog */}
      {activeTab === "catalog" && (
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Catalogue général des montures & verres</h3>
              <p className="opt-card-sub">Base de données de modèles approuvés. Ajoutez-les en un clic à vos rayons.</p>
            </div>
          </div>

          <div className="opt-card-body-tight">
            {rawCatalog.length > 0 ? (
              <div className="opt-catalog-grid">
                {rawCatalog.map((prod) => {
                  const id = String(prod.id);
                  const name = String(prod.nom || prod.titre || "Monture optique");
                  const brand = String(prod.marque || "Lunetty Collection");
                  const ref = String(prod.reference || prod.sku || id.slice(0, 8));

                  return (
                    <div key={id} className="opt-catalog-item-card">
                      <div className="opt-catalog-item-badge">
                        <IconEyeglasses height={20} width={20} />
                      </div>
                      <div className="opt-catalog-item-info">
                        <span className="opt-brand-tag">{brand}</span>
                        <h4 className="opt-prod-name">{name}</h4>
                        <span className="opt-prod-ref">Réf: {ref}</span>
                      </div>
                      <div className="opt-catalog-item-action">
                        <button
                          className="button primary small full-width"
                          onClick={() => {
                            setCreateListingModal({ productId: id, productName: name });
                            setListingTitle(name);
                            setListingDesc("");
                            setListingStatus("ACTIVE");
                          }}
                          type="button"
                        >
                          <IconPlus height={14} width={14} /> Mettre en rayon
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconCatalog height={36} width={36} />
                <h4>Catalogue en cours de synchronisation</h4>
                <p>Aucun produit maître n&apos;est actuellement chargé.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Listing */}
      {createListingModal && (
        <div className="opt-modal-overlay" onClick={() => setCreateListingModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Créer une annonce boutique</h3>
                  <p className="opt-modal-sub">{createListingModal.productName}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setCreateListingModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Titre affiché dans votre boutique</span>
                <input
                  value={listingTitle}
                  onChange={(e) => setListingTitle(e.target.value)}
                  placeholder="Ex: Monture solaire aviateur polarisée"
                  required
                />
              </div>

              <div className="field">
                <span>Description ou caractéristiques en magasin</span>
                <textarea
                  value={listingDesc}
                  onChange={(e) => setListingDesc(e.target.value)}
                  placeholder="Ex: Monture légère en titane, verres anti-reflets premium."
                  rows={3}
                />
              </div>

              <div className="field">
                <span>Statut de visibilité</span>
                <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)}>
                  <option value="ACTIVE">Active (visible par les clients)</option>
                  <option value="BROUILLON">Brouillon interne</option>
                  <option value="EN_PAUSE">En pause</option>
                </select>
              </div>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setCreateListingModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onCreateListing({
                      produit_id: createListingModal.productId,
                      titre_personnalise: listingTitle,
                      description_personnalisee: listingDesc,
                      statut: listingStatus,
                    });
                    setCreateListingModal(null);
                    setActiveTab("listings");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Création…" : "Publier l'annonce"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Priced Variant */}
      {addVariantModal && (
        <div className="opt-modal-overlay" onClick={() => setAddVariantModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Ajouter une variante tarifée</h3>
                  <p className="opt-modal-sub">{addVariantModal.listingTitle}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setAddVariantModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>ID UUID de la variante catalogue maître</span>
                <input
                  value={variantCatalogId}
                  onChange={(e) => setVariantCatalogId(e.target.value)}
                  placeholder="ID de la variante maître"
                  required
                />
              </div>

              <div className="opt-row-2">
                <div className="field">
                  <span>Prix boutique ({variantCurrency}) *</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="field">
                  <span>Prix barré (comparatif)</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={variantComparePrice}
                    onChange={(e) => setVariantComparePrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="field">
                <span>Référence magasin (SKU boutique)</span>
                <input
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  placeholder="Ex: RAY-AVIATOR-GOLD-52"
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={variantAvailable}
                  onChange={(e) => setVariantAvailable(e.target.checked)}
                />
                <span>Disponible à la vente en boutique</span>
              </label>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setAddVariantModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting || !variantCatalogId}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onAddListingVariant(addVariantModal.listingId, {
                      variante_id: variantCatalogId,
                      prix: variantPrice,
                      prix_compare: variantComparePrice || undefined,
                      reference_magasin: variantSku || undefined,
                      devise: variantCurrency,
                      est_disponible: variantAvailable,
                    });
                    setAddVariantModal(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Ajout…" : "Enregistrer la variante"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
