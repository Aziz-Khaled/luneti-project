"use client";

import { useState } from "react";
import { formatDate, getAppointmentStatusBadge } from "./formatters";
import {
  IconAppointments,
  IconClock,
  IconCheck,
  IconSearch,
} from "../ui/Icons";

interface OpticianAppointmentsProps {
  appointmentsData: unknown;
  storeId?: string;
  onUpdateStatus: (appointmentId: string, status: string) => Promise<void>;
}

export function OpticianAppointments({
  appointmentsData,
  onUpdateStatus,
}: OpticianAppointmentsProps) {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const rawAppointments = Array.isArray(appointmentsData)
    ? appointmentsData
    : (appointmentsData as Record<string, unknown>)?.data &&
      Array.isArray((appointmentsData as Record<string, unknown>).data)
      ? ((appointmentsData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

  const filteredAppointments = rawAppointments.filter((apt) => {
    const client = (apt.client ?? apt.utilisateur ?? {}) as Record<string, unknown>;
    const clientName = `${client.prenom || ""} ${client.nom || ""}`.toLowerCase();
    const motive = String(apt.motif || apt.type || "").toLowerCase();
    const matchesSearch = !searchTerm || clientName.includes(searchTerm.toLowerCase()) || motive.includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || apt.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(appointmentId: string, nextStatus: string) {
    setSubmittingId(appointmentId);
    try {
      await onUpdateStatus(appointmentId, nextStatus);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="opt-appointments-page">
      {/* Search and Filters */}
      <div className="opt-card">
        <div className="opt-filter-bar">
          <div className="opt-search-input-wrap">
            <IconSearch className="opt-search-icon" height={16} width={16} />
            <input
              className="opt-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom de client, motif de rendez-vous…"
            />
          </div>

          <div className="opt-status-tabs">
            <button
              className={`opt-tab-pill ${!filterStatus ? "active" : ""}`}
              onClick={() => setFilterStatus("")}
              type="button"
            >
              Tous ({rawAppointments.length})
            </button>
            <button
              className={`opt-tab-pill ${filterStatus === "CONFIRME" ? "active" : ""}`}
              onClick={() => setFilterStatus("CONFIRME")}
              type="button"
            >
              Confirmés
            </button>
            <button
              className={`opt-tab-pill ${filterStatus === "TERMINE" ? "active" : ""}`}
              onClick={() => setFilterStatus("TERMINE")}
              type="button"
            >
              Honorés / Terminés
            </button>
            <button
              className={`opt-tab-pill ${filterStatus === "ABSENT" ? "active" : ""}`}
              onClick={() => setFilterStatus("ABSENT")}
              type="button"
            >
              Absents
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Cards Grid */}
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Agenda des rendez-vous en magasin ({filteredAppointments.length})</h3>
            <p className="opt-card-sub">Examens de la vue, bilans visuels, essais et réglages de montures</p>
          </div>
        </div>

        <div className="opt-card-body-tight">
          {filteredAppointments.length > 0 ? (
            <div className="opt-appointment-grid">
              {filteredAppointments.map((apt) => {
                const id = String(apt.id);
                const badge = getAppointmentStatusBadge(apt.statut as string);
                const client = (apt.client ?? apt.utilisateur ?? {}) as Record<string, unknown>;
                const clientName = `${client.prenom || ""} ${client.nom || ""}`.trim() || "Client invité";
                const isPending = submittingId === id;

                return (
                  <div key={id} className="opt-appointment-card">
                    <div className="opt-appointment-top">
                      <div className="opt-time-chip">
                        <IconClock height={14} width={14} />
                        <span>{formatDate(apt.date_heure ?? apt.cree_le)}</span>
                      </div>
                      <span className={`opt-status-pill ${badge.className}`}>{badge.label}</span>
                    </div>

                    <div className="opt-appointment-body">
                      <h4 className="opt-appointment-client">{clientName}</h4>
                      <div className="opt-appointment-meta">
                        {client.telephone ? <span>☎ {String(client.telephone)}</span> : null}
                        {client.email ? <span>✉ {String(client.email)}</span> : null}
                      </div>

                      <div className="opt-appointment-motive">
                        <strong>Motif :</strong> {String(apt.motif || apt.type || "Examen de vue & Essais")}
                      </div>

                      {apt.notes ? (
                        <p className="opt-appointment-notes">&ldquo;{String(apt.notes)}&rdquo;</p>
                      ) : null}
                    </div>

                    <div className="opt-appointment-actions">
                      {apt.statut !== "CONFIRME" && apt.statut !== "TERMINE" && (
                        <button
                          className="button primary small"
                          disabled={isPending}
                          onClick={() => handleStatusChange(id, "CONFIRME")}
                          type="button"
                        >
                          <IconCheck height={12} width={12} /> Confirmer
                        </button>
                      )}
                      {apt.statut !== "TERMINE" && (
                        <button
                          className="button secondary small"
                          disabled={isPending}
                          onClick={() => handleStatusChange(id, "TERMINE")}
                          type="button"
                        >
                          Marquer Honoré
                        </button>
                      )}
                      {apt.statut !== "ABSENT" && apt.statut !== "TERMINE" && (
                        <button
                          className="button secondary small"
                          disabled={isPending}
                          onClick={() => handleStatusChange(id, "ABSENT")}
                          type="button"
                        >
                          Absent
                        </button>
                      )}
                      {apt.statut !== "ANNULE" && apt.statut !== "TERMINE" && (
                        <button
                          className="button danger small"
                          disabled={isPending}
                          onClick={() => {
                            if (window.confirm("Annuler ce rendez-vous ?")) {
                              handleStatusChange(id, "ANNULE");
                            }
                          }}
                          type="button"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opt-empty-state">
              <IconAppointments height={36} width={36} />
              <h4>Aucun rendez-vous planifié</h4>
              <p>Les clients peuvent réserver des créneaux directement depuis la page de votre boutique.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
