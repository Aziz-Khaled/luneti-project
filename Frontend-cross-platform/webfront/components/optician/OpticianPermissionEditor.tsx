"use client";

import { useMemo, useState } from "react";
import {
  type MemberPermissions,
  type PermissionCatalog,
  type PermissionDefinition,
  type PermissionPreset,
} from "../../services/employee.service";
import { Notice } from "../ui/DataView";

const CUSTOM_PRESET = "custom";

interface OpticianPermissionEditorProps {
  memberId: string;
  memberName: string;
  onLoad: () => Promise<{ catalog: PermissionCatalog; permissions: MemberPermissions }>;
  onSave: (input: { preset: string; overrides: { code: string; allowed: boolean }[] }) => Promise<MemberPermissions>;
}

export function OpticianPermissionEditor({
  memberId,
  memberName,
  onLoad,
  onSave,
}: OpticianPermissionEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [preset, setPreset] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [savedPreset, setSavedPreset] = useState("");
  const [savedSelected, setSavedSelected] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);

  const dirty = preset !== savedPreset || !sameCodes(selected, savedSelected);
  const groups = useMemo(() => {
    const result = new Map<string, PermissionDefinition[]>();
    for (const permission of catalog?.permissions ?? []) {
      const current = result.get(permission.module) ?? [];
      result.set(permission.module, [...current, permission]);
    }
    return [...result.entries()];
  }, [catalog]);

  async function openEditor() {
    setOpen(true);
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await onLoad();
      const initialPreset = result.permissions.preset ?? CUSTOM_PRESET;
      const computed = new Set(result.permissions.effectivePermissions ?? []);
      setCatalog(result.catalog);
      setPreset(initialPreset);
      setSavedPreset(initialPreset);
      setSelected([...computed].sort());
      setSavedSelected([...computed].sort());
      setUpdatedAt(result.permissions.updatedAt);
      setUpdatedBy(result.permissions.updatedBy);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les autorisations.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!catalog || !preset) return;
    if (!window.confirm(`Enregistrer les autorisations personnalisées de ${memberName} ?`)) return;
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const presetPermissions = new Set(
        preset === CUSTOM_PRESET ? [] : findPreset(catalog.presets, preset)?.permissions ?? [],
      );
      const selectedPermissions = new Set(selected);
      const overrides = catalog.permissions
        .filter((permission) => presetPermissions.has(permission.code) !== selectedPermissions.has(permission.code))
        .map((permission) => ({
          code: permission.code,
          allowed: selectedPermissions.has(permission.code),
        }));
      const updated = await onSave({ preset, overrides });
      const effective = updated.effectivePermissions ?? selected;
      const saved = [...new Set(effective)].sort();
      setSavedPreset(updated.preset ?? preset);
      setPreset(updated.preset ?? preset);
      setSelected(saved);
      setSavedSelected(saved);
      setUpdatedAt(updated.updatedAt);
      setUpdatedBy(updated.updatedBy);
      setStatus("Autorisations enregistrées.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’enregistrer les autorisations.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return <button className="button secondary small" onClick={() => void openEditor()} type="button">Autorisations</button>;
  }

  return (
    <div className="opt-modal-overlay" onClick={() => {
      if (!dirty || window.confirm("Abandonner les modifications non enregistrées ?")) setOpen(false);
    }} role="dialog" aria-modal="true" aria-labelledby={`permissions-title-${memberId}`}>
      <section className="opt-modal-card permission-editor" onClick={(event) => event.stopPropagation()}>
        <div className="opt-modal-header">
          <div>
            <h3 id={`permissions-title-${memberId}`}>Autorisations · {memberName}</h3>
            <p className="opt-modal-sub">Choisissez un préréglage puis ajustez chaque autorisation.</p>
          </div>
          <button
            className="opt-modal-close"
            onClick={() => {
              if (!dirty || window.confirm("Abandonner les modifications non enregistrées ?")) setOpen(false);
            }}
            type="button"
            aria-label="Fermer"
          >×</button>
        </div>
        <div className="opt-modal-body">
          {error && <Notice kind="error">{error}</Notice>}
          {status && <Notice kind="success">{status}</Notice>}
          {loading ? <p className="muted" role="status">Chargement du catalogue et des autorisations…</p> : catalog && (
            <>
              <div className="permission-updated" aria-live="polite">
                <span>Dernière modification par <strong>{updatedBy || "Non renseigné"}</strong></span>
                <span>Le <strong>{formatUpdatedAt(updatedAt)}</strong></span>
              </div>
              <label className="field">
                <span>Préréglage</span>
                <select
                  value={preset}
                  onChange={(event) => {
                    const nextPreset = event.target.value;
                    setPreset(nextPreset);
                    setSelected(findPreset(catalog.presets, nextPreset)?.permissions ?? []);
                  }}
                >
                  {!catalog.presets.some((item) => item.code === CUSTOM_PRESET) && (
                    <option value={CUSTOM_PRESET}>Custom</option>
                  )}
                  {catalog.presets.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
                </select>
              </label>
              <div className="permission-list">
                {groups.map(([module, permissions]) => (
                  <fieldset className="permission-group" key={module}>
                    <legend>{module}</legend>
                    {permissions.map((permission) => (
                      <label className="permission-row" key={permission.code}>
                        <span><strong>{permission.action}</strong><small>{permission.code}</small></span>
                        <input
                          className="permission-switch"
                          type="checkbox"
                          role="switch"
                          checked={selected.includes(permission.code)}
                          onChange={(event) => setSelected((current) => event.target.checked
                            ? [...current, permission.code].sort()
                            : current.filter((code) => code !== permission.code))}
                        />
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
              <p className="muted">{dirty ? "Modifications non enregistrées." : "Aucune modification en attente."}</p>
            </>
          )}
        </div>
        <div className="opt-modal-footer">
          <button
            className="button secondary"
            onClick={() => {
              if (!dirty || window.confirm("Abandonner les modifications non enregistrées ?")) setOpen(false);
            }}
            type="button"
          >Fermer</button>
          <button className="button primary" disabled={!dirty || loading || saving || !catalog} onClick={() => void save()} type="button">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </section>
    </div>
  );
}

function findPreset(presets: PermissionPreset[], code: string): PermissionPreset | undefined {
  return presets.find((item) => item.code === code);
}

function sameCodes(left: string[], right: string[]): boolean {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return "Jamais";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
