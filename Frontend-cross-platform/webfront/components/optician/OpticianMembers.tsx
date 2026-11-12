"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatDate, getMemberRoleBadge } from "./formatters";
import { IconMembers, IconPlus, IconX } from "../ui/Icons";
import { OpticianPermissionEditor } from "./OpticianPermissionEditor";
import {
  employeeService,
  type MemberPermissions,
  type PermissionCatalog,
  type PermissionDefinition,
  type PermissionPreset,
} from "../../services/employee.service";

type PermissionOverride = { code: string; allowed: boolean };
type EmployeeInput = {
  prenom: string;
  nom: string;
  email: string;
  temporaryPassword: string;
  role: string;
  preset: string;
  overrides: PermissionOverride[];
};

interface OpticianMembersProps {
  membersData: unknown;
  storeId?: string;
  onCreateEmployee: (input: EmployeeInput) => Promise<void>;
  onUpdateMember: (memberId: string, input: Record<string, unknown>) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onLoadPermissions: (memberId: string) => Promise<{
    catalog: PermissionCatalog;
    permissions: MemberPermissions;
  }>;
  onSavePermissions: (
    memberId: string,
    input: { preset: string; overrides: PermissionOverride[] },
  ) => Promise<MemberPermissions>;
}

interface MemberEditor {
  id: string;
  name: string;
  role: string;
  status: string;
}

export function OpticianMembers({
  membersData,
  storeId,
  onCreateEmployee,
  onUpdateMember,
  onRemoveMember,
  onLoadPermissions,
  onSavePermissions,
}: OpticianMembersProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [memberEditor, setMemberEditor] = useState<MemberEditor | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [role, setRole] = useState("EMPLOYE");
  const [preset, setPreset] = useState("read_only");
  const [presets, setPresets] = useState<PermissionPreset[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionDefinition[]>();
    for (const permission of catalog?.permissions ?? []) {
      groups.set(permission.module, [
        ...(groups.get(permission.module) ?? []),
        permission,
      ]);
    }
    return [...groups.entries()];
  }, [catalog]);

  const members = Array.isArray(membersData)
    ? membersData as Array<Record<string, unknown>>
    : isRecord(membersData) && Array.isArray(membersData.data)
      ? membersData.data as Array<Record<string, unknown>>
      : [];

  async function openCreateForm() {
    setCreateOpen(true);
    setFirstName("");
    setLastName("");
    setEmail("");
    setTemporaryPassword("");
    setRole("EMPLOYE");
    setError("");
    setLoadingCatalog(true);
    try {
      if (!storeId) throw new Error("Select a store first.");
      const result = await employeeService.catalog(storeId);
      setCatalog(result);
      setPresets(result.presets);
      const initialPreset =
        result.presets.find((item) => item.code === "read_only") ??
        result.presets[0];
      setPreset(initialPreset?.code ?? "");
      setSelectedPermissions(initialPreset?.permissions ?? []);
    } catch (reason) {
      setError(errorMessage(reason));
      setCatalog(null);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalog) return;
    setSubmitting(true);
    setError("");
    try {
      const presetPermissions = new Set(
        presets.find((item) => item.code === preset)?.permissions ?? [],
      );
      const selected = new Set(selectedPermissions);
      const overrides = catalog.permissions
        .filter((permission) =>
          presetPermissions.has(permission.code) !== selected.has(permission.code),
        )
        .map((permission) => ({
          code: permission.code,
          allowed: selected.has(permission.code),
        }));
      await onCreateEmployee({
        prenom: firstName.trim(),
        nom: lastName.trim(),
        email: email.trim(),
        temporaryPassword,
        role,
        preset,
        overrides,
      });
      setCreateOpen(false);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberEditor) return;
    setSubmitting(true);
    setError("");
    try {
      await onUpdateMember(memberEditor.id, {
        role: memberEditor.role,
        statut: memberEditor.status,
      });
      setMemberEditor(null);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="opt-members-page">
      <section className="opt-card">
        <header className="opt-card-header">
          <div>
            <h3>Équipe · {members.length}</h3>
            <p className="opt-card-sub">Comptes employés et accès à la boutique.</p>
          </div>
          <button
            className="button primary"
            onClick={() => void openCreateForm()}
            type="button"
          >
            <IconPlus height={16} width={16} /> Ajouter un employé
          </button>
        </header>

        <div className="opt-card-body-tight">
          {members.length ? (
            <div className="opt-member-grid">
              {members.map((member) => {
                const user = isRecord(member.utilisateur) ? member.utilisateur : {};
                const id = String(member.id ?? "");
                const first = String(user.prenom ?? "");
                const last = String(user.nom ?? "");
                const name = `${first} ${last}`.trim() || "Collaborateur";
                const status = String(member.statut ?? "ACTIVE");
                const memberRole = String(member.role ?? "EMPLOYE");
                const badge = getMemberRoleBadge(memberRole);
                return (
                  <article className="opt-member-card" key={id}>
                    <div className="opt-member-card-top">
                      <div className="opt-member-avatar">
                        {`${first[0] ?? ""}${last[0] ?? "M"}`.toUpperCase()}
                      </div>
                      <div className="opt-member-meta">
                        <h4>{name}</h4>
                        <span className="opt-member-email">{String(user.email ?? "")}</span>
                      </div>
                    </div>
                    <div className="opt-member-badges">
                      <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                      <span className={`opt-status-pill ${status === "ACTIVE" ? "badge-emerald" : "badge-amber"}`}>
                        {status === "ACTIVE" ? "Actif" : status === "SUSPENDU" ? "Suspendu" : "À activer"}
                      </span>
                    </div>
                    <div className="opt-member-date">
                      {member.rejoint_le ? `Depuis le ${formatDate(member.rejoint_le)}` : "Pas encore connecté"}
                    </div>
                    {memberRole !== "PROPRIETAIRE" && (
                      <div className="opt-member-actions">
                        <button
                          className="button secondary small"
                          onClick={() => {
                            setError("");
                            setMemberEditor({
                              id,
                              name,
                              role: memberRole,
                              status,
                            });
                          }}
                          type="button"
                        >
                          Gérer l’accès
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconMembers height={36} width={36} />
              <h4>Aucun employé pour le moment</h4>
              <p>Créez un compte et choisissez les accès de votre équipe.</p>
            </div>
          )}
        </div>
      </section>

      {createOpen && (
        <div className="opt-modal-overlay" onClick={() => !submitting && setCreateOpen(false)} role="presentation">
          <section
            className="opt-modal-card employee-create-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-employee-title"
          >
            <header className="opt-modal-header">
              <div>
                <h3 id="create-employee-title">Créer un compte employé</h3>
                <p className="opt-modal-sub">Le compte et ses accès sont créés immédiatement.</p>
              </div>
              <button
                className="opt-modal-close"
                onClick={() => setCreateOpen(false)}
                type="button"
                aria-label="Fermer"
              >
                <IconX height={18} width={18} />
              </button>
            </header>
            <form onSubmit={(event) => void createEmployee(event)}>
              <div className="opt-modal-body employee-create-body">
                <div className="employee-name-fields">
                  <label className="field">
                    <span>Prénom</span>
                    <input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={100} required />
                  </label>
                  <label className="field">
                    <span>Nom</span>
                    <input value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={100} required />
                  </label>
                </div>
                <label className="field">
                  <span>Email de connexion</span>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" maxLength={255} required />
                </label>
                <label className="field">
                  <span>Mot de passe temporaire</span>
                  <input
                    value={temporaryPassword}
                    onChange={(event) => setTemporaryPassword(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={1024}
                    required
                  />
                  <small>12 caractères minimum. L’employé devra le modifier à sa première connexion.</small>
                </label>
                <div className="employee-role-preset">
                  <label className="field">
                    <span>Rôle</span>
                    <select value={role} onChange={(event) => setRole(event.target.value)}>
                      <option value="EMPLOYE">Employé</option>
                      <option value="OPTICIEN">Opticien</option>
                      <option value="GERANT">Gérant</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Point de départ des accès</span>
                    <select
                      value={preset}
                      disabled={loadingCatalog || presets.length === 0}
                      onChange={(event) => {
                        const nextPreset = event.target.value;
                        setPreset(nextPreset);
                        setSelectedPermissions(
                          presets.find((item) => item.code === nextPreset)?.permissions ?? [],
                        );
                      }}
                    >
                      {presets.map((item) => (
                        <option key={item.code} value={item.code}>{presetLabel(item.code)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {loadingCatalog && <p className="muted" role="status">Chargement des accès…</p>}
                {catalog && (
                  <details className="employee-permissions-details">
                    <summary>Personnaliser les permissions</summary>
                    <div className="permission-list">
                      {permissionGroups.map(([module, permissions]) => (
                        <fieldset className="permission-group" key={module}>
                          <legend>{moduleLabel(module)}</legend>
                          {permissions.map((permission) => (
                            <label className="permission-row" key={permission.code}>
                              <span><strong>{permission.action}</strong><small>{permission.code}</small></span>
                              <input
                                className="permission-switch"
                                type="checkbox"
                                role="switch"
                                checked={selectedPermissions.includes(permission.code)}
                                onChange={(event) => setSelectedPermissions((current) =>
                                  event.target.checked
                                    ? [...current, permission.code].sort()
                                    : current.filter((code) => code !== permission.code),
                                )}
                              />
                            </label>
                          ))}
                        </fieldset>
                      ))}
                    </div>
                  </details>
                )}
                {error && <p className="error-message" role="alert">{error}</p>}
              </div>
              <footer className="opt-modal-footer">
                <button className="button secondary" onClick={() => setCreateOpen(false)} type="button">
                  Annuler
                </button>
                <button className="button primary" disabled={submitting || loadingCatalog || !catalog || !preset} type="submit">
                  {submitting ? "Création…" : "Créer le compte"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {memberEditor && (
        <div className="opt-modal-overlay" onClick={() => !submitting && setMemberEditor(null)} role="presentation">
          <section className="opt-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <header className="opt-modal-header">
              <div>
                <h3>Gérer l’accès</h3>
                <p className="opt-modal-sub">{memberEditor.name}</p>
              </div>
              <button className="opt-modal-close" onClick={() => setMemberEditor(null)} type="button" aria-label="Fermer">
                <IconX height={18} width={18} />
              </button>
            </header>
            <form onSubmit={(event) => void updateMember(event)}>
              <div className="opt-modal-body">
                <div className="employee-role-preset">
                  <label className="field">
                    <span>Rôle</span>
                    <select value={memberEditor.role} onChange={(event) => setMemberEditor({ ...memberEditor, role: event.target.value })}>
                      <option value="GERANT">Gérant</option>
                      <option value="OPTICIEN">Opticien</option>
                      <option value="EMPLOYE">Employé</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Statut</span>
                    <select value={memberEditor.status} onChange={(event) => setMemberEditor({ ...memberEditor, status: event.target.value })}>
                      <option value="ACTIVE">Actif</option>
                      <option value="SUSPENDU">Suspendu</option>
                      <option value="RETIRE">Retiré</option>
                    </select>
                  </label>
                </div>
                {error && <p className="error-message" role="alert">{error}</p>}
              </div>
              <footer className="opt-modal-footer employee-manage-footer">
                <button
                  className="button danger small"
                  disabled={submitting}
                  onClick={async () => {
                    if (!memberEditor || !window.confirm(`Retirer ${memberEditor.name} de la boutique ?`)) return;
                    setSubmitting(true);
                    setError("");
                    try {
                      await onRemoveMember(memberEditor.id);
                      setMemberEditor(null);
                    } catch (reason) {
                      setError(errorMessage(reason));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  type="button"
                >
                  Retirer
                </button>
                <div className="employee-manage-actions">
                  <OpticianPermissionEditor
                    memberId={memberEditor.id}
                    memberName={memberEditor.name}
                    onLoad={() => onLoadPermissions(memberEditor.id)}
                    onSave={(input) => onSavePermissions(memberEditor.id, input)}
                  />
                  <button className="button primary small" disabled={submitting} type="submit">
                    Enregistrer
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function presetLabel(code: string): string {
  const labels: Record<string, string> = {
    read_only: "Lecture seule",
    stock_manager: "Gestion des stocks",
    order_manager: "Gestion des commandes",
    customer_service: "Service client",
    custom: "Personnalisé",
  };
  return labels[code] ?? code;
}

function moduleLabel(module: string): string {
  const labels: Record<string, string> = {
    dashboard: "Tableau de bord",
    inventory: "Inventaire",
    orders: "Commandes",
    customers: "Clients",
    employees: "Équipe",
    transactions: "Transactions",
    shop: "Boutique",
    activity: "Activité",
    appointments: "Rendez-vous",
  };
  return labels[module] ?? module;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Une erreur est survenue.";
}
