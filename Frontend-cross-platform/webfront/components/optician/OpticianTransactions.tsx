"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, getPaymentStatusBadge } from "./formatters";
import {
  IconTransactions,
  IconSearch,
} from "../ui/Icons";

interface OpticianTransactionsProps {
  transactionsData: unknown;
  storeId?: string;
  filters: {
    search: string;
    status: string;
    provider: string;
    from: string;
    to: string;
  };
  onFilterChange: (filters: {
    search: string;
    status: string;
    provider: string;
    from: string;
    to: string;
  }) => void;
}

export function OpticianTransactions({
  transactionsData,
  filters,
  onFilterChange,
}: OpticianTransactionsProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const rawTx = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as Record<string, unknown>)?.data &&
      Array.isArray((transactionsData as Record<string, unknown>).data)
      ? ((transactionsData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  const providers = ["", "STRIPE", "PAYPAL", "FLOUCI", "KONNECT", "AUTRE"];
  const statuses = [
    { value: "", label: "Tous les statuts" },
    { value: "REUSSI", label: "Réussi / Encaissé" },
    { value: "EN_TRAITEMENT", label: "En cours" },
    { value: "REMBOURSE", label: "Remboursé" },
    { value: "PARTIELLEMENT_REMBOURSE", label: "Part. remboursé" },
    { value: "ECHOUE", label: "Échoué" },
  ];

  return (
    <div className="opt-transactions-page">
      {/* Filter Bar */}
      <div className="opt-card">
        <div className="opt-filter-bar">
          <div className="opt-search-input-wrap">
            <IconSearch className="opt-search-icon" height={16} width={16} />
            <input
              className="opt-search-input"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Rechercher par référence, n° commande, client…"
            />
          </div>

          <div className="opt-filter-selects">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.provider}
              onChange={(e) => onFilterChange({ ...filters, provider: e.target.value })}
            >
              <option value="">Tous les prestataires</option>
              {providers.filter(Boolean).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              className="button primary"
              onClick={() => onFilterChange({ ...filters, search: localSearch })}
              type="button"
            >
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Journal des transactions financières ({rawTx.length})</h3>
            <p className="opt-card-sub">Enregistrements réels des paiements et remboursements bancaires / en ligne</p>
          </div>
        </div>

        <div className="opt-card-body-tight">
          {rawTx.length > 0 ? (
            <div className="opt-table-wrap">
              <table className="opt-table">
                <thead>
                  <tr>
                    <th>Réf. Transaction</th>
                    <th>Commande associée</th>
                    <th>Client</th>
                    <th>Montant payé</th>
                    <th>Prestataire</th>
                    <th>Statut</th>
                    <th>Date d&apos;encaissement</th>
                  </tr>
                </thead>
                <tbody>
                  {rawTx.map((tx) => {
                    const badge = getPaymentStatusBadge(tx.statut as string);
                    const order = (tx.order ?? tx.commande ?? {}) as Record<string, unknown>;
                    const client = (order.client ?? order.utilisateur ?? {}) as Record<string, unknown>;
                    const clientName = `${client.prenom || ""} ${client.nom || ""}`.trim() || "Client";
                    const orderId = String(order.id || tx.order_id || "");

                    return (
                      <tr key={tx.id as string}>
                        <td>
                          <span className="opt-tx-ref">{String(tx.reference || tx.id).slice(0, 14)}</span>
                        </td>
                        <td>
                          {orderId ? (
                            <Link className="opt-order-link" href={`/optician/orders/${orderId}`}>
                              #{String(order.numero_commande || orderId).slice(0, 8)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <div className="opt-table-client">
                            <span>{clientName}</span>
                            {client.email ? <small>{String(client.email)}</small> : null}
                          </div>
                        </td>
                        <td>
                          <strong className="opt-tx-amount">
                            {formatCurrency(tx.montant, (tx.devise as string) || "TND")}
                          </strong>
                        </td>
                        <td>
                          <span className="opt-provider-tag">{String(tx.fournisseur || tx.methode || "Carte")}</span>
                        </td>
                        <td>
                          <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td>
                          <span className="opt-tx-date">{formatDate(tx.paye_le || tx.cree_le)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconTransactions height={36} width={36} />
              <h4>Aucune transaction trouvée</h4>
              <p>Les transactions validées par les plateformes de paiement apparaîtront ici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
