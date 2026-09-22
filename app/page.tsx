"use client";

import React, { useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

type WarningRow = {
  row: number;
  reason: string;
  details?: string;
};

type ImportReport = {
  sections: number;
  items: number;
  comments: number;
  warningCount: number;
  warningRows: WarningRow[];
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [importReport, setImportReport] =
    useState<ImportReport | null>(null);

  const [templates, setTemplates] = useState<Template[]>([]);

  const [duplicatingId, setDuplicatingId] =
    useState<string | null>(null);

  const [showWarnings, setShowWarnings] = useState(false);

  // --------------------------------------------------
  // LOAD SAVED TEMPLATES
  // --------------------------------------------------

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setError(null);

      const res = await fetch("/api/templates", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Could not load templates"
        );
      }

      setTemplates(data.templates || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not load templates";

      setError(message);
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // --------------------------------------------------
  // IMPORT EXCEL FILE
  // --------------------------------------------------

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setImportReport(null);
    setShowWarnings(false);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      setSuccessMessage(
        data.message || "Template imported successfully!"
      );

      setImportReport({
        sections: data.imported?.sections ?? 0,
        items: data.imported?.items ?? 0,
        comments: data.imported?.comments ?? 0,
        warningCount: data.warnings?.count ?? 0,
        warningRows: data.warnings?.rows ?? [],
      });

      await loadTemplates();

      e.target.value = "";
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Upload failed";

      setError(message);
      setImportReport(null);

      e.target.value = "";
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // OPEN TEMPLATE EDITOR
  // --------------------------------------------------

  const handleEdit = (templateId: string) => {
    window.location.href = `/templates/${templateId}`;
  };

  // --------------------------------------------------
  // DUPLICATE TEMPLATE
  // --------------------------------------------------

  const handleDuplicate = async (
    template: Template
  ) => {
    if (duplicatingId) return;

    const confirmed = window.confirm(
      `Do you want to duplicate "${template.name}"?`
    );

    if (!confirmed) return;

    try {
      setDuplicatingId(template.id);
      setError(null);
      setSuccessMessage(null);
      setImportReport(null);
      setShowWarnings(false);

      const res = await fetch(
        `/api/templates/${template.id}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Failed to duplicate template"
        );
      }

      setSuccessMessage(
        `"${template.name}" duplicated successfully!`
      );

      await loadTemplates();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to duplicate template";

      setError(message);
    } finally {
      setDuplicatingId(null);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1>
        Hive Inspect — Spectora Template Importer & Editor
      </h1>

      <p>
        Upload Spectora .xls/.xlsx exports, edit template
        content, and duplicate templates independently.
      </p>

      {/* IMPORT AREA */}

      <div
        style={{
          border: "2px dashed #ccc",
          padding: "30px",
          textAlign: "center",
          borderRadius: "8px",
          margin: "20px 0",
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          style={{
            display: "none",
          }}
          id="file-upload"
        />

        <label
          htmlFor="file-upload"
          style={{
            cursor: loading
              ? "not-allowed"
              : "pointer",
            color: "#0070f3",
            fontWeight: "bold",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? "Uploading & Parsing..."
            : "+ Import Spectora File (.xls / .xlsx)"}
        </label>
      </div>

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div
          style={{
            background: "#e8f5e9",
            color: "#2e7d32",
            padding: "12px",
            border: "1px solid #2e7d32",
            borderRadius: "6px",
            marginBottom: "12px",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* IMPORT REPORT */}

      {importReport && (
        <div
          style={{
            border: "1px solid #777",
            padding: "16px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Import Report
          </h3>

          <p>
            <strong>Sections:</strong>{" "}
            {importReport.sections}
            {" | "}
            <strong>Items:</strong>{" "}
            {importReport.items}
            {" | "}
            <strong>Comments:</strong>{" "}
            {importReport.comments}
          </p>

          {importReport.warningCount === 0 ? (
            <div
              style={{
                background: "#e8f5e9",
                border: "1px solid #81c784",
                borderRadius: "6px",
                padding: "12px",
                color: "#1b5e20",
              }}
            >
              No import warnings.
            </div>
          ) : (
            <div
              style={{
                background: "#fff8e1",
                border: "1px solid #f9a825",
                borderRadius: "6px",
                padding: "12px",
              }}
            >
              <p
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  color: "#7a5600",
                }}
              >
                <strong>
                  {importReport.warningCount} import warning(s)
                </strong>
              </p>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  color: "#5f4b00",
                }}
              >
                Some spreadsheet information is not stored
                separately by the current data model. The template
                was still imported successfully. You can review the
                affected rows below.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowWarnings((current) => !current)
                }
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#111",
                  background: "#ffffff",
                  border: "1px solid #777",
                  borderRadius: "5px",
                }}
              >
                {showWarnings
                  ? "Hide warning details"
                  : `Show warning details (${importReport.warningCount})`}
              </button>

              {showWarnings && (
                <div
                  style={{
                    marginTop: "12px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    background: "#fff",
                    color: "#111",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "10px 14px",
                  }}
                >
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                    }}
                  >
                    {importReport.warningRows.map(
                      (warning, index) => (
                        <li
                          key={`${warning.row}-${index}`}
                          style={{
                            marginBottom: "8px",
                          }}
                        >
                          <strong>
                            Spreadsheet row {warning.row}:
                          </strong>{" "}
                          {warning.reason}

                          {warning.details && (
                            <div
                              style={{
                                marginTop: "3px",
                                fontSize: "0.9rem",
                                color: "#555",
                              }}
                            >
                              {warning.details}
                            </div>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px",
            border: "1px solid #c62828",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          Error: {error}
        </div>
      )}

      {/* SAVED TEMPLATES */}

      <h2>Saved Templates</h2>

      {templatesLoading ? (
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <p>No templates have been imported yet.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                border: "1px solid #444",
                padding: "18px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                {/* TEMPLATE DETAILS */}

                <div
                  style={{
                    flex: "1",
                    minWidth: "250px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 6px 0",
                    }}
                  >
                    {template.name}
                  </h3>

                  {template.created_at && (
                    <small>
                      Imported:{" "}
                      {new Date(
                        template.created_at
                      ).toLocaleString()}
                    </small>
                  )}
                </div>

                {/* ACTION BUTTONS */}

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(template.id)
                    }
                    disabled={
                      duplicatingId === template.id
                    }
                    style={{
                      padding: "8px 14px",
                      cursor:
                        duplicatingId === template.id
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDuplicate(template)
                    }
                    disabled={duplicatingId !== null}
                    style={{
                      padding: "8px 14px",
                      cursor:
                        duplicatingId !== null
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        duplicatingId !== null
                          ? 0.6
                          : 1,
                    }}
                  >
                    {duplicatingId === template.id
                      ? "Duplicating..."
                      : "Duplicate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}