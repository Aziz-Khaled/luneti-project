"use client";

import { useState } from "react";
import { formatCurrency, formatDate, getOrderStatusBadge } from "./formatters";
import {
  IconCustomers,
  IconSearch,
  IconChevronDown,
} from "../ui/Icons";

interface OpticianCustomersProps {
  customersData: unknown;
  storeId?: string;
  onLoadCustomerOrders: (customerId: string) => Promise<unknown>;
}

export function OpticianCustomers({
  customersData,
  onLoadCustomerOrders,
}: OpticianCustomersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const rawCustomers = Array.isArray(customersData)
    ? customersData
    : (customersData as Record<string, unknown>)?.data &&
      Array.isArray((customersData as Record<string, unknown>).data)
      ? ((customersData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  const filteredCustomers = rawCustomers.filter((c) => {
    const user = (c.utilisateur ?? c) as Record<string, unknown>;
    const name = `${user.prenom || ""} ${user.nom || ""}`.toLowerCase();
    const email = String(user.email || "").toLowerCase();
    return !searchTerm || name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  async function handleToggleOrders(customerId: string) {
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(null);
      setCustomerOrders([]);
      return;
    }
    setSelectedCustomerId(customerId);
    setLoadingOrders(true);
    try {
      const res = await onLoadCustomerOrders(customerId);
      const orders = Array.isArray(res)
        ? res
        : (res as Record<string, unknown>)?.data && Array.isArray((res as Record<string, unknown>).data)
          ? ((res as Record<string, unknown>).data as Array<Record<string, unknown>>)
          : [];
      setCustomerOrders(orders as Array<Record<string, unknown>>);
    } finally {
      setLoadingOrders(false);
    }
  }

  return (
    <div className="opt-customers-page">
      {/* Search Header */}
      <div className="opt-card">
        <div className="opt-filter-bar">
          <div className="opt-search-input-wrap">
            <IconSearch className="opt-search-icon" height={16} width={16} />
            <input
              className="opt-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un client par nom, prénom, email…"
            />
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Fichier clientèle du magasin ({filteredCustomers.length})</h3>
            <p className="opt-card-sub">Clients ayant commandé ou réservé un service auprès de votre boutique</p>
          </div>
        </div>

        <div className="opt-card-body-tight">
          {filteredCustomers.length > 0 ? (
            <div className="opt-customer-list">
              {filteredCustomers.map((cust) => {
                const user = (cust.utilisateur ?? cust) as Record<string, unknown>;
                const id = String(user.id || cust.id);
                const prenom = String(user.prenom || "");
                const nom = String(user.nom || "");
                const fullName = `${prenom} ${nom}`.trim() || "Client";
                const initials = (prenom[0] || "") + (nom[0] || "C");
                const isExpanded = selectedCustomerId === id;

                return (
                  <div key={id} className={`opt-customer-card ${isExpanded ? "expanded" : ""}`}>
                    <div className="opt-customer-row">
                      <div className="opt-customer-avatar">
                        {initials.toUpperCase() || "CL"}
                      </div>

                      <div className="opt-customer-info">
                        <h4 className="opt-customer-name">{fullName}</h4>
                        <div className="opt-customer-details">
                          {user.email ? <span>✉ {String(user.email)}</span> : null}
                          {user.telephone ? <span> • ☎ {String(user.telephone)}</span> : null}
                        </div>
                      </div>

                      <div className="opt-customer-actions">
                        <button
                          className="button secondary small"
                          onClick={() => handleToggleOrders(id)}
                          type="button"
                        >
                          {isExpanded ? "Masquer les commandes" : "Historique d'achats"}
                          <IconChevronDown height={14} width={14} />
                        </button>
                      </div>
                    </div>

                    {/* Customer Orders Dropdown Panel */}
                    {isExpanded && (
                      <div className="opt-customer-orders-panel">
                        <h5>Historique des commandes de {fullName}</h5>
                        {loadingOrders ? (
                          <div className="opt-loading-skeleton">Chargement des achats…</div>
                        ) : customerOrders.length > 0 ? (
                          <div className="opt-table-list">
                            {customerOrders.map((ord) => {
                              const badge = getOrderStatusBadge(ord.statut as string);
                              return (
                                <div key={ord.id as string} className="opt-table-row">
                                  <div className="opt-row-main">
                                    <div className="opt-row-title-line">
                                      <span className="opt-order-ref">#{String(ord.numero_commande || ord.id).slice(0, 8)}</span>
                                      <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                                    </div>
                                    <div className="opt-row-sub">
                                      <span>{formatDate(ord.cree_le)}</span>
                                    </div>
                                  </div>
                                  <div className="opt-row-end">
                                    <span className="opt-row-price">
                                      {formatCurrency(ord.total_general, (ord.devise as string) || "TND")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="muted opt-pad">Aucune commande enregistrée pour ce client.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconCustomers height={36} width={36} />
              <h4>Aucun client trouvé</h4>
              <p>Les clients apparaîtront ici dès leur premier achat ou rendez-vous en magasin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
