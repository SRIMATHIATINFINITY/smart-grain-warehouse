import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Warehouse } from "lucide-react";
import { isValidFirebaseKey } from "../../domain/binData.js";

function WarehouseSelectionPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const id = warehouseId.trim();
    if (!isValidFirebaseKey(id)) {
      setError("Enter a warehouse ID without . # $ [ ] or / characters.");
      return;
    }
    setError("");
    navigate(`/warehouses/${encodeURIComponent(id)}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-forest">
          <Warehouse size={24} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          Open a warehouse
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter the warehouse ID assigned in your Realtime Database. The
          dashboard reads its bin directory only; it does not fetch every
          bin&apos;s history.
        </p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="warehouse-id">
            Warehouse ID
          </label>
          <input
            id="warehouse-id"
            type="text"
            required
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            placeholder="Warehouse ID"
            className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3.5 py-3 outline-none transition focus:border-forest focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            Continue
            <ArrowRight size={17} />
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
        <p className="mt-5 text-xs leading-5 text-stone-500">
          Warehouse IDs are case-sensitive. If access is denied, ask your
          administrator to check your Firebase account and database rules.
        </p>
      </section>
    </main>
  );
}

export default WarehouseSelectionPage;
