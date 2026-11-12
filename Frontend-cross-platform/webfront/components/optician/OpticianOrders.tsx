"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, getOrderStatusBadge } from "./formatters";
import {
  IconOrders,
  IconSearch,
  IconClock,
  IconX,
  IconArrowRight,
} from "../ui/Icons";

interface OpticianOrdersProps {
  ordersData: unknown;
  orderDetailData?: unknown;
  resourceId?: string;
  storeId?: string;
  filters: {
    search: string;
    status: string;
    from: string;
    to: string;
  };
  onFilterChange: (filters: { search: string; status: string; from: string; to: string }) => void;
  onUpdateStatus: (orderId: string, status: string, note?: string) => Promise<void>;
}

export function OpticianOrders({
  ordersData,
  orderDetailData,
  resourceId,
  filters,
  onFilterChange,
  onUpdateStatus,
}: OpticianOrdersProps) {
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [targetOrderRef, setTargetOrderRef] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<string>("EN_TRAITEMENT");
  const [targetNote, setTargetNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // If viewing a single order detail
  if (resourceId && orderDetailData) {
    const detail = (orderDetailData ?? {}) as Record<string, unknown>;
    const client = (detail.client ?? detail.utilisateur ?? {}) as Record<string, unknown>;
    const rawArticles = detail.articles ?? detail.lignes;
    const articles: Array<Record<string, unknown>> = Array.isArray(rawArticles)
      ? (rawArticles as Array<Record<string, unknown>>)
      : [];
    const paiements = Array.isArray(detail.paiements)
      ? (detail.paiements as Array<Record<string, unknown>>)
      : [];
    const badge = getOrderStatusBadge(detail.statut as string);
    const currency = (detail.devise as string) || "TND";

    const nextStatusOptions: Array<{ value: string; label: string; primary?: boolean }> = [];
    const current = detail.statut as string;
    if (current === "EN_ATTENTE_PAIEMENT" || current === "PAYE") {
      nextStatusOptions.push({ value: "CONFIRME", label: "Confirmer la commande", primary: true });
      nextStatusOptions.push({ value: "ANNULE", label: "Annuler" });
    } else if (current === "CONFIRME") {
      nextStatusOptions.push({ value: "EN_TRAITEMENT", label: "Passer en préparation atelier", primary: true });
      nextStatusOptions.push({ value: "ANNULE", label: "Annuler" });
    } else if (current === "EN_TRAITEMENT") {
      nextStatusOptions.push({ value: "PRET_A_RETIRER", label: "Prêt au retrait en boutique", primary: true });
      nextStatusOptions.push({ value: "EXPEDIE", label: "Expédier au client" });
      nextStatusOptions.push({ value: "ANNULE", label: "Annuler" });
    } else if (current === "PRET_A_RETIRER" || current === "EXPEDIE") {
      nextStatusOptions.push({ value: "TERMINE", label: "Remis au client (Finaliser)", primary: true });
    }

    return (
      <div className="opt-order-detail-wrap">
        <div className="opt-detail-top-nav">
          <Link className="opt-back-link" href="/optician/orders">
            ← Retour à la liste des commandes
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="opt-card highlight-border">
          <div className="opt-detail-header-flex">
            <div>
              <div className="opt-tag-row">
                <span className="opt-eyebrow-dark">COMMANDE CLIENT</span>
                <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
              </div>
              <h2 className="opt-detail-title">
                Commande #{String(detail.numero_commande || detail.id)}
              </h2>
              <p className="opt-detail-date">Passée le {formatDate(detail.cree_le)}</p>
            </div>

            {nextStatusOptions.length > 0 && (
              <div className="opt-detail-action-buttons">
                {nextStatusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`button ${opt.primary ? "primary" : "secondary"}`}
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        await onUpdateStatus(resourceId, opt.value, `Passé à ${opt.value} depuis la vue détaillée`);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    type="button"
                  >
                    {submitting ? "Mise à jour…" : opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="opt-detail-two-col">
          {/* Left Column: Order Items & Pricing Breakdown */}
          <div className="opt-card">
            <div className="opt-card-header">
              <h3>Articles de la commande ({articles.length})</h3>
            </div>
            <div className="opt-card-body-tight">
              {articles.length > 0 ? (
                <div className="opt-items-table">
                  {articles.map((art, idx) => {
                    const price = Number(art.prix_unitaire ?? 0);
                    const qty = Number(art.quantite ?? 1);
                    return (
                      <div key={art.id as string || idx} className="opt-item-row">
                        <div className="opt-item-avatar">
                          <IconOrders height={18} width={18} />
                        </div>
                        <div className="opt-item-info">
                          <div className="opt-item-name">{String(art.titre_produit || art.nom || "Monture / Verres")}</div>
                          <div className="opt-item-sku">SKU: {String(art.reference_variante || "—")} • Qté: {qty}</div>
                        </div>
                        <div className="opt-item-price">
                          <div className="opt-item-total">{formatCurrency(price * qty, currency)}</div>
                          <div className="opt-item-unit">{formatCurrency(price, currency)} / u.</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted opt-pad">Aucun article détaillé disponible.</p>
              )}

              {/* Financial Totals */}
              <div className="opt-totals-box">
                <div className="opt-totals-row">
                  <span>Sous-total articles</span>
                  <span>{formatCurrency(detail.total_articles, currency)}</span>
                </div>
                {Number(detail.total_remise ?? 0) > 0 && (
                  <div className="opt-totals-row discount">
                    <span>Remise</span>
                    <span>-{formatCurrency(detail.total_remise, currency)}</span>
                  </div>
                )}
                {Number(detail.frais_livraison ?? 0) > 0 && (
                  <div className="opt-totals-row">
                    <span>Frais de livraison</span>
                    <span>{formatCurrency(detail.frais_livraison, currency)}</span>
                  </div>
                )}
                <div className="opt-totals-row grand-total">
                  <span>Total général</span>
                  <span>{formatCurrency(detail.total_general, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Info & Payments */}
          <div className="opt-col-stack">
            {/* Customer Box */}
            <div className="opt-card">
              <div className="opt-card-header">
                <h3>Coordonnées du client</h3>
              </div>
              <div className="opt-card-body">
                <div className="opt-cust-name">
                  {String(client.prenom || "")} {String(client.nom || "")}
                </div>
                <div className="opt-cust-meta">
                  {client.email ? <p>✉ {String(client.email)}</p> : null}
                  {client.telephone ? <p>☎ {String(client.telephone)}</p> : null}
                </div>
              </div>
            </div>

            {/* Payment Record Box */}
            <div className="opt-card">
              <div className="opt-card-header">
                <h3>Règlement & Paiements</h3>
              </div>
              <div className="opt-card-body">
                {paiements.length > 0 ? (
                  paiements.map((p, idx) => (
                    <div key={p.id as string || idx} className="opt-pay-item">
                      <div className="opt-pay-top">
                        <span className="opt-pay-prov">{String(p.fournisseur || "PAIEMENT")}</span>
                        <span className="opt-pay-amount">{formatCurrency(p.montant, String(p.devise || currency))}</span>
                      </div>
                      <div className="opt-pay-sub">
                        <span>Statut : {String(p.statut)}</span>
                        {p.paye_le ? <span> • Payé le {formatDate(p.paye_le)}</span> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">Paiement au comptoir ou en attente d&apos;encaissement.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Orders List
  const rawList = Array.isArray(ordersData)
    ? ordersData
    : (ordersData as Record<string, unknown>)?.data && Array.isArray((ordersData as Record<string, unknown>).data)
      ? ((ordersData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  const statusTabs = [
    { value: "", label: "Toutes" },
    { value: "EN_ATTENTE_PAIEMENT", label: "En attente" },
    { value: "CONFIRME", label: "Confirmées" },
    { value: "EN_TRAITEMENT", label: "En préparation" },
    { value: "PRET_A_RETIRER", label: "Prêtes au retrait" },
    { value: "TERMINE", label: "Terminées" },
    { value: "ANNULE", label: "Annulées" },
  ];

  return (
    <div className="opt-orders-page">
      {/* Top Filter and Search Bar */}
      <div className="opt-card">
        <div className="opt-filter-bar">
          <div className="opt-search-input-wrap">
            <IconSearch className="opt-search-icon" height={16} width={16} />
            <input
              className="opt-search-input"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onFilterChange({ ...filters, search: localSearch });
                }
              }}
              placeholder="Rechercher par n° de commande, client, email…"
            />
            {localSearch && (
              <button
                className="opt-search-clear"
                onClick={() => {
                  setLocalSearch("");
                  onFilterChange({ ...filters, search: "" });
                }}
                type="button"
              >
                <IconX height={14} width={14} />
              </button>
            )}
          </div>

          <button
            className="button primary"
            onClick={() => onFilterChange({ ...filters, search: localSearch })}
            type="button"
          >
            Filtrer
          </button>
        </div>

        {/* Quick Status Chips */}
        <div className="opt-status-tabs">
          {statusTabs.map((tab) => {
            const active = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                className={`opt-tab-pill ${active ? "active" : ""}`}
                onClick={() => onFilterChange({ ...filters, status: tab.value })}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Commandes de la boutique ({rawList.length})</h3>
            <p className="opt-card-sub">Suivi des commandes passées auprès de votre magasin</p>
          </div>
        </div>

        <div className="opt-card-body-tight">
          {rawList.length > 0 ? (
            <div className="opt-order-grid">
              {rawList.map((ord) => {
                const badge = getOrderStatusBadge(ord.statut as string);
                const client = (ord.utilisateur ?? ord.client ?? {}) as Record<string, unknown>;
                const clientName = client ? `${client.prenom || ""} ${client.nom || ""}`.trim() : "Client invité";
                const total = formatCurrency(ord.total_general, (ord.devise as string) || "TND");

                return (
                  <div key={ord.id as string} className="opt-order-card">
                    <div className="opt-order-card-header">
                      <div>
                        <span className="opt-order-ref">
                          Commande #{String(ord.numero_commande || ord.id).slice(0, 10)}
                        </span>
                        <div className="opt-order-date">{formatDate(ord.cree_le)}</div>
                      </div>
                      <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                    </div>

                    <div className="opt-order-card-body">
                      <div className="opt-order-client-line">
                        <span className="opt-client-name">{clientName || "Client"}</span>
                        {client.email ? <span className="opt-client-email">{String(client.email)}</span> : null}
                      </div>

                      <div className="opt-order-card-pricing">
                        <span className="opt-total-label">Montant total</span>
                        <span className="opt-total-val">{total}</span>
                      </div>
                    </div>

                    <div className="opt-order-card-actions">
                      <button
                        className="button secondary small"
                        onClick={() => {
                          setModalOrderId(ord.id as string);
                          setTargetOrderRef(String(ord.numero_commande || ord.id));
                          setTargetStatus(String(ord.statut || "EN_TRAITEMENT"));
                          setTargetNote("");
                        }}
                        type="button"
                      >
                        Changer statut
                      </button>
                      <Link className="button primary small" href={`/optician/orders/${ord.id}`}>
                        Voir détails <IconArrowRight height={12} width={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconOrders height={36} width={36} />
              <h4>Aucune commande trouvée</h4>
              <p>Aucune commande ne correspond aux filtres de recherche actuels.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Quick Update Order Status */}
      {modalOrderId && (
        <div className="opt-modal-overlay" onClick={() => setModalOrderId(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconClock height={18} width={18} />
                </div>
                <div>
                  <h3>Modifier le statut de la commande</h3>
                  <p className="opt-modal-sub">Commande #{targetOrderRef.slice(0, 12)}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setModalOrderId(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Nouveau statut de la commande</span>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                >
                  <option value="CONFIRME">Confirmé</option>
                  <option value="EN_TRAITEMENT">En préparation atelier</option>
                  <option value="PRET_A_RETIRER">Prêt au retrait en magasin</option>
                  <option value="EXPEDIE">Expédié au client</option>
                  <option value="TERMINE">Terminé / Livré</option>
                  <option value="ANNULE">Annulé</option>
                </select>
                <small>Seules les transitions de flux valides sont autorisées par le serveur.</small>
              </div>

              <div className="field">
                <span>Note ou motif de transition (facultatif)</span>
                <textarea
                  value={targetNote}
                  onChange={(e) => setTargetNote(e.target.value)}
                  placeholder="Ex: Verres montés et contrôlés, monture prête pour essayage client."
                  rows={2}
                />
              </div>
            </div>

            <div className="opt-modal-footer">
              <button
                className="button secondary"
                onClick={() => setModalOrderId(null)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onUpdateStatus(modalOrderId, targetStatus, targetNote);
                    setModalOrderId(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Enregistrement…" : "Confirmer le statut"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
