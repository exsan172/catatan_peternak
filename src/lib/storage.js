// Browser persistence helpers for profile and farm records.

const demoRecordIds = {
  cows: ["cow-024", "cow-018", "cow-031", "cow-011"],
  schedules: ["schedule-checkup", "schedule-heat", "schedule-feed"],
  expenses: ["expense-feed", "expense-medicine", "expense-barn"],
};

export function openProfileDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window))
      return reject(new Error("IndexedDB tidak tersedia"));
    const request = indexedDB.open("catatan-peternak", 4);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings");
      for (const store of [
        "cows",
        "schedules",
        "expenses",
        "incomes",
        "diseases",
      ]) {
        if (!db.objectStoreNames.contains(store))
          db.createObjectStore(store, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadProfile() {
  try {
    const db = await openProfileDB();
    const saved = await new Promise((resolve, reject) => {
      const request = db
        .transaction("settings", "readonly")
        .objectStore("settings")
        .get("profile");
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return saved;
  } catch {
    try {
      return JSON.parse(
        localStorage.getItem("catatan-peternak-profile") || "null",
      );
    } catch {
      return null;
    }
  }
}

export async function saveProfile(nextProfile) {
  try {
    const db = await openProfileDB();
    await new Promise((resolve, reject) => {
      const request = db
        .transaction("settings", "readwrite")
        .objectStore("settings")
        .put(nextProfile, "profile");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    localStorage.setItem(
      "catatan-peternak-profile",
      JSON.stringify(nextProfile),
    );
  }
}

export async function loadCollection(storeName, defaults) {
  try {
    const db = await openProfileDB();
    const rows = await new Promise((resolve, reject) => {
      const request = db
        .transaction(storeName, "readonly")
        .objectStore(storeName)
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const fallbackRows = JSON.parse(
      localStorage.getItem(`catatan-peternak-${storeName}`) || "null",
    );
    if (Array.isArray(fallbackRows) && fallbackRows.length) {
      const merged = new Map(rows.map((row) => [row.id, row]));
      for (const row of fallbackRows) merged.set(row.id, row);
      const mergedRows = [...merged.values()];
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        for (const row of mergedRows)
          transaction.objectStore(storeName).put(row);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
      return mergedRows;
    }
    if (rows.length) {
      db.close();
      return rows;
    }
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      for (const row of defaults) transaction.objectStore(storeName).put(row);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    return defaults;
  } catch {
    try {
      const saved = JSON.parse(
        localStorage.getItem(`catatan-peternak-${storeName}`) || "null",
      );
      if (Array.isArray(saved)) return saved;
      localStorage.setItem(
        `catatan-peternak-${storeName}`,
        JSON.stringify(defaults),
      );
    } catch {
      /* Use starter records when browser storage is unavailable. */
    }
    return defaults;
  }
}

export async function saveRecord(storeName, record) {
  try {
    const db = await openProfileDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || new Error("Penyimpanan dibatalkan"));
    });
    db.close();
  } catch {
    const rows = JSON.parse(
      localStorage.getItem(`catatan-peternak-${storeName}`) || "[]",
    );
    localStorage.setItem(
      `catatan-peternak-${storeName}`,
      JSON.stringify([...rows.filter((row) => row.id !== record.id), record]),
    );
    return;
  }
  // Keep a durable fallback copy too; older browsers or storage policies may
  // report IndexedDB writes that are not available on the next page load.
  const rows = JSON.parse(
    localStorage.getItem(`catatan-peternak-${storeName}`) || "[]",
  );
  localStorage.setItem(
    `catatan-peternak-${storeName}`,
    JSON.stringify([...rows.filter((row) => row.id !== record.id), record]),
  );
}

export async function removeRecord(storeName, id) {
  try {
    const db = await openProfileDB();
    await new Promise((resolve, reject) => {
      const request = db
        .transaction(storeName, "readwrite")
        .objectStore(storeName)
        .delete(id);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    const rows = JSON.parse(
      localStorage.getItem(`catatan-peternak-${storeName}`) || "[]",
    );
    localStorage.setItem(
      `catatan-peternak-${storeName}`,
      JSON.stringify(rows.filter((row) => row.id !== id)),
    );
  }
}

export async function removePreviousDemoRecords() {
  try {
    const db = await openProfileDB();
    for (const [storeName, ids] of Object.entries(demoRecordIds)) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        for (const id of ids) transaction.objectStore(storeName).delete(id);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    }
    db.close();
  } catch {
    /* The fallback below handles browsers without IndexedDB. */
  }
  for (const [storeName, ids] of Object.entries(demoRecordIds)) {
    try {
      const key = `catatan-peternak-${storeName}`;
      const rows = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(
        key,
        JSON.stringify(rows.filter((row) => !ids.includes(row.id))),
      );
    } catch {
      /* Ignore unavailable browser storage. */
    }
  }
}

export async function replaceAllData(backup) {
  const collectionNames = [
    "cows",
    "schedules",
    "expenses",
    "incomes",
    "diseases",
  ];
  try {
    const db = await openProfileDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["settings", ...collectionNames],
        "readwrite",
      );
      transaction.objectStore("settings").put(backup.profile, "profile");
      for (const name of collectionNames) {
        const store = transaction.objectStore(name);
        store.clear();
        for (const row of backup[name]) store.put(row);
      }
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || new Error("Import dibatalkan"));
    });
    db.close();
  } catch {
    localStorage.setItem(
      "catatan-peternak-profile",
      JSON.stringify(backup.profile),
    );
    for (const name of collectionNames)
      localStorage.setItem(
        `catatan-peternak-${name}`,
        JSON.stringify(backup[name]),
      );
  }
}
