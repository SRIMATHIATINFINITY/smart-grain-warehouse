import { useEffect, useState } from "react";
import { isValidFirebaseKey } from "../domain/binData.js";

function useWarehouseBins(database, warehouseId) {
  const [bins, setBins] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!database || !isValidFirebaseKey(warehouseId)) {
      setStatus("error");
      setError("The warehouse ID is not a valid database key.");
      return undefined;
    }

    let active = true;
    let unsubscribe;
    setBins([]);
    setError("");
    setStatus("loading");

    import("../services/firebase/bins.js")
      .then(({ subscribeToWarehouseBins }) => {
        if (!active) return;
        unsubscribe = subscribeToWarehouseBins(
          database,
          warehouseId,
          (nextBins) => {
            if (!active) return;
            setBins(nextBins);
            setStatus("ready");
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
  }, [database, warehouseId]);

  return { bins, status, error };
}

export default useWarehouseBins;
