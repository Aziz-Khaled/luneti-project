"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "./formatters";
import {
  IconActivity,
  IconSearch,
  IconChevronDown,
} from "../ui/Icons";

interface ActivityRecord extends Record<string, unknown> {
  id?: string;
  action?: string;
  description?: string | null;
  acteur_id?: string | null;
  acteur_identite?: string | null;
  cree_le?: string | Date | null;
}

interface OpticianActivityProps {
  activityData: unknown;
  storeId?: string;
  filters: {
    search: string;
    actorId: string;
    action: string;
    entityType: string;
    from: string;
    to: string;
  };
  onFilterChange: (filters: {
    search: string;
    actorId: string;
    action: string;
    entityType: string;
    from: string;
    to: string;
  }) => void;
  onLoadDetails: (activityId: string) => Promise<unknown>;
}

const ACTION_LABELS: Record<string, string> = {
  "inventory.stock_created": "Article ajouté au stock",
  "inventory.reorder_threshold_changed": "Seuil d’alerte du stock modifié",
  "inventory.reception": "Stock reçu",
  "inventory.vente": "Article vendu",
  "inventory.retour": "Article retourné",
  "inventory.ajustement": "Quantité du stock ajustée",
  "inventory.endommage": "Article déclaré endommagé",
  "inventory.reserve": "Article réservé",
  "inventory.libere": "Réservation annulée",
  "inventory.transfer_out": "Article déplacé vers un autre emplacement",
  "inventory.transfer_in": "Article reçu dans un autre emplacement",
  "order.created": "Commande créée",
  "order.status_changed": "Commande mise à jour",
  "order.cancelled": "Commande annulée",
  "employee.created": "Membre ajouté à l’équipe",
  "employee.role_changed": "Rôle d’un membre modifié",
  "employee.status_changed": "Accès d’un membre modifié",
  "employee.removed": "Membre retiré de l’équipe",
  "employee.permissions_changed": "Autorisations d’un membre modifiées",
  "store.created": "Boutique créée",
  "store.profile_updated": "Informations de la boutique modifiées",
  "store.archived": "Boutique fermée",
  "listing.created": "Article ajouté à la boutique",
  "listing.published": "Article publié dans la boutique",
  "listing.updated": "Article de la boutique modifié",
  "listing.variant_created": "Option et prix ajoutés à un article",
  "listing.variant_updated": "Option d’un article modifiée",
  "listing.price_changed": "Prix d’un article modifié",
  "review.moderated": "Avis client vérifié",
};

const FIELD_LABELS: Record<string, string> = {
  quantityOnHand: "Quantité en stock",
  quantityReserved: "Quantité réservée",
  reorderThreshold: "Seuil d’alerte",
  orderNumber: "Numéro de commande",
  status: "Statut",
  role: "Rôle",
  name: "Nom",
  title: "Article",
  total: "Montant total",
  currency: "Devise",
  price: "Prix",
  available: "Disponibilité",
  quantity: "Quantité concernée",
  reference: "Référence",
  reason: "Motif",
};

const OMITTED_FIELDS = new Set([
  "slug",
  "productId",
  "userId",
  "permissions",
  "id",
  "storeId",
]);

export function OpticianActivity({
  activityData,
  filters,
  onFilterChange,
  onLoadDetails,
}: OpticianActivityProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, unknown>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState("");

  const rawActivity = Array.isArray(activityData)
    ? (activityData as ActivityRecord[])
    : activityData &&
        typeof activityData === "object" &&
        Array.isArray((activityData as Record<string, unknown>).data)
      ? ((activityData as Record<string, unknown>).data as ActivityRecord[])
      : [];

  async function toggleDetails(activityId: string) {
    if (expandedId === activityId) {
      setExpandedId(null);
      setDetailError("");
      return;
    }
    setExpandedId(activityId);
    setDetailError("");
    if (!detailCache[activityId]) {
      setLoadingId(activityId);
      try {
        const details = await onLoadDetails(activityId);
        setDetailCache((previous) => ({ ...previous, [activityId]: details }));
      } catch {
        setDetailError("Impossible de charger les changements. Réessayez.");
      } finally {
        setLoadingId(null);
      }
    }
  }

  return (
    <div className="opt-activity-page">
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Activité de la boutique</h3>
            <p className="opt-card-sub">
              Consultez les actions réalisées par l’équipe et leur date.
            </p>
          </div>
        </div>
        <div className="opt-card-body">
          <div className="opt-filter-bar">
            <div className="opt-search-input-wrap">
              <IconSearch className="opt-search-icon" height={16} width={16} />
              <input
                className="opt-search-input"
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onFilterChange({ ...filters, search: localSearch });
                  }
                }}
                placeholder="Rechercher une personne ou une action…"
                aria-label="Rechercher dans l’activité de la boutique"
              />
            </div>
            <button
              className="button primary"
              onClick={() => onFilterChange({ ...filters, search: localSearch })}
              type="button"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Actions récentes</h3>
            <p className="opt-card-sub">
              {rawActivity.length} action{rawActivity.length === 1 ? "" : "s"} sur cette page
            </p>
          </div>
        </div>

        <div className="opt-card-body-tight">
          {rawActivity.length > 0 ? (
            <div className="opt-timeline-list">
              {rawActivity.map((activity, index) => {
                const id = String(activity.id ?? `activity-${index}`);
                const savedActorName =
                  typeof activity.acteur_identite === "string" &&
                  activity.acteur_identite.trim()
                    ? activity.acteur_identite
                    : "";
                const actorName =
                  savedActorName === "Deleted user"
                    ? "Membre supprimé"
                    : savedActorName || "Équipe de la boutique";
                const action = String(activity.action ?? "");
                const actionLabel =
                  ACTION_LABELS[action] ?? humanizeAction(action);
                const isExpanded = expandedId === id;
                const details = detailCache[id];

                return (
                  <article key={id} className="opt-timeline-card">
                    <div className="opt-timeline-row">
                      <div className="opt-timeline-indicator" aria-hidden="true">
                        <IconActivity height={16} width={16} />
                      </div>
                      <div className="opt-timeline-main">
                        <div className="opt-timeline-top">
                          <span className="opt-actor-name">{actorName}</span>
                          <span className="opt-action-badge">{actionLabel}</span>
                        </div>
                        <p className="opt-timeline-desc">
                          {describeActivity(action, activity.description)}
                        </p>
                        <time className="opt-timeline-time" dateTime={String(activity.cree_le ?? "")}>
                          {formatDate(activity.cree_le)}
                        </time>
                      </div>
                      <div className="opt-timeline-end">
                        <button
                          className="button secondary small"
                          aria-expanded={isExpanded}
                          onClick={() => void toggleDetails(id)}
                          type="button"
                        >
                          {isExpanded ? "Masquer les changements" : "Voir les changements"}
                          <IconChevronDown height={12} width={12} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="opt-timeline-details-box">
                        {loadingId === id ? (
                          <p role="status">Chargement des informations…</p>
                        ) : detailError ? (
                          <p className="error-message" role="alert">{detailError}</p>
                        ) : details ? (
                          <ActivityDetails details={details} />
                        ) : (
                          <p className="muted">Aucun détail supplémentaire.</p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconActivity height={36} width={36} />
              <h4>Aucune activité pour le moment</h4>
              <p>Les actions de l’équipe apparaîtront ici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityDetails({ details }: { details: unknown }) {
  if (!details || typeof details !== "object") {
    return <p className="muted">Aucun détail supplémentaire.</p>;
  }
  const record = details as Record<string, unknown>;
  const before = toRecord(record.valeurs_precedentes);
  const after = { ...toRecord(record.nouvelles_valeurs) };
  const changes = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => FIELD_LABELS[key] && !OMITTED_FIELDS.has(key))
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      key,
      label: FIELD_LABELS[key],
      oldValue: before[key],
      newValue: after[key],
      isNew: !(key in before),
    }));
  const metadata = toRecord(record.metadonnees);
  if (metadata.quantity !== undefined && !("quantity" in after)) {
    after.quantity = metadata.quantity;
  }
  if (metadata.reference !== undefined && !("reference" in after)) {
    after.reference = metadata.reference;
  }
  const reason =
    typeof record.raison === "string" && record.raison.trim()
      ? record.raison
      : typeof metadata.note === "string"
        ? metadata.note
        : "";

  if (changes.length === 0 && !reason) {
    return <p className="muted">Aucun autre détail à afficher.</p>;
  }

  return (
    <div className="opt-activity-details">
      {changes.map((change) => (
        <div className="opt-activity-change" key={change.key}>
          <strong>{change.label}</strong>
          <span>
            {change.isNew
              ? `Valeur : ${formatAuditValue(change.key, change.newValue)}`
              : `Avant : ${formatAuditValue(change.key, change.oldValue)} · Après : ${formatAuditValue(change.key, change.newValue)}`}
          </span>
        </div>
      ))}
      {reason && (
        <p className="opt-activity-reason">
          <strong>Note :</strong> {reason}
        </p>
      )}
    </div>
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function formatAuditValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (key === "status") return translateStatus(String(value));
  if (key === "role") return translateRole(String(value));
  if (key === "total" || key === "price") return formatCurrency(value);
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return "Mis à jour";
  return String(value);
}

function translateStatus(value: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    BROUILLON: "Brouillon",
    ACTIVE: "Actif",
    ACTIF: "Actif",
    INACTIVE: "Inactif",
    INACTIF: "Inactif",
    FERME: "Fermée",
    PAYE: "Payé",
    EN_ATTENTE_PAIEMENT: "En attente de paiement",
    EN_TRAITEMENT: "En cours de traitement",
    TERMINE: "Terminée",
    ANNULE: "Annulée",
    CONFIRME: "Confirmée",
    REUSSI: "Réussi",
    ECHOUE: "Échoué",
  };
  return labels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function translateRole(value: string): string {
  const labels: Record<string, string> = {
    PROPRIETAIRE: "Propriétaire",
    GERANT: "Gérant",
    OPTICIEN: "Opticien",
    EMPLOYE: "Employé",
  };
  return labels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function describeActivity(action: string, description: unknown): string {
  const label = ACTION_LABELS[action];
  if (label) {
    const orderNumber = typeof description === "string"
      ? description.match(/\b[A-Z0-9-]{4,}\b/)?.[0]
      : undefined;
    return orderNumber && action.startsWith("order.")
      ? `${label} n° ${orderNumber}.`
      : `${label}.`;
  }
  if (typeof description === "string" && description.trim()) {
    return humanizeDescription(description);
  }
  return `${humanizeAction(action)}.`;
}

function humanizeDescription(description: string): string {
  const translations: Array<[RegExp, string]> = [
    [/^Inventory record created$/i, "Article ajouté à l’inventaire."],
    [/^Inventory reorder threshold changed$/i, "Seuil d’alerte du stock modifié."],
    [/^Stock (.+) movement recorded$/i, "Mouvement de stock enregistré."],
    [/^Stock transferred to another store location$/i, "Article déplacé vers un autre emplacement."],
    [/^Stock received from another store location$/i, "Article reçu depuis un autre emplacement."],
    [/^Order (.+) created$/i, "Commande créée."],
    [/^Order (.+) status changed$/i, "Statut de la commande mis à jour."],
    [/^Store information updated$/i, "Informations de la boutique modifiées."],
    [/^Store archived$/i, "Boutique fermée."],
    [/^Employee account created for the store$/i, "Compte d’un membre créé."],
    [/^Employee permissions changed$/i, "Autorisations d’un membre modifiées."],
    [/^Employee removed from the store$/i, "Membre retiré de l’équipe."],
    [/^Store product published$/i, "Article publié dans la boutique."],
    [/^Store product listing created$/i, "Article ajouté à la boutique."],
    [/^Store product listing updated$/i, "Article de la boutique modifié."],
    [/^Store listing price and variant created$/i, "Option et prix ajoutés à un article."],
    [/^Store product price changed$/i, "Prix d’un article modifié."],
    [/^Store listing variant updated$/i, "Option d’un article modifiée."],
    [/^Product review moderation status changed$/i, "Avis sur un produit vérifié."],
    [/^Store review moderation status changed$/i, "Avis sur la boutique vérifié."],
    [/^Store created$/i, "Boutique créée."],
    [/^Store employee membership changed$/i, "Informations d’un membre modifiées."],
    [/^Employee permissions changed$/i, "Autorisations d’un membre modifiées."],
  ];
  const match = translations.find(([pattern]) => pattern.test(description));
  return match ? match[1] : description;
}

function humanizeAction(action: string): string {
  const [area, operation] = action.split(".");
  const areaLabels: Record<string, string> = {
    inventory: "Le stock",
    store: "La boutique",
    employee: "L’équipe",
    order: "La commande",
    listing: "L’article",
    review: "L’avis client",
  };
  const operationLabels: Record<string, string> = {
    created: "a été ajouté",
    updated: "a été modifié",
    changed: "a été mis à jour",
    removed: "a été retiré",
    published: "a été publié",
    archived: "a été fermé",
    received: "a été reçu",
    reserved: "a été réservé",
  };
  const subject = areaLabels[area] ?? "Une action";
  const verb = operationLabels[operation] ?? "a été mis à jour";
  return `${subject} ${verb}.`;
}
