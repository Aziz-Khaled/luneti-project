"use client";

import { useRef, useState, type FormEvent } from "react";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "url" | "number" | "date" | "datetime-local" | "checkbox" | "textarea" | "select" | "file";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: string[];
  help?: string;
  accept?: string;
  upload?: {
    name: string;
    label: string;
    accept: string;
  };
}

export function Form({
  fields,
  submitLabel,
  onSubmit,
  className,
}: {
  fields: Field[];
  submitLabel: string;
  onSubmit: (values: Record<string, string | number | boolean | File>) => Promise<void>;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFailure("");
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const values: Record<string, string | number | boolean | File> = {};
    for (const field of fields) {
      if (field.type === "checkbox") {
        values[field.name] = formData.get(field.name) === "on";
        continue;
      }
      if (field.type === "file") {
        const file = formData.get(field.name);
        if (file instanceof File && file.size > 0) {
          values[field.name] = file;
        }
        continue;
      }
      if (field.upload) {
        const file = formData.get(field.upload.name);
        if (file instanceof File && file.size > 0) {
          values[field.upload.name] = file;
        }
      }
      const raw = String(formData.get(field.name) ?? "").trim();
      if (raw === "") continue;
      values[field.name] = field.type === "number" ? Number(raw) : raw;
    }
    try {
      await onSubmit(values);
      formElement.reset();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "La requête a échoué.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={`form-grid${className ? ` ${className}` : ""}`} onSubmit={submit}>
      {fields.map((field) => (
        <label className={field.type === "checkbox" ? "checkbox-field" : "field"} key={field.name}>
          {field.type === "checkbox" ? (
            <input name={field.name} type="checkbox" defaultChecked={Boolean(field.defaultValue)} />
          ) : field.type === "textarea" ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
              defaultValue={field.defaultValue === undefined ? undefined : String(field.defaultValue)}
            />
          ) : field.type === "select" ? (
            <select name={field.name} required={field.required} defaultValue={String(field.defaultValue ?? "")}>
              <option value="">Sélectionner…</option>
              {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : field.upload ? (
            <div className="form-upload-row">
              <input
                name={field.name}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                required={field.required}
                defaultValue={field.defaultValue === undefined ? undefined : String(field.defaultValue)}
              />
              <input
                ref={(element) => { fileInputs.current[field.upload!.name] = element; }}
                name={field.upload.name}
                type="file"
                accept={field.upload.accept}
                hidden
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setSelectedFiles((current) => ({
                    ...current,
                    [field.upload!.name]: file?.name ?? "",
                  }));
                }}
              />
              <button
                className="button secondary form-upload-button"
                type="button"
                onClick={() => fileInputs.current[field.upload!.name]?.click()}
              >
                {field.upload.label}
              </button>
              {selectedFiles[field.upload.name] && (
                <small className="form-upload-filename">{selectedFiles[field.upload.name]}</small>
              )}
            </div>
          ) : field.type === "file" ? (
            <input
              name={field.name}
              type="file"
              accept={field.accept}
              required={field.required}
            />
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              required={field.required}
              defaultValue={field.defaultValue === undefined ? undefined : String(field.defaultValue)}
              step={field.type === "number" ? "any" : undefined}
            />
          )}
          {field.type !== "checkbox" && <span>{field.label}{field.required ? " *" : ""}</span>}
          {field.help && <small>{field.help}</small>}
          {field.type === "checkbox" && <span>{field.label}</span>}
        </label>
      ))}
      {failure && <p className="error-message" role="alert">{failure}</p>}
      <button className="button primary" disabled={pending} type="submit">
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
