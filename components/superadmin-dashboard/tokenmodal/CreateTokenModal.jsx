'use client';

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

export default function CreateTokenModal({ onCreated, editToken, onUpdated, onCreateClick }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    symbol: "",
    slug: "",
    usdPerUnit: "",
    sortOrder: "",
  });

  useEffect(() => {
    if (editToken) {
      setOpen(true);
      setForm({
        name: editToken.name || "",
        symbol: editToken.symbol || "",
        slug: editToken.slug || "",
        usdPerUnit: editToken.usdPerUnit || "",
        sortOrder: editToken.sortOrder || "",
      });
    }
  }, [editToken]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const url = editToken
        ? `/api/superadmin/tokens/${editToken._id}`
        : "/api/superadmin/tokens";

      const method = editToken ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        if (editToken) {
          onUpdated?.(data.data);
        } else {
          onCreated?.(data.data);
        }

        setOpen(false);
        setForm({
          name: "",
          symbol: "",
          slug: "",
          usdPerUnit: "",
          sortOrder: "",
        });
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      name: "",
      symbol: "",
      slug: "",
      usdPerUnit: "",
      sortOrder: "",
    });
  };

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => {
          onCreateClick?.();
          setOpen(true);
        }}
        className="bg-brand-accent inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-transparent hover:bg-brand-accent/80 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 hover:border-brand-accent border border-transparent"
      >
        <Plus className="h-4 w-4" />
        Create Token
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0c10] p-6 shadow-xl">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editToken ? "Edit Token" : "Create New Token"}
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X />
              </button>
            </div>

            {/* FORM */}
            <div className="mt-5 space-y-4">

              {/* NAME */}
              <div>
                <label className="text-xs font-medium text-white/70">
                  Token Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white outline-none focus:border-brand-accent"
                />
              </div>

              {/* SYMBOL */}
              <div>
                <label className="text-xs font-medium text-white/70">
                  Symbol
                </label>
                <input
                  name="symbol"
                  value={form.symbol}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white outline-none focus:border-brand-accent"
                />
              </div>

              {/* SLUG */}
              <div>
                <label className="text-xs font-medium text-white/70">
                  Slug
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white outline-none focus:border-brand-accent"
                />
              </div>

              {/* USD VALUE */}
              <div>
                <label className="text-xs font-medium text-white/70">
                  USD Value
                </label>
                <input
                  name="usdPerUnit"
                  type="number"
                  value={form.usdPerUnit}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white outline-none focus:border-brand-accent"
                />
              </div>

              {/* SORT ORDER */}
              <div>
                <label className="text-xs font-medium text-white/70">
                  Sort Order
                </label>
                <input
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white outline-none focus:border-brand-accent"
                />
              </div>

            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent/80 disabled:opacity-60 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {editToken ? "Updating..." : "Creating..."}
                  </>
                ) : editToken ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}