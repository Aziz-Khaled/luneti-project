"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { backofficeService } from "../../services/backoffice.service";
import {
  employeeService,
  type EmployeeStore,
  type PermissionCatalog,
} from "../../services/employee.service";
import { inventoryService } from "../../services/inventory.service";
import { storesService } from "../../services/stores.service";
import { usersService } from "../../services/users.service";
import { AppShell } from "../layout/AppShell";
import { DataView, Notice, Panel } from "../ui/DataView";

type EmployeeSection = "dashboard" | "inventory" | "orders" | "customers" | "activity" | "profile";
type DataRecord = Record<string, unknown>;
const EMPTY_PERMISSIONS: string[] = [];
const requiredSectionPermissions: Partial<Record<EmployeeSection, string>> = {
  dashboard: "dashboard.view",
  inventory: "inventory.view",
  orders: "orders.view",
  customers: "customers.view",
};

const sectionLabels: Record<EmployeeSection, string> = {
  dashboard: "Tableau de bord",
  inventory: "Inventaire",
  orders: "Commandes",
  customers: "Clients",
  activity: "Mon activité",
  profile: "Mon profil",
};

export function EmployeePortalPage({ section }: { section: string }) {
  const { user, loading: authLoading, storeId, setStoreId } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<EmployeeStore[]>([]);
  const [catalogResult, setCatalogResult] = useState<{
    storeId: string;
    catalog: PermissionCatalog;
    error: string;
  } | null>(null);
  const [record, setRecord] = useState<DataRecord>({});
  const [loadingStores, setLoadingStores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let active = true;
    employeeService.me()
      .then(({ stores: memberships }) => {
        if (!active) return;
        const validStores = Array.isArray(memberships) ? memberships : [];
        setStores(validStores);
        if (!validStores.some((membership) => membership.storeId === storeId)) {
          setStoreId(validStores[0]?.storeId ?? "");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoadingStores(false);
      });
    return () => { active = false; };
  }, [authLoading, setStoreId, storeId, user, router]);

  const activeStore = stores.find((membership) => membership.storeId === storeId) ?? stores[0];
  const selectedStoreId = activeStore?.storeId;
  const currentCatalog =
    catalogResult && catalogResult.storeId === selectedStoreId
      ? catalogResult.catalog
      : null;
  const catalogError =
    catalogResult && catalogResult.storeId === selectedStoreId
      ? catalogResult.error
      : "";

  useEffect(() => {
    if (!selectedStoreId) return;
    let active = true;
    employeeService.catalog(selectedStoreId)
      .then((result) => {
        if (active) setCatalogResult({ storeId: selectedStoreId, catalog: result, error: "" });
      })
      .catch((reason: unknown) => {
        if (active) {
          setCatalogResult({
            storeId: selectedStoreId,
            catalog: { permissions: [], presets: [] },
            error: errorMessage(reason),
          });
        }
      });
    return () => { active = false; };
  }, [selectedStoreId]);

  const grantedPermissions = activeStore?.permissions ?? EMPTY_PERMISSIONS;
  const links = buildEmployeeLinks(grantedPermissions);
  const hasAccess = links.some((link) => link.href === section);
  const hasFinanceAccess = grantedPermissions.includes("dashboard.view_financials");
  const canViewAllActivity = grantedPermissions.includes("activity.view_all");

  useEffect(() => {
      if (!selectedStoreId || !hasAccess) return;
      let active = true;
      const timer = window.setTimeout(() => {
        void (async () => {
          setLoading(true);
          setError("");
          try {
            let result: unknown;
            switch (section as EmployeeSection) {
              case "dashboard":
                result = await storesService.dashboard(selectedStoreId);
                if (!hasFinanceAccess) result = withoutFinancialData(result);
                break;
              case "inventory":
                result = await inventoryService.list(selectedStoreId);
                break;
              case "orders":
                result = await backofficeService.orders(selectedStoreId);
                break;
              case "customers":
                result = await storesService.customers(selectedStoreId);
                break;
              case "activity":
                result = await backofficeService.activity(
                  selectedStoreId,
                  1,
                  canViewAllActivity ? {} : { actorId: user?.id },
                );
                break;
              case "profile":
                result = await usersService.me();
                break;
            }
            if (active) setRecord({ value: result });
          } catch (reason) {
            if (active) {
              setError(errorMessage(reason));
              setRecord({});
            }
          } finally {
            if (active) setLoading(false);
          }
        })();
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
  }, [canViewAllActivity, hasAccess, hasFinanceAccess, refreshIndex, section, selectedStoreId, user?.id]);

  const currentSection = section as EmployeeSection;
  const title = hasAccess ? sectionLabels[currentSection] : "Accès indisponible";

  if (authLoading || !user || loadingStores) {
    return <main className="center-page"><p>Chargement de votre espace employé…</p></main>;
  }

  return (
    <AppShell
      portal="employee"
      employeeLinks={links}
      employeeStores={stores}
      onEmployeeStoreChange={(storeId) => {
        setStoreId(storeId);
        router.replace("/employee/dashboard");
      }}
    >
      <header className="page-header">
        <div>
          <p className="eyebrow">Portail employé · {activeStore?.store.nom ?? "Lunetty"}</p>
          <h1>{title}</h1>
        </div>
        {hasAccess && (
          <button className="button secondary" onClick={() => setRefreshIndex((value) => value + 1)} disabled={loading} type="button">
            {loading ? "Chargement…" : "Rafraîchir"}
          </button>
        )}
      </header>

      {error && <Notice kind="error">{error}</Notice>}
      {!activeStore ? (
        <Panel title="Aucune boutique associée">
          <p className="muted">Votre compte ne dispose actuellement d’aucune appartenance employé active.</p>
        </Panel>
      ) : !currentCatalog && !catalogError ? (
        <p className="muted" role="status">Chargement des autorisations de la boutique…</p>
      ) : catalogError && section !== "profile" ? (
        <Panel title="Autorisations indisponibles">
          <Notice kind="error">{catalogError}</Notice>
          <p className="muted">La navigation et les données de l’espace employé restent fermées tant que le catalogue d’autorisations ne peut pas être chargé.</p>
        </Panel>
      ) : !hasAccess ? (
        <Panel title="Cette page n’est pas disponible">
          <p className="muted">Aucune autorisation effective ne permet d’ouvrir cette section pour la boutique active.</p>
        </Panel>
      ) : (
        <div className="content-grid">
          <Panel
            title={title}
            description={section === "activity"
              ? "Événements attribués à votre compte dans la boutique active."
              : "Données chargées depuis l’API de la boutique active."}
          >
            {loading ? <p className="muted" role="status">Chargement…</p> : <DataView value={record.value} />}
          </Panel>
          <Panel title="Autorisations effectives">
            <p className="muted">Les actions disponibles dans ce portail sont limitées aux autorisations renvoyées par l’API. L’API reste la frontière de sécurité.</p>
            <ul className="employee-permissions">
              {grantedPermissions.map((permission) => <li key={permission}>{permission}</li>)}
            </ul>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

function buildEmployeeLinks(grantedPermissions: string[]): { href: EmployeeSection; label: string }[] {
  const granted = new Set(grantedPermissions);
  const visible = (Object.keys(sectionLabels) as EmployeeSection[]).filter((section) => {
    if (section === "profile") return true;
    if (section === "activity") {
      return granted.has("activity.view_own") || granted.has("activity.view_all");
    }
    const requiredPermission = requiredSectionPermissions[section];
    return requiredPermission !== undefined && granted.has(requiredPermission);
  });

  return visible
    .map((key) => ({ href: key, label: sectionLabels[key] }));
}

function withoutFinancialData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutFinancialData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !/finance|revenue|refund|cash|transaction|sales/i.test(key))
      .map(([key, child]) => [key, withoutFinancialData(child)]),
  );
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Impossible de charger les données du portail employé.";
}
