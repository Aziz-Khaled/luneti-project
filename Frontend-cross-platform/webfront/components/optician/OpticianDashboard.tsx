"use client";

import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getOrderStatusBadge,
  getMovementTypeBadge,
} from "./formatters";
import {
  IconOrders,
  IconInventory,
  IconAppointments,
  IconTrendingUp,
  IconArrowRight,
  IconActivity,
  IconMembers,
  IconCheck,
} from "../ui/Icons";

interface OpticianDashboardProps {
  data: Record<string, unknown>;
  range: string;
  onRangeChange: (newRange: string) => void;
  customRange: { from: string; to: string };
  onCustomRangeChange: (range: { from: string; to: string }) => void;
  onApplyCustomRange: () => void;
}

export function OpticianDashboard({
  data,
  range,
  onRangeChange,
  customRange,
  onCustomRangeChange,
  onApplyCustomRange,
}: OpticianDashboardProps) {
  const dashboard = (data.dashboard ?? null) as Record<string, unknown> | null;
  const store = (data.store ?? null) as Record<string, unknown> | null;

  const financial = (dashboard?.financial ?? {}) as Record<string, unknown>;
  const grossByCurr = Array.isArray(financial.gross_revenue_by_currency)
    ? (financial.gross_revenue_by_currency as Array<{ currency: string; amount: number }>)
    : [];
  const refundsByCurr = Array.isArray(financial.refunds_by_currency)
    ? (financial.refunds_by_currency as Array<{ currency: string; amount: number }>)
    : [];
  const netByCurr = Array.isArray(financial.net_cash_flow_by_currency)
    ? (financial.net_cash_flow_by_currency as Array<{ currency: string; amount: number }>)
    : [];
  const revenuePeriods = Array.isArray(financial.revenue_periods_by_currency)
    ? (financial.revenue_periods_by_currency as Array<Record<string, unknown>>)
    : [];

  const mainCurrency = grossByCurr[0]?.currency || (store?.devise as string) || "TND";
  const totalGross = grossByCurr[0]?.amount ?? 0;
  const totalRefunds = refundsByCurr[0]?.amount ?? 0;
  const totalNet = netByCurr[0]?.amount ?? 0;

  const orders = (dashboard?.orders ?? {}) as Record<string, unknown>;
  const orderCount = Number(orders.total ?? 0);
  const pendingOrders = Number(orders.pending ?? 0);
  const processingOrders = Number(orders.processing ?? 0);
  const recentOrders = Array.isArray(orders.recent)
    ? (orders.recent as Array<Record<string, unknown>>)
    : [];

  const inventory = (dashboard?.inventory ?? {}) as Record<string, unknown>;
  const qtyOnHand = Number(inventory.quantity_on_hand ?? 0);
  const qtyReserved = Number(inventory.quantity_reserved ?? 0);
  const lowStockCount = Number(inventory.low_stock_products ?? 0);
  const outOfStockCount = Number(inventory.out_of_stock_products ?? 0);
  const recentMovements = Array.isArray(inventory.recent_movements)
    ? (inventory.recent_movements as Array<Record<string, unknown>>)
    : [];

  const employees = (dashboard?.employees ?? {}) as Record<string, unknown>;
  const totalEmployees = Number(employees.total ?? 0);
  const activeEmployees = Number(employees.active ?? 0);

  const appointments = (dashboard?.appointments ?? {}) as Record<string, unknown>;
  const appointmentCount = Number(appointments.total ?? 0);

  const recentActivity = Array.isArray(dashboard?.recent_activity)
    ? (dashboard.recent_activity as Array<Record<string, unknown>>)
    : [];

  const salesTrend = Array.isArray(dashboard?.sales_trend)
    ? (dashboard.sales_trend as Array<{ day: string; currency: string; revenue: number; refunds: number }>)
    : [];

  // Maximum value for trend chart scaling
  const maxTrend = Math.max(...salesTrend.map((t) => Number(t.revenue || 0)), 100);

  return (
    <div className="opt-dashboard-wrap">
      {/* Top Controls Bar */}
      <div className="opt-dash-header">
        <div className="opt-dash-header-title">
          <h2>Vue d&apos;ensemble de la boutique</h2>
          <p className="opt-dash-sub">
            Chiffres financiers calculés sur les paiements réels et remboursements finalisés.
          </p>
        </div>

        <div className="opt-period-selector">
          <label className="opt-period-label" htmlFor="period-select">Période :</label>
          <select
            id="period-select"
            className="opt-select"
            value={range}
            onChange={(e) => onRangeChange(e.target.value)}
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="3m">3 derniers mois</option>
            <option value="12m">12 derniers mois</option>
            <option value="custom">Période personnalisée</option>
          </select>
        </div>
      </div>

      {range === "custom" && (
        <div className="opt-custom-range-card">
          <div className="field">
            <span>Du</span>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) => onCustomRangeChange({ ...customRange, from: e.target.value })}
            />
          </div>
          <div className="field">
            <span>Au</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => onCustomRangeChange({ ...customRange, to: e.target.value })}
            />
          </div>
          <button className="button primary" onClick={onApplyCustomRange} type="button">
            Appliquer
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="opt-kpi-grid">
        {/* KPI 1: Chiffre d'affaires brut */}
        <div className="opt-kpi-card gold-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Chiffre d&apos;affaires payé</span>
            <div className="opt-kpi-icon-bubble gold">
              <IconTrendingUp height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{formatCurrency(totalGross, mainCurrency)}</div>
          <div className="opt-kpi-footer">
            <span className="opt-kpi-pill success">
              {financial.completed_transactions ? `${financial.completed_transactions} transactions` : "0 vente"}
            </span>
            <span className="opt-kpi-subtext">Période sélectionnée</span>
          </div>
        </div>

        {/* KPI 2: Flux Net */}
        <div className="opt-kpi-card blue-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Flux net de trésorerie</span>
            <div className="opt-kpi-icon-bubble blue">
              <IconCheck height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{formatCurrency(totalNet, mainCurrency)}</div>
          <div className="opt-kpi-footer">
            {totalRefunds > 0 ? (
              <span className="opt-kpi-pill danger">
                -{formatCurrency(totalRefunds, mainCurrency)} remboursés
              </span>
            ) : (
              <span className="opt-kpi-pill neutral">Aucun remboursement</span>
            )}
            <span className="opt-kpi-subtext">Après déductions</span>
          </div>
        </div>

        {/* KPI 3: Commandes à traiter */}
        <div className="opt-kpi-card purple-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Commandes du magasin</span>
            <div className="opt-kpi-icon-bubble purple">
              <IconOrders height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{orderCount}</div>
          <div className="opt-kpi-footer">
            <span className="opt-kpi-pill info">
              {pendingOrders + processingOrders} à préparer / en cours
            </span>
            <Link className="opt-kpi-link" href="/optician/orders">
              Voir tout <IconArrowRight height={12} width={12} />
            </Link>
          </div>
        </div>

        {/* KPI 4: État des Stocks */}
        <div className="opt-kpi-card emerald-accent">
          <div className="opt-kpi-top">
            <span className="opt-kpi-label">Stock en boutique</span>
            <div className="opt-kpi-icon-bubble emerald">
              <IconInventory height={18} width={18} />
            </div>
          </div>
          <div className="opt-kpi-value">{qtyOnHand} <span className="opt-kpi-unit">unités</span></div>
          <div className="opt-kpi-footer">
            {lowStockCount > 0 || outOfStockCount > 0 ? (
              <span className="opt-kpi-pill warning">
                {lowStockCount + outOfStockCount} alertes réappro.
              </span>
            ) : (
              <span className="opt-kpi-pill success">Niveaux optimaux</span>
            )}
            <span className="opt-kpi-subtext">{qtyReserved} réservées</span>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Évolution des ventes et encaissements</h3>
            <p className="opt-card-sub">Chiffre d&apos;affaires journalier encaissé par rapport aux remboursements</p>
          </div>
          <div className="opt-chart-legend">
            <span className="opt-legend-item">
              <span className="opt-legend-color blue" /> Chiffre d&apos;affaires
            </span>
            <span className="opt-legend-item">
              <span className="opt-legend-color rose" /> Remboursements
            </span>
          </div>
        </div>

        <div className="opt-card-body">
          {salesTrend.length > 0 ? (
            <div className="opt-trend-chart">
              <div className="opt-trend-bars">
                {salesTrend.map((point, idx) => {
                  const revHeight = Math.min(100, Math.max(8, (Number(point.revenue) / maxTrend) * 100));
                  const refHeight = point.refunds > 0 ? Math.min(60, Math.max(6, (Number(point.refunds) / maxTrend) * 100)) : 0;
                  return (
                    <div key={point.day || idx} className="opt-trend-bar-group" title={`${point.day}: ${formatCurrency(point.revenue, point.currency)}`}>
                      <div className="opt-bar-container">
                        <div className="opt-bar-rev" style={{ height: `${revHeight}%` }} />
                        {refHeight > 0 && <div className="opt-bar-ref" style={{ height: `${refHeight}%` }} />}
                      </div>
                      <span className="opt-bar-label">{formatDateShort(point.day)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="opt-empty-chart">
              <p className="muted">Aucune transaction enregistrée sur la période pour afficher le graphique.</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Periods Comparative Summary */}
      {revenuePeriods.length > 0 && (
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Bilan périodique consolidé</h3>
              <p className="opt-card-sub">Comparaison des encaissements sur les périodes clés</p>
            </div>
          </div>
          <div className="opt-card-body">
            <div className="opt-period-grid">
              {revenuePeriods.map((rp, i) => (
                <div key={i} className="opt-period-box">
                  <div className="opt-period-col">
                    <span className="opt-period-col-title">Aujourd&apos;hui</span>
                    <span className="opt-period-col-val">{formatCurrency(rp.today_revenue, String(rp.currency))}</span>
                    <span className="opt-period-col-sub">{formatCurrency(rp.today_refunds, String(rp.currency))} remb.</span>
                  </div>
                  <div className="opt-period-col">
                    <span className="opt-period-col-title">Cette semaine</span>
                    <span className="opt-period-col-val">{formatCurrency(rp.this_week_revenue, String(rp.currency))}</span>
                    <span className="opt-period-col-sub">{formatCurrency(rp.this_week_refunds, String(rp.currency))} remb.</span>
                  </div>
                  <div className="opt-period-col">
                    <span className="opt-period-col-title">Ce mois</span>
                    <span className="opt-period-col-val">{formatCurrency(rp.this_month_revenue, String(rp.currency))}</span>
                    <span className="opt-period-col-sub">{formatCurrency(rp.this_month_refunds, String(rp.currency))} remb.</span>
                  </div>
                  <div className="opt-period-col highlight">
                    <span className="opt-period-col-title">Année en cours</span>
                    <span className="opt-period-col-val bold">{formatCurrency(rp.this_year_revenue, String(rp.currency))}</span>
                    <span className="opt-period-col-sub">{formatCurrency(rp.this_year_refunds, String(rp.currency))} remb.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dual Column Operations Grid */}
      <div className="opt-dash-two-col">
        {/* Left Column: Recent Orders */}
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Dernières commandes</h3>
              <p className="opt-card-sub">Suivi immédiat des commandes clients</p>
            </div>
            <Link className="button secondary small" href="/optician/orders">
              Voir tout
            </Link>
          </div>
          <div className="opt-card-body-tight">
            {recentOrders.length > 0 ? (
              <div className="opt-table-list">
                {recentOrders.map((ord) => {
                  const badge = getOrderStatusBadge(ord.statut as string);
                  const user = ord.utilisateur as Record<string, unknown> | undefined;
                  const clientName = user ? `${user.prenom || ""} ${user.nom || ""}`.trim() : "Client";
                  return (
                    <div key={ord.id as string} className="opt-table-row">
                      <div className="opt-row-main">
                        <div className="opt-row-title-line">
                          <span className="opt-order-ref">#{String(ord.numero_commande || ord.id).slice(0, 8)}</span>
                          <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                        </div>
                        <div className="opt-row-sub">
                          <span>{clientName || "Client invité"}</span> • <span>{formatDate(ord.cree_le)}</span>
                        </div>
                      </div>
                      <div className="opt-row-end">
                        <span className="opt-row-price">{formatCurrency(ord.total_general, (ord.devise as string) || mainCurrency)}</span>
                        <Link className="button secondary small" href={`/optician/orders/${ord.id}`}>
                          Détails
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconOrders height={28} width={28} />
                <p>Aucune commande récente enregistrée.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inventory Movements & Critical Stock */}
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Mouvements de stock récents</h3>
              <p className="opt-card-sub">Traçabilité des flux de marchandises</p>
            </div>
            <Link className="button secondary small" href="/optician/inventory">
              Inventaire
            </Link>
          </div>
          <div className="opt-card-body-tight">
            {recentMovements.length > 0 ? (
              <div className="opt-table-list">
                {recentMovements.map((mov) => {
                  const badge = getMovementTypeBadge(mov.type as string);
                  const stockObj = mov.stock as Record<string, unknown> | undefined;
                  const variante = stockObj?.variante_annonce as Record<string, unknown> | undefined;
                  const annonce = variante?.annonce as Record<string, unknown> | undefined;
                  const produit = annonce?.produit as Record<string, unknown> | undefined;
                  const productName = (produit?.nom as string) || "Article optique";
                  const delta = Number(mov.quantite ?? 0);
                  const isPlus = ["RECEPTION", "RETOUR", "AJUSTEMENT", "TRANSFERT_ENTRANT"].includes(String(mov.type));

                  return (
                    <div key={mov.id as string} className="opt-table-row">
                      <div className="opt-row-main">
                        <div className="opt-row-title-line">
                          <span className="opt-item-name">{productName}</span>
                          <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                        </div>
                        <div className="opt-row-sub">
                          <span>Stock: {String(mov.quantite_precedente ?? "—")} → {String(mov.quantite_suivante ?? "—")}</span>
                          <span> • {formatDate(mov.cree_le)}</span>
                        </div>
                      </div>
                      <div className="opt-row-end">
                        <span className={`opt-stock-delta ${isPlus ? "plus" : "minus"}`}>
                          {isPlus ? `+${delta}` : `-${delta}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconInventory height={28} width={28} />
                <p>Aucun mouvement de stock récent.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Triple Row: Activities, Appointments, Team */}
      <div className="opt-dash-three-col">
        {/* Activity feed */}
        <div className="opt-card">
          <div className="opt-card-header">
            <div className="opt-title-with-icon">
              <IconActivity height={18} width={18} />
              <h4>Journal d&apos;activité</h4>
            </div>
            <Link className="opt-card-link" href="/optician/activity">
              Historique
            </Link>
          </div>
          <div className="opt-card-body-tight">
            {recentActivity.length > 0 ? (
              <div className="opt-mini-feed">
                {recentActivity.slice(0, 5).map((act) => {
                  const ident = act.acteur_identite as Record<string, unknown> | undefined;
                  const actorName = ident ? `${ident.prenom || ""} ${ident.nom || ""}`.trim() : "Système";
                  return (
                    <div key={act.id as string} className="opt-feed-item">
                      <div className="opt-feed-dot" />
                      <div className="opt-feed-content">
                        <p className="opt-feed-text">
                          <strong>{actorName}</strong>: {String(act.description || act.action)}
                        </p>
                        <span className="opt-feed-time">{formatDate(act.cree_le)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted opt-pad">Aucune activité enregistrée sur cette période.</p>
            )}
          </div>
        </div>

        {/* Appointments Summary */}
        <div className="opt-card">
          <div className="opt-card-header">
            <div className="opt-title-with-icon">
              <IconAppointments height={18} width={18} />
              <h4>Rendez-vous clients</h4>
            </div>
            <Link className="opt-card-link" href="/optician/appointments">
              Agenda
            </Link>
          </div>
          <div className="opt-card-body">
            <div className="opt-stat-highlight">
              <span className="opt-stat-number">{appointmentCount}</span>
              <span className="opt-stat-label">Rendez-vous programmés</span>
            </div>
            <p className="opt-stat-desc">
              Examens de vue, essais et ajustements de montures.
            </p>
            <Link className="button secondary small full-width" href="/optician/appointments">
              Gérer l&apos;agenda des rendez-vous
            </Link>
          </div>
        </div>

        {/* Team & Members */}
        <div className="opt-card">
          <div className="opt-card-header">
            <div className="opt-title-with-icon">
              <IconMembers height={18} width={18} />
              <h4>Équipe & Collaborateurs</h4>
            </div>
            <Link className="opt-card-link" href="/optician/members">
              Équipe
            </Link>
          </div>
          <div className="opt-card-body">
            <div className="opt-stat-highlight">
              <span className="opt-stat-number">{activeEmployees}</span>
              <span className="opt-stat-label">Membres actifs</span>
            </div>
            <div className="opt-team-meta">
              <span>Total : {totalEmployees}</span>
            </div>
            <Link className="button secondary small full-width" href="/optician/members">
              Gérer l’équipe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
