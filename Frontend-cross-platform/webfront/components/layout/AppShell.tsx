"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useAuth, type Portal } from "../../contexts/AuthContext";
import {
  employeeService,
  type EmployeeStore,
} from "../../services/employee.service";
import {
  IconDashboard,
  IconOrders,
  IconInventory,
  IconAppointments,
  IconCatalog,
  IconStore,
  IconLocations,
  IconCustomers,
  IconMembers,
  IconProfile,
  IconTransactions,
  IconActivity,
  IconSettings,
  IconEyeglasses,
  IconSparkles,
  IconX,
  IconChevronRight,
} from "../ui/Icons";

const opticianNavGroups = [
  {
    title: "VUE D'ENSEMBLE",
    links: [
      { href: "dashboard", label: "Tableau de bord", icon: IconDashboard },
    ],
  },
  {
    title: "VENTES & SERVICE",
    links: [
      { href: "orders", label: "Commandes", icon: IconOrders },
      { href: "appointments", label: "Rendez-vous", icon: IconAppointments },
      { href: "customers", label: "Clients", icon: IconCustomers },
    ],
  },
  {
    title: "STOCK & CATALOGUE",
    links: [
      { href: "inventory", label: "Inventaire & Stocks", icon: IconInventory },
      { href: "locations", label: "Emplacements", icon: IconLocations },
      { href: "products", label: "Catalogue & Tarifs", icon: IconCatalog },
    ],
  },
  {
    title: "BOUTIQUE & ÉQUIPE",
    links: [
      { href: "store", label: "Ma Boutique", icon: IconStore },
      { href: "members", label: "Collaborateurs", icon: IconMembers },
      { href: "profile", label: "Profil Opticien", icon: IconProfile },
    ],
  },
  {
    title: "ADMINISTRATION",
    links: [
      { href: "transactions", label: "Transactions", icon: IconTransactions },
      { href: "activity", label: "Journal d'audit", icon: IconActivity },
      { href: "settings", label: "Configuration", icon: IconSettings },
    ],
  },
];

const MOBILE_SIDEBAR_QUERY = "(max-width: 900px)";

function subscribeToSidebarBreakpoint(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSidebarBreakpointSnapshot() {
  return window.matchMedia(MOBILE_SIDEBAR_QUERY).matches;
}

export function AppShell({
  portal,
  children,
  employeeLinks = [],
  employeeStores = [],
  onEmployeeStoreChange,
}: {
  portal: Portal;
  children: ReactNode;
  employeeLinks?: { href: string; label: string }[];
  employeeStores?: EmployeeStore[];
  onEmployeeStoreChange?: (storeId: string) => void;
}) {
  const { user, logout, storeId, setStoreId } = useAuth();
  const pathname = usePathname();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useSyncExternalStore(
    subscribeToSidebarBreakpoint,
    getSidebarBreakpointSnapshot,
    () => false,
  );
  const [opticianStores, setOpticianStores] = useState<EmployeeStore[]>([]);
  const [storeLoadError, setStoreLoadError] = useState("");
  const isSidebarCollapsed = isMobile ? !sidebarCollapsed : sidebarCollapsed;

  useEffect(() => {
    let isMounted = true;
    if (portal !== "optician" || !user) {
      return () => {
        isMounted = false;
      };
    }
    employeeService
      .me()
      .then(({ stores }) => {
        if (!isMounted) return;
        const memberships = Array.isArray(stores) ? stores : [];
        setOpticianStores(memberships);
        setStoreLoadError("");
        if (!memberships.some((membership) => membership.storeId === storeId)) {
          setStoreId(memberships[0]?.storeId ?? "");
        }
      })
      .catch((reason: unknown) => {
        if (!isMounted) return;
        setStoreLoadError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger vos boutiques.",
        );
      });
    return () => {
      isMounted = false;
    };
  }, [portal, setStoreId, storeId, user]);

  const userInitials = (user?.prenom?.[0] || "") + (user?.nom?.[0] || "U");
  const availableStores =
    portal === "employee" ? employeeStores : opticianStores;
  const activeStore = availableStores.find(
    (membership) => membership.storeId === storeId,
  );

  return (
    <div className={`app-shell opt-shell${isSidebarCollapsed ? " sidebar-collapsed" : " sidebar-expanded"}`}>
      {/* Sidebar */}
      <aside className="sidebar opt-sidebar">
        {/* Brand */}
        <div className="opt-sidebar-brand-block">
          <Link className="opt-brand-wrap" href={`/${portal}/dashboard`}>
            <div className="opt-logo-icon">
              <IconEyeglasses height={22} width={22} />
            </div>
            <div>
              <span className="brand opt-brand-text">Lunetty</span>
              <span className="opt-brand-eyebrow">{portal === "optician" ? "ATELIER OPTIQUE" : "PORTAIL EMPLOYÉ"}</span>
            </div>
          </Link>
          <button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
            className="opt-sidebar-toggle"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            title={isSidebarCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
            type="button"
          >
            <IconChevronRight height={18} width={18} />
          </button>
        </div>

        {(portal === "optician" || portal === "employee") && (
          <label className="field opt-store-widget">
            <span className="opt-store-widget-label">BOUTIQUE ACTIVE</span>
            <select
              aria-label="Boutique active"
              value={activeStore?.storeId ?? ""}
              onChange={(event) => {
                if (portal === "employee") {
                  onEmployeeStoreChange?.(event.target.value);
                } else {
                  setStoreId(event.target.value);
                }
              }}
              disabled={availableStores.length < 2}
            >
              {availableStores.length === 0 ? (
                <option value="">Aucune boutique associée</option>
              ) : (
                availableStores.map((membership) => (
                  <option
                    key={membership.membershipId}
                    value={membership.storeId}
                  >
                    {membership.store.nom}
                  </option>
                ))
              )}
            </select>
            {portal === "optician" && storeLoadError && (
              <span className="opt-store-load-error" role="alert">
                {storeLoadError}
              </span>
            )}
            {portal === "optician" && !storeLoadError && (
              <Link className="opt-store-create-link" href="/optician/setup">
                {availableStores.length === 0 ? "Créer une boutique" : "Ajouter une boutique"}
              </Link>
              )}
          </label>
        )}

        {/* Navigation Links */}
        <nav className="side-nav opt-nav" aria-label={`${portal} navigation`}>
          {portal === "optician" ? (
            opticianNavGroups.map((group) => (
              <div key={group.title} className="opt-nav-group">
                <span className="opt-nav-group-title">{group.title}</span>
                {group.links.map((link) => {
                  const target = `/optician/${link.href}`;
                  const isActive = pathname === target || pathname.startsWith(`${target}/`);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      className={`opt-nav-link ${isActive ? "active" : ""}`}
                      href={target}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={link.label}
                      title={link.label}
                      onClick={() => {
                        if (isMobile) setSidebarCollapsed(false);
                      }}
                    >
                      <Icon className="opt-nav-icon" height={18} width={18} />
                      <span className="opt-nav-label">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))
          ) : portal === "employee" ? (
            <div className="opt-nav-group">
              <span className="opt-nav-group-title">MON ESPACE</span>
              {employeeLinks.map((link) => {
                const target = `/employee/${link.href}`;
                const isActive = pathname === target || pathname.startsWith(`${target}/`);
                return (
                  <Link
                    key={link.href}
                    className={`opt-nav-link ${isActive ? "active" : ""}`}
                    href={target}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={link.label}
                    title={link.label}
                    onClick={() => {
                      if (isMobile) setSidebarCollapsed(false);
                    }}
                  >
                    <span aria-hidden="true" className="opt-nav-icon opt-nav-fallback">{link.label.charAt(0)}</span>
                    <span className="opt-nav-label">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>

        {/* Sidebar Footer User & Actions */}
        <div className="sidebar-actions opt-sidebar-footer">
          <div className="opt-user-profile-card">
            <div className="opt-user-avatar">{userInitials.toUpperCase() || "ME"}</div>
            <div className="opt-user-info">
              <span className="opt-user-name">{user?.prenom} {user?.nom}</span>
              <span className="opt-user-role">
                {portal === "optician" ? "Opticien / Gérant" : "Employé"}
              </span>
            </div>
          </div>

          <div className="opt-footer-controls">
            <button
              className="button secondary full-width opt-logout-btn"
              onClick={logout}
              type="button"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="main-content opt-main">
        {/* Sticky top action strip for Optician */}
        {portal === "optician" && (
          <div className="opt-top-bar">
            <div className="opt-top-bar-left">
              {activeStore ? (
                <div className="opt-store-badge-chip">
                  <span className="opt-store-pill-dot" />
                  <span className="opt-store-pill-name">{activeStore.store.nom}</span>
                </div>
              ) : (
                <div className="opt-store-alert-chip">
                  <span>{storeLoadError || "Aucune boutique associée"}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {portal === "employee" && (
          <div className="opt-top-bar">
            <div className="opt-top-bar-left">
              <div className="opt-store-badge-chip">
                <span className="opt-store-pill-dot" />
                <span className="opt-store-pill-name">{activeStore?.store.nom ?? "Espace employé"}</span>
              </div>
            </div>
          </div>
        )}

        {children}
      </main>
      {portal === "optician" && (
        <aside className="chatbot-placeholder" aria-label="Assistant boutique">
          <section
            className={`chatbot-panel opt-chatbot-card${chatbotOpen ? " chatbot-panel-open" : ""}`}
            aria-label="Conversation avec l’assistant Lunetty"
            aria-hidden={!chatbotOpen}
            inert={!chatbotOpen}
            role="dialog"
          >
            <div className="opt-chatbot-head">
              <div className="opt-icon-bubble gold">
                <IconSparkles height={18} width={18} />
              </div>
              <div className="opt-chatbot-title">
                <h3>Assistant Opticien Lunetty</h3>
                <p className="opt-chatbot-sub">Votre assistant boutique</p>
              </div>
              <button
                className="opt-chatbot-close"
                onClick={() => setChatbotOpen(false)}
                type="button"
                aria-label="Fermer l’assistant"
                tabIndex={chatbotOpen ? 0 : -1}
              >
                <IconX height={18} width={18} />
              </button>
            </div>
            <div className="opt-chatbot-body">
              <span className="opt-chatbot-coming-soon">Bientôt disponible</span>
              <p className="opt-chatbot-message">
                L’assistant boutique arrive prochainement. La conversation n’est pas encore activée.
              </p>
            </div>
            <div className="opt-chatbot-composer">
              <input
                aria-label="Message"
                disabled
                placeholder="Conversation bientôt disponible"
                tabIndex={chatbotOpen ? 0 : -1}
              />
              <button type="button" disabled aria-label="Envoyer le message">
                <IconSparkles height={16} width={16} />
              </button>
            </div>
          </section>
          <button
            className="chatbot-trigger opt-chatbot-btn"
            onClick={() => setChatbotOpen((open) => !open)}
            type="button"
            aria-label={chatbotOpen ? "Fermer l’assistant boutique" : "Ouvrir l’assistant boutique"}
            aria-expanded={chatbotOpen}
            title={chatbotOpen ? "Fermer l’assistant" : "Assistant Boutique"}
          >
            {chatbotOpen ? <IconX height={23} width={23} /> : <IconSparkles height={23} width={23} />}
          </button>
        </aside>
      )}
    </div>
  );
}
