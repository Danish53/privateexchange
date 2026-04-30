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
    totalTokens: "",
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
        totalTokens: "",
        usdPerUnit: editToken.usdPerUnit || "",
        sortOrder: editToken.sortOrder || "",
      });
    }
  }, [editToken]);

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    
    // Calculate usdPerUnit when totalTokens changes (1 USD / totalTokens)
    if (e.target.name === 'totalTokens') {
      const totalTokens = parseFloat(newForm.totalTokens);
      
      if (!isNaN(totalTokens) && totalTokens !== 0) {
        newForm.usdPerUnit = (1 / totalTokens).toFixed(6);
      } else {
        newForm.usdPerUnit = "";
      }
    }
    
    setForm(newForm);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const url = editToken
        ? `/api/superadmin/tokens/${editToken._id}`
        : "/api/superadmin/tokens";

      const method = editToken ? "PUT" : "POST";

      // Prepare data to send - include totalUsd and totalTokens for calculation
      const dataToSend = {
        name: form.name,
        symbol: form.symbol,
        slug: form.slug,
        usdPerUnit: form.usdPerUnit,
        sortOrder: form.sortOrder,
        totalUsd: form.totalUsd,
        totalTokens: form.totalTokens,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
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
          totalUsd: "",
          totalTokens: "",
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
      totalUsd: "",
      totalTokens: "",
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

              {/* TOTAL TOKENS */}
              <div>
                <label className="text-xs font-medium text-white/70">
                  Total Tokens
                </label>
                <input
                  name="totalTokens"
                  type="number"
                  step="1"
                  value={form.totalTokens}
                  onChange={handleChange}
                  placeholder="Enter total token"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white outline-none focus:border-brand-accent"
                />
                {/* <div className="mt-1 text-xs text-white/50">
                  Enter how many tokens you want to create
                </div> */}
              </div>

              {/* CALCULATED PRICE PER TOKEN */}
              {form.totalTokens && (
                <div className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/80">
                      Calculated Price:
                    </span>
                    <span className="text-sm font-bold text-brand-accent">
                      1 token = ${parseFloat(form.usdPerUnit || 0).toFixed(4)} USD
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    ${parseFloat(form.usdPerUnit || 0).toFixed(4)} per token
                  </div>
                </div>
              )}

              {/* HIDDEN USD PER UNIT FIELD (for API) */}
              <input
                type="hidden"
                name="usdPerUnit"
                value={form.usdPerUnit}
              />

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