"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Comment = {
  id: string;
  text_html: string;
  category: string | null;
  order_index: number;
};

type Item = {
  id: string;
  name: string;
  order_index: number;
  comments: Comment[];
};

type Section = {
  id: string;
  name: string;
  order_index: number;
  items: Item[];
};

type Template = {
  id: string;
  name: string;
  sections: Section[];
};

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --------------------------------------------------
  // LOAD TEMPLATE
  // --------------------------------------------------

  useEffect(() => {
    if (!id) return;

    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/templates/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load template");
        }

        setTemplate(data.template);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load template"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [id]);

  // --------------------------------------------------
  // UPDATE TEMPLATE NAME
  // --------------------------------------------------

  const updateTemplateName = (name: string) => {
    setTemplate((current) => {
      if (!current) return current;

      return {
        ...current,
        name,
      };
    });

    setSuccessMessage(null);
  };

  // --------------------------------------------------
  // UPDATE SECTION NAME
  // --------------------------------------------------

  const updateSectionName = (
    sectionId: string,
    name: string
  ) => {
    setTemplate((current) => {
      if (!current) return current;

      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                name,
              }
            : section
        ),
      };
    });

    setSuccessMessage(null);
  };

  // --------------------------------------------------
  // UPDATE ITEM NAME
  // --------------------------------------------------

  const updateItemName = (
    sectionId: string,
    itemId: string,
    name: string
  ) => {
    setTemplate((current) => {
      if (!current) return current;

      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        name,
                      }
                    : item
                ),
              }
            : section
        ),
      };
    });

    setSuccessMessage(null);
  };

  // --------------------------------------------------
  // UPDATE COMMENT TEXT
  // --------------------------------------------------

  const updateCommentText = (
    sectionId: string,
    itemId: string,
    commentId: string,
    text: string
  ) => {
    setTemplate((current) => {
      if (!current) return current;

      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        comments: item.comments.map(
                          (comment) =>
                            comment.id === commentId
                              ? {
                                  ...comment,
                                  text_html: text,
                                }
                              : comment
                        ),
                      }
                    : item
                ),
              }
            : section
        ),
      };
    });

    setSuccessMessage(null);
  };

  // --------------------------------------------------
  // UPDATE COMMENT CATEGORY
  // --------------------------------------------------

  const updateCommentCategory = (
    sectionId: string,
    itemId: string,
    commentId: string,
    category: string
  ) => {
    setTemplate((current) => {
      if (!current) return current;

      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        comments: item.comments.map(
                          (comment) =>
                            comment.id === commentId
                              ? {
                                  ...comment,
                                  category,
                                }
                              : comment
                        ),
                      }
                    : item
                ),
              }
            : section
        ),
      };
    });

    setSuccessMessage(null);
  };

  // --------------------------------------------------
  // SAVE CHANGES
  // --------------------------------------------------

  const saveChanges = async () => {
    if (!template) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `/api/templates/${template.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: template.name,
            sections: template.sections,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to save template"
        );
      }

      setSuccessMessage("Template saved successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save template"
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Loading template...</h2>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR WHILE LOADING
  // --------------------------------------------------

  if (error && !template) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Unable to load template</h2>

        <p style={{ color: "red" }}>
          {error}
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
        >
          ← Back
        </button>
      </main>
    );
  }

  // --------------------------------------------------
  // TEMPLATE NOT FOUND
  // --------------------------------------------------

  if (!template) {
    return (
      <main style={{ padding: "40px" }}>
        Template not found.
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* BACK BUTTON */}

      <button
        type="button"
        onClick={() => router.push("/")}
        style={{
          marginBottom: "25px",
          padding: "8px 14px",
          cursor: "pointer",
        }}
      >
        ← Back to Templates
      </button>

      {/* PAGE TITLE */}

      <h1>Template Editor</h1>

      <p>
        Edit the template content below and click Save Changes.
      </p>

      {/* TEMPLATE NAME */}

      <div
        style={{
          marginTop: "25px",
          marginBottom: "25px",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          Template Name
        </label>

        <input
          type="text"
          value={template.name}
          onChange={(e) =>
            updateTemplateName(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "18px",
            boxSizing: "border-box",
          }}
        />
      </div>

      <p>
        {template.sections.length} sections
      </p>

      {/* SAVE BUTTON */}

      <button
        type="button"
        onClick={saveChanges}
        disabled={saving}
        style={{
          padding: "12px 22px",
          marginBottom: "20px",
          cursor: saving ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid green",
            borderRadius: "6px",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid red",
            color: "red",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}

      <hr style={{ margin: "20px 0 30px" }} />

      {/* SECTIONS */}

      {template.sections.map((section) => (
        <div
          key={section.id}
          style={{
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "25px",
          }}
        >
          {/* SECTION NAME */}

          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            Section Name
          </label>

          <input
            type="text"
            value={section.name}
            onChange={(e) =>
              updateSectionName(
                section.id,
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              boxSizing: "border-box",
              marginBottom: "15px",
            }}
          />

          {/* ITEMS */}

          {section.items.map((item) => (
            <div
              key={item.id}
              style={{
                marginTop: "20px",
                paddingLeft: "20px",
                borderLeft: "3px solid #555",
              }}
            >
              {/* ITEM NAME */}

              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Item Name
              </label>

              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  updateItemName(
                    section.id,
                    item.id,
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "9px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  marginBottom: "15px",
                }}
              />

              {/* NO COMMENTS */}

              {item.comments.length === 0 ? (
                <p style={{ opacity: 0.6 }}>
                  No comments
                </p>
              ) : (
                item.comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      border: "1px solid #333",
                      borderRadius: "6px",
                      padding: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    {/* COMMENT CATEGORY */}

                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    >
                      Category
                    </label>

                    <select
                      value={comment.category || ""}
                      onChange={(e) =>
                        updateCommentCategory(
                          section.id,
                          item.id,
                          comment.id,
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <option value="">
                        No category
                      </option>

                      <option value="info">
                        info
                      </option>

                      <option value="limit">
                        limit
                      </option>

                      <option value="defect">
                        defect
                      </option>
                    </select>

                    {/* COMMENT TEXT */}

                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    >
                      Comment
                    </label>

                    <textarea
                      value={comment.text_html}
                      onChange={(e) =>
                        updateCommentText(
                          section.id,
                          item.id,
                          comment.id,
                          e.target.value
                        )
                      }
                      rows={5}
                      style={{
                        width: "100%",
                        padding: "10px",
                        resize: "vertical",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ))}

      {/* SAVE BUTTON AT BOTTOM */}

      <button
        type="button"
        onClick={saveChanges}
        disabled={saving}
        style={{
          padding: "12px 22px",
          marginTop: "10px",
          cursor: saving ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </main>
  );
}