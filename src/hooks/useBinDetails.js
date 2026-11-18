import { useEffect, useState } from "react";
import { isValidFirebaseKey } from "../domain/binData.js";

function useBinDetails(database, warehouseId, binId) {
  const [bin, setBin] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      !database ||
      !isValidFirebaseKey(warehouseId) ||
      !isValidFirebaseKey(binId)
    ) {
      setStatus("error");
      setError("The warehouse ID or bin ID is not a valid database key.");
      return undefined;
    }

    let active = true;
    let unsubscribe;
    setBin(null);
    setStatus("loading");
    setError("");

    import("../services/firebase/bins.js")
      .then(({ subscribeToBin }) => {
        if (!active) return;
        unsubscribe = subscribeToBin(
          database,
          warehouseId,
          binId,
          (nextBin) => {
            if (!active) return;
            setBin(nextBin);
            setStatus(nextBin.status === "error" ? "error" : "ready");
          },
          (subscriptionError) => {
            if (!active) return;
            setError(subscriptionError.message);
            setStatus("error");
          },
        );
      })
      .catch((subscriptionError) => {
        if (!active) return;
        setError(subscriptionError.message);
        setStatus("error");
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [database, warehouseId, binId]);

  return { bin, status, error };
}

export default useBinDetails;
