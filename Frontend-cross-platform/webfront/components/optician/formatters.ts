export function formatCurrency(
  amount: unknown,
  currency = "TND",
): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(num)) return String(amount);
  return `${num.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })} ${currency}`;
}

export function formatDate(dateInput: unknown): string {
  if (!dateInput) return "—";
  const date = new Date(String(dateInput));
  if (Number.isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(dateInput: unknown): string {
  if (!dateInput) return "—";
  const date = new Date(String(dateInput));
  if (Number.isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateInput: unknown): string {
  if (!dateInput) return "—";
  const date = new Date(String(dateInput));
  if (Number.isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function formatTimeOnly(dateInput: unknown): string {
  if (!dateInput) return "—";
  const date = new Date(String(dateInput));
  if (Number.isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateInput: unknown): string {
  if (!dateInput) return "—";
  const date = new Date(String(dateInput));
  if (Number.isNaN(date.getTime())) return String(dateInput);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return formatDateOnly(date);
}

export interface StatusBadgeConfig {
  label: string;
  className: string;
  dotColor?: string;
}

export function getOrderStatusBadge(status: string | undefined): StatusBadgeConfig {
  switch (status) {
    case "EN_ATTENTE_PAIEMENT":
      return { label: "Paiement en attente", className: "badge-amber" };
    case "PAYE":
      return { label: "Payé", className: "badge-emerald" };
    case "CONFIRME":
      return { label: "Confirmé", className: "badge-sky" };
    case "EN_TRAITEMENT":
      return { label: "En atelier / préparation", className: "badge-indigo" };
    case "PRET_A_RETIRER":
      return { label: "Prêt au retrait", className: "badge-teal" };
    case "EXPEDIE":
      return { label: "Expédié", className: "badge-blue" };
    case "TERMINE":
      return { label: "Terminé", className: "badge-slate" };
    case "ANNULE":
      return { label: "Annulé", className: "badge-rose" };
    default:
      return { label: status || "Inconnu", className: "badge-gray" };
  }
}

export function getAppointmentStatusBadge(status: string | undefined): StatusBadgeConfig {
  switch (status) {
    case "CONFIRME":
      return { label: "Confirmé", className: "badge-emerald" };
    case "REPLANIFIE":
      return { label: "Replanifié", className: "badge-amber" };
    case "TERMINE":
      return { label: "Honoré / Terminé", className: "badge-sky" };
    case "ABSENT":
      return { label: "Non présenté", className: "badge-rose" };
    case "ANNULE":
      return { label: "Annulé", className: "badge-gray" };
    default:
      return { label: status || "Programmé", className: "badge-indigo" };
  }
}

export function getMovementTypeBadge(type: string | undefined): StatusBadgeConfig {
  switch (type) {
    case "RECEPTION":
      return { label: "Livraison fournisseur (+)", className: "badge-emerald" };
    case "VENTE":
      return { label: "Vente client (-)", className: "badge-sky" };
    case "RETOUR":
      return { label: "Retour client (+)", className: "badge-amber" };
    case "AJUSTEMENT":
      return { label: "Ajustement inventaire", className: "badge-indigo" };
    case "TRANSFERT_ENTRANT":
      return { label: "Transfert entrant (+)", className: "badge-teal" };
    case "TRANSFERT_SORTANT":
      return { label: "Transfert sortant (-)", className: "badge-slate" };
    case "ENDOMMAGE":
      return { label: "Casse / Défectueux (-)", className: "badge-rose" };
    case "RESERVE":
      return { label: "Réservé commande", className: "badge-amber" };
    case "LIBERE":
      return { label: "Libéré commande", className: "badge-sky" };
    default:
      return { label: type || "Mouvement", className: "badge-gray" };
  }
}

export function getMemberRoleBadge(role: string | undefined): StatusBadgeConfig {
  switch (role) {
    case "PROPRIETAIRE":
      return { label: "Propriétaire", className: "badge-gold" };
    case "GERANT":
      return { label: "Directeur / Gérant", className: "badge-indigo" };
    case "OPTICIEN":
      return { label: "Opticien diplômé", className: "badge-sky" };
    case "EMPLOYE":
      return { label: "Collaborateur", className: "badge-slate" };
    default:
      return { label: role || "Membre", className: "badge-gray" };
  }
}

export function getPaymentStatusBadge(status: string | undefined): StatusBadgeConfig {
  switch (status) {
    case "REUSSI":
      return { label: "Payé", className: "badge-emerald" };
    case "CREE":
    case "EN_TRAITEMENT":
      return { label: "En cours", className: "badge-amber" };
    case "ACTION_REQUISE":
      return { label: "Action requise", className: "badge-amber" };
    case "REMBOURSE":
      return { label: "Remboursé", className: "badge-purple" };
    case "PARTIELLEMENT_REMBOURSE":
      return { label: "Part. remboursé", className: "badge-purple" };
    case "ECHOUE":
    case "ANNULE":
      return { label: "Échoué", className: "badge-rose" };
    default:
      return { label: status || "Inconnu", className: "badge-gray" };
  }
}
