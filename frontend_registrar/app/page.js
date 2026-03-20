"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export default function RegistrarPage() {
  const [departments, setDepartments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [hoveredDepartmentId, setHoveredDepartmentId] = useState(null);

  const loadState = async () => {
    const response = await fetch(`${API_BASE}/api/registrar/state`);
    if (!response.ok) {
      throw new Error("Failed to load registrar state");
    }

    const state = await response.json();
    setDepartments(state.departments);
    setDocuments(state.documents);
    setActivity(state.activity);
  };

  useEffect(() => {
    loadState();
  }, []);

  const documentCountByDepartment = useMemo(() => {
    const map = new Map();
    for (const department of departments) {
      map.set(department.id, 0);
    }

    for (const document of documents) {
      map.set(document.departmentId, (map.get(document.departmentId) ?? 0) + 1);
    }

    return map;
  }, [departments, documents]);

  const addDepartment = async () => {
    const trimmed = newDepartmentName.trim();
    if (!trimmed || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/registrar/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });

      if (!response.ok) {
        throw new Error("Failed to add department");
      }

      setNewDepartmentName("");
      await loadState();
    } finally {
      setBusy(false);
    }
  };

  const addDocument = async () => {
    const studentName = newStudentName.trim();
    const title = newDocumentTitle.trim();

    if (!studentName || !title || departments.length === 0 || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/registrar/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          title,
          departmentId: departments[0].id
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add document");
      }

      setNewStudentName("");
      setNewDocumentTitle("");
      await loadState();
    } finally {
      setBusy(false);
    }
  };

  const onDropDocument = async (event, departmentId) => {
    event.preventDefault();
    setHoveredDepartmentId(null);

    const rawId = event.dataTransfer.getData("text/plain");
    const documentId = Number.parseInt(rawId, 10);
    if (Number.isNaN(documentId) || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/registrar/documents/${documentId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toDepartmentId: departmentId })
      });

      if (!response.ok) {
        throw new Error("Failed to move document");
      }

      await loadState();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="brand">
          <h1>University Portal</h1>
          <p>OFFICE OF THE REGISTRAR</p>
        </div>

        <section className="panel">
          <h2>Command Center</h2>
          <div className="stack">
            <input
              value={newDepartmentName}
              onChange={(event) => setNewDepartmentName(event.target.value)}
              placeholder="Add department name"
            />
            <button className="primary-btn" onClick={addDepartment} disabled={busy}>
              Add New Department
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Create Document</h2>
          <div className="stack">
            <input
              value={newStudentName}
              onChange={(event) => setNewStudentName(event.target.value)}
              placeholder="Student name"
            />
            <input
              value={newDocumentTitle}
              onChange={(event) => setNewDocumentTitle(event.target.value)}
              placeholder="Document task"
            />
            <button className="ghost-btn" onClick={addDocument} disabled={busy}>
              Add to first department
            </button>
            <span className="muted">Drag cards across departments to simulate processing.</span>
          </div>
        </section>
      </aside>

      <section className="main">
        <header>
          <h2>Department Workflow</h2>
          <p>Move document cards between departments to reflect queue processing.</p>
        </header>

        <div className="toolbar">
          <span className="badge">Filter: Active</span>
          <span className="badge">Sort: Priority</span>
        </div>

        <div className="grid">
          {departments.map((department) => {
            const departmentDocuments = documents.filter((doc) => doc.departmentId === department.id);
            const isHovered = hoveredDepartmentId === department.id;

            return (
              <article className="dept" key={department.id}>
                <div className="dept-head">
                  <h3>{department.name}</h3>
                  <span className="badge">{documentCountByDepartment.get(department.id) ?? 0} docs</span>
                </div>

                <div
                  className={`dropzone ${isHovered ? "over" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setHoveredDepartmentId(department.id);
                  }}
                  onDragLeave={() => setHoveredDepartmentId(null)}
                  onDrop={(event) => onDropDocument(event, department.id)}
                >
                  {departmentDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="card"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", String(document.id));
                      }}
                    >
                      <strong>{document.referenceCode}</strong>
                      <h4>{document.studentName}</h4>
                      <p>{document.title}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="activity">
        <h2>Activity Log</h2>
        <div className="timeline">
          {activity.map((entry) => (
            <article key={entry.id} className="timeline-item">
              <h3>{entry.action}</h3>
              <p>
                {entry.actor} • {new Date(entry.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </aside>
    </main>
  );
}
