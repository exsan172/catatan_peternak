import { onMount } from "svelte";
import {
  loadProfile,
  saveProfile,
  loadCollection,
  saveRecord,
  removeRecord,
  removePreviousDemoRecords,
  replaceAllData,
} from "./storage.js";
import { createCattleHelpers } from "./cattle.js";

export function createAppController() {
  let activeTab = $state("home");
  let theme = $state("system");
  let cowFilter = $state("Semua");
  let cowSearch = $state("");
  let cowBreedFilter = $state("Semua");
  let cowCategoryFilter = $state("Semua");
  let selectedCalendarCowId = $state(null);
  let reproDraft = $state({
    heatDate: "",
    inseminationDate: "",
    pregnancyResult: "Belum diperiksa",
    lastDewormingDate: "",
    nextDewormingDate: "",
    calvingDate: "",
  });
  let reproMessage = $state("");
  let profile = $state(null);
  let isLoading = $state(true);
  let ownerName = $state("");
  let farmName = $state("");
  let setupError = $state("");
  let backupMessage = $state("");
  let backupFileInput = $state(null);
  let expenseImportInput = $state(null);
  let expenseImportMessage = $state("");
  let confirmModal = $state(null);
  let confirmResolver = null;
  let cows = $state([]);
  let schedules = $state([]);
  let expandedScheduleGroups = $state({});
  let expenses = $state([]);
  let incomes = $state([]);
  let showCowForm = $state(false);
  let showScheduleForm = $state(false);
  let showExpenseForm = $state(false);
  let showIncomeForm = $state(false);
  let editingCowId = $state(null);
  let editingExpenseId = $state(null);
  let editingIncomeId = $state(null);
  let cowName = $state("");
  let cowBreed = $state("PO");
  let cowCategory = $state("");
  let cowStatus = $state("Sehat");
  let cowBirthDate = $state("");
  let cowMotherId = $state("");
  let scheduleTitle = $state("");
  let scheduleKind = $state("Birahi");
  let scheduleDate = $state(new Date().toISOString().slice(0, 10));
  let scheduleTime = $state("09:00");
  let scheduleDetail = $state("");
  let expenseName = $state("");
  let expenseCategory = $state("Pakan");
  let expenseAmount = $state("");
  let expenseSearch = $state("");
  let expenseDate = $state(new Date().toISOString().slice(0, 10));
  let incomeName = $state("");
  let incomeCategory = $state("Jual kohe");
  let incomeAmount = $state("");
  let incomeDate = $state(new Date().toISOString().slice(0, 10));
  let expenseRange = $state("Semua");
  let financeHistoryTab = $state("pengeluaran");
  let customStart = $state(new Date().toISOString().slice(0, 10));
  let customEnd = $state(new Date().toISOString().slice(0, 10));

  function navigateTo(tab) {
    if (tab === activeTab && !selectedCalendarCowId) return;
    window.history.pushState({ catatanPeternakPage: { tab, cowId: null } }, "");
    activeTab = tab;
    selectedCalendarCowId = null;
  }

  function handlePagePopState(event) {
    const page = event.state?.catatanPeternakPage;
    if (!page) return;

    activeTab = page.tab || "home";
    const cow = page.cowId ? cows.find((item) => item.id === page.cowId) : null;
    if (cow) openReproductionDetails(cow, { pushHistory: false });
    else selectedCalendarCowId = null;
  }

  function closeCalendarDetails() {
    if (window.history.state?.catatanPeternakPage?.cowId) {
      window.history.back();
      return;
    }
    selectedCalendarCowId = null;
  }

  const seedCows = [];
  const seedSchedules = [];
  const seedExpenses = [];
  const knownCowBreeds = [
    "PO",
    "Bali",
    "Madura",
    "Aceh",
    "Pasundan",
    "Limousin",
    "Simmental",
    "Brahman",
    "Brahman Cross",
    "Angus",
    "Brangus",
    "Belgian Blue",
    "FH",
    "Wagyu",
    "Lainnya",
  ];
  const expenseRangeOptions = [
    "Semua",
    "Hari ini",
    "Minggu ini",
    "Bulan ini",
    "Bulan lalu",
    "Filter tanggal",
  ];

  function askConfirmation({
    title,
    message,
    confirmLabel = "Ya, lanjutkan",
    danger = false,
  }) {
    return new Promise((resolve) => {
      confirmResolver = resolve;
      confirmModal = { title, message, confirmLabel, danger };
    });
  }

  function closeConfirmation(confirmed) {
    const resolve = confirmResolver;
    confirmResolver = null;
    confirmModal = null;
    resolve?.(confirmed);
  }

  const {
    localDate,
    cowAge,
    todayKey,
    cowTone,
    normalizeCowBreed,
    scheduleTone,
    scheduleIcon,
    expenseIcon,
    money,
    displayScheduleDate,
    addDaysToDate,
    calvingEstimate,
    hasObservedHeatAfterInsemination,
    isCowInseminationActive,
    normalizeCowReproduction,
  } = createCattleHelpers({ knownCowBreeds });
  function motherName(cow) {
    return cows.find((candidate) => candidate.id === cow.motherId)?.name || "";
  }

  function reproductiveCowLabel(cow) {
    const nextHeatCheck = heatCheckRecommendations(cow)[0];
    if (nextHeatCheck) return `Pantau birahi: ${localDate(nextHeatCheck)}`;
    if (cow.pregnancyResult && cow.pregnancyResult !== "Belum diperiksa")
      return `Hasil PKB: ${cow.pregnancyResult}`;
    if (isCowInseminationActive(cow))
      return `Rekomendasi PKB: ${localDate(addDaysToDate(cow.inseminationDate, 60))}`;
    return "Belum ada jadwal birahi atau IB";
  }
  function weaningDateForCow(cow) {
    return cow.status === "Menyusui" && cow.calvingDate
      ? addMonthsToDate(cow.calvingDate, 5)
      : "";
  }
  function pregnancyLikelihoodForCow(cow) {
    if (
      !isCowInseminationActive(cow) ||
      cow.pregnancyResult === "Hamil" ||
      cow.pregnancyResult === "Tidak hamil"
    )
      return null;
    const today = todayKey();
    const checkedCycles = heatCheckRecommendations(cow).filter(
      (date) => date <= today && cow.heatChecks?.includes(date),
    );
    if (!checkedCycles.length) return null;
    return {
      percent: checkedCycles.length >= 2 ? 80 : 70,
      cycles: checkedCycles.length,
    };
  }
  function heatCheckRecommendations(cow) {
    const isAiActive = isCowInseminationActive(cow);
    const anchor = isAiActive ? cow.inseminationDate : cow.heatDate;
    if (!anchor) return [];
    const pregnancyCheckDate = isAiActive
      ? addDaysToDate(cow.inseminationDate, 60)
      : null;
    const today = todayKey();
    const dates = [];
    for (let cycle = 1; cycle <= 10; cycle += 1) {
      const date = addDaysToDate(anchor, cycle * 21);
      if (pregnancyCheckDate && date >= pregnancyCheckDate) break;
      dates.push(date);
    }
    return dates;
  }

  let stats = $derived([
    {
      label: "Semua ternak",
      value: String(cows.length),
      unit: "ekor",
      icon: "cow",
      tone: "sage",
      note: "Total sapi",
    },
    {
      label: "Sehat",
      value: String(cows.filter((cow) => cow.status === "Sehat").length),
      unit: "ekor",
      icon: "heart",
      tone: "mint",
      note: "Kondisi baik",
    },
    {
      label: "Sakit",
      value: String(cows.filter((cow) => cow.status === "Sakit").length),
      unit: "ekor",
      icon: "activity",
      tone: "peach",
      note: "Perlu dipantau",
    },
    {
      label: "Hamil",
      value: String(
        cows.filter((cow) => cow.status === "Hamil" || cow.pregnant).length,
      ),
      unit: "ekor",
      icon: "baby",
      tone: "lilac",
      note: "Dalam pemantauan",
    },
    {
      label: "Menyusui",
      value: String(cows.filter((cow) => cow.status === "Menyusui").length),
      unit: "ekor",
      icon: "cow",
      tone: "sage",
      note: "Perlu dipantau",
    },
  ]);
  function filterFinanceRows(rows) {
    const query = expenseSearch.trim().toLocaleLowerCase("id");
    const newestFirst = (items) =>
      items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start;
    let end;
    if (expenseRange === "Semua") {
      return newestFirst(
        rows.filter(
          (row) => !query || row.name.toLocaleLowerCase("id").includes(query),
        ),
      );
    } else if (expenseRange === "Hari ini") {
      start = end = today;
    } else if (expenseRange === "Minggu ini") {
      start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (expenseRange === "Bulan lalu") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (expenseRange === "Filter tanggal") {
      start = customStart ? new Date(`${customStart}T00:00:00`) : null;
      end = customEnd ? new Date(`${customEnd}T00:00:00`) : null;
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    const startKey = start
      ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`
      : "";
    const endKey = end
      ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
      : "9999-12-31";
    return newestFirst(
      rows
        .filter((row) => row.date >= startKey && row.date <= endKey)
        .filter(
          (row) => !query || row.name.toLocaleLowerCase("id").includes(query),
        ),
    );
  }
  let filteredExpenses = $derived.by(() => filterFinanceRows(expenses));
  let filteredIncomes = $derived.by(() => filterFinanceRows(incomes));
  let filteredRevenue = $derived(
    filteredIncomes.filter((income) => income.category !== "Modal"),
  );
  let expenseTotal = $derived(
    filteredExpenses.reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0,
    ),
  );
  let incomeTotal = $derived(
    filteredRevenue.reduce(
      (total, income) => total + Number(income.amount || 0),
      0,
    ),
  );
  let cashflowTotal = $derived(incomeTotal - expenseTotal);
  let totalCapital = $derived(
    incomes
      .filter((income) => income.category === "Modal")
      .reduce((total, income) => total + Number(income.amount || 0), 0),
  );
  let availableBalance = $derived(
    totalCapital +
      incomes
        .filter((income) => income.category !== "Modal")
        .reduce((total, income) => total + Number(income.amount || 0), 0) -
      expenses.reduce(
        (total, expense) => total + Number(expense.amount || 0),
        0,
      ),
  );
  let cowBreedOptions = $derived([
    ...knownCowBreeds,
    ...[
      ...new Set(
        cows.map((cow) => normalizeCowBreed(cow.breed)).filter(Boolean),
      ),
    ]
      .filter((breed) => !knownCowBreeds.includes(breed))
      .sort((a, b) => a.localeCompare(b, "id")),
  ]);
  let cowCategoryOptions = $derived(
    [...new Set(cows.map((cow) => cow.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "id"),
    ),
  );
  let filteredCows = $derived(
    cows.filter((cow) => {
      const query = cowSearch.trim().toLocaleLowerCase("id");
      const matchesStatus =
        cowFilter === "Semua" ||
        (cowFilter === "Hamil"
          ? cow.status === "Hamil" || cow.pregnant
          : cow.status === cowFilter);
      const matchesName =
        !query || cow.name.toLocaleLowerCase("id").includes(query);
      const matchesBreed =
        cowBreedFilter === "Semua" ||
        (cowBreedFilter === "__none__"
          ? !cow.breed
          : normalizeCowBreed(cow.breed) === cowBreedFilter);
      const matchesCategory =
        cowCategoryFilter === "Semua" ||
        (cowCategoryFilter === "__none__"
          ? !cow.category
          : cow.category === cowCategoryFilter);
      return matchesStatus && matchesName && matchesBreed && matchesCategory;
    }),
  );
  let selectedCalendarCow = $derived(
    cows.find((cow) => cow.id === selectedCalendarCowId) || null,
  );
  let pregnancyCheckRecommendation = $derived(
    selectedCalendarCow?.inseminationDate &&
      isCowInseminationActive(selectedCalendarCow) &&
      (!selectedCalendarCow.pregnancyResult ||
        selectedCalendarCow.pregnancyResult === "Belum diperiksa")
      ? addDaysToDate(selectedCalendarCow.inseminationDate, 60)
      : null,
  );
  let pregnancyLikelihood = $derived(
    pregnancyLikelihoodForCow(selectedCalendarCow),
  );
  let upcomingSchedules = $derived.by(() => {
    const today = todayKey();
    const items = schedules
      .filter((item) => item.date >= today)
      .map((item) => ({ ...item, source: "manual" }));
    for (const cow of cows) {
      const detail = `${cow.name} · Sapi #${cow.code}`;
      for (const date of heatCheckRecommendations(cow)) {
        if (date >= today)
          items.push({
            id: `heat-${cow.id}-${date}`,
            source: "cow",
            cow,
            kind: "Birahi",
            title: "Pantau birahi siklus 21 hari",
            detail,
            date,
            time: "",
          });
      }
      if (
        isCowInseminationActive(cow) &&
        (!cow.pregnancyResult || cow.pregnancyResult === "Belum diperiksa")
      ) {
        const date = addDaysToDate(cow.inseminationDate, 60);
        if (date >= today)
          items.push({
            id: `pkb-${cow.id}`,
            source: "cow",
            cow,
            kind: "PKB",
            title: "Pemeriksaan kebuntingan (PKB)",
            detail,
            date,
            time: "",
          });
      }
      if (cow.nextDewormingDate && cow.nextDewormingDate >= today) {
        items.push({
          id: `deworm-${cow.id}`,
          source: "cow",
          cow,
          kind: "Obat cacing",
          title: "Jadwal obat cacing",
          detail,
          date: cow.nextDewormingDate,
          time: "",
        });
      }
      const weaningDate = weaningDateForCow(cow);
      if (weaningDate && weaningDate >= today) {
        items.push({
          id: `weaning-${cow.id}`,
          source: "cow",
          cow,
          kind: "Sapih",
          title: "Jadwal sapih pedet",
          detail,
          date: weaningDate,
          time: "",
        });
      }
    }
    return items.sort((a, b) =>
      `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`),
    );
  });
  let upcomingScheduleGroups = $derived.by(() => {
    const groups = new Map();
    for (const item of upcomingSchedules) {
      const key = item.cow?.id || "farm";
      if (!groups.has(key))
        groups.set(key, {
          id: key,
          name: item.cow?.name || "Jadwal peternakan",
          code: item.cow?.code || "",
          items: [],
        });
      groups.get(key).items.push(item);
    }
    return [...groups.values()].sort((a, b) =>
      `${a.items[0]?.date || ""} ${a.name}`.localeCompare(
        `${b.items[0]?.date || ""} ${b.name}`,
      ),
    );
  });

  onMount(async () => {
    window.history.replaceState(
      {
        ...window.history.state,
        catatanPeternakPage: { tab: activeTab, cowId: null },
      },
      "",
    );
    window.addEventListener("popstate", handlePagePopState);
    const savedTheme = localStorage.getItem("catatan-peternak-theme");
    theme =
      savedTheme === "dark" || savedTheme === "light" ? savedTheme : "system";
    applyTheme();
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    systemTheme.addEventListener("change", () => {
      if (theme === "system") applyTheme();
    });
    await removePreviousDemoRecords();
    [profile, cows, schedules, expenses, incomes] = await Promise.all([
      loadProfile(),
      loadCollection("cows", seedCows),
      loadCollection("schedules", seedSchedules),
      loadCollection("expenses", seedExpenses),
      loadCollection("incomes", []),
    ]);
    const normalizedCows = cows.map(normalizeCowReproduction);
    const hasNormalizedChanges = normalizedCows.some(
      (cow, idx) => cow !== cows[idx],
    );
    cows = normalizedCows;
    if (hasNormalizedChanges) {
      for (const cow of cows) {
        await saveRecord("cows", cow);
      }
    }
    isLoading = false;
  });

  function applyTheme() {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
  function toggleTheme() {
    theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("catatan-peternak-theme", theme);
    applyTheme();
  }

  async function addCow(event) {
    event.preventDefault();
    const existing = cows.find((cow) => cow.id === editingCowId);
    const record = existing
      ? {
          ...existing,
          name: cowName.trim(),
          breed: cowBreed,
          category: cowCategory,
          status: cowStatus,
          pregnant: cowStatus === "Hamil",
          birthDate: cowBirthDate || null,
        }
      : {
          id: `cow-${crypto.randomUUID()}`,
          name: cowName.trim(),
          code: String(Date.now()).slice(-4),
          breed: cowBreed,
          category: cowCategory,
          status: cowStatus,
          pregnant: cowStatus === "Hamil",
          birthDate: cowBirthDate || null,
        };
    record.motherId = cowMotherId || null;
    await saveRecord("cows", record);
    cows = existing
      ? cows.map((cow) => (cow.id === record.id ? record : cow))
      : [...cows, record];
    editingCowId = null;
    cowName = "";
    cowBreed = "PO";
    cowCategory = "";
    cowStatus = "Sehat";
    cowBirthDate = "";
    cowMotherId = "";
    showCowForm = false;
  }

  function editCow(cow) {
    editingCowId = cow.id;
    cowName = cow.name;
    cowBreed = normalizeCowBreed(cow.breed || "PO");
    cowCategory = cow.category || "";
    cowStatus = cow.status || "Sehat";
    cowBirthDate = cow.birthDate || "";
    cowMotherId = cow.motherId || "";
    showCowForm = true;
  }

  function startNewCow() {
    editingCowId = null;
    cowName = "";
    cowBreed = "PO";
    cowCategory = "";
    cowStatus = "Sehat";
    cowBirthDate = "";
    cowMotherId = "";
    showCowForm = !showCowForm;
  }

  async function updateCowStatus(cow, status) {
    const updated = { ...cow, status, pregnant: status === "Hamil" };
    await saveRecord("cows", updated);
    cows = cows.map((item) => (item.id === cow.id ? updated : item));
  }

  function openReproductionDetails(cow, { pushHistory = true } = {}) {
    if (pushHistory) {
      window.history.pushState(
        { catatanPeternakPage: { tab: "kalender", cowId: cow.id } },
        "",
      );
    }
    activeTab = "kalender";
    selectedCalendarCowId = cow.id;
    const isAiActive = isCowInseminationActive(cow);
    reproDraft = {
      heatDate: cow.heatDate || "",
      inseminationDate: isAiActive ? cow.inseminationDate || "" : "",
      pregnancyResult: isAiActive
        ? cow.pregnancyResult || "Belum diperiksa"
        : "Belum diperiksa",
      lastDewormingDate: cow.lastDewormingDate || "",
      nextDewormingDate: cow.lastDewormingDate
        ? addMonthsToDate(cow.lastDewormingDate, 2)
        : "",
      calvingDate: cow.calvingDate || "",
    };
    reproMessage = "";
  }

  function handleHeatDateChange() {
    if (
      reproDraft.heatDate &&
      reproDraft.inseminationDate &&
      reproDraft.heatDate > reproDraft.inseminationDate
    ) {
      reproDraft.inseminationDate = "";
      reproDraft.pregnancyResult = "Belum diperiksa";
    }
  }

  function addMonthsToDate(dateString, months) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const targetMonthIndex = month - 1 + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  }

  async function saveReproductionDetails(event) {
    event.preventDefault();
    if (!selectedCalendarCow) return;

    const prevInseminationDate = selectedCalendarCow.inseminationDate || "";
    const heatDateIsAfterPrevInsemination = Boolean(
      reproDraft.heatDate &&
      prevInseminationDate &&
      reproDraft.heatDate > prevInseminationDate,
    );
    const heatDateIsAfterDraftInsemination = Boolean(
      reproDraft.heatDate &&
      reproDraft.inseminationDate &&
      reproDraft.heatDate > reproDraft.inseminationDate,
    );
    const heatDateChanged =
      (selectedCalendarCow.heatDate || "") !== (reproDraft.heatDate || "");
    const isNewInseminationProvided = Boolean(
      reproDraft.inseminationDate &&
      reproDraft.inseminationDate !== prevInseminationDate &&
      (!reproDraft.heatDate ||
        reproDraft.inseminationDate >= reproDraft.heatDate),
    );
    const inseminationExplicitlyCleared = Boolean(
      prevInseminationDate && !reproDraft.inseminationDate,
    );
    const isNegativePregnancy = Boolean(
      prevInseminationDate && reproDraft.pregnancyResult === "Tidak hamil",
    );

    const invalidatePreviousInsemination = Boolean(
      prevInseminationDate &&
      (heatDateIsAfterPrevInsemination ||
        heatDateIsAfterDraftInsemination ||
        (heatDateChanged && !isNewInseminationProvided) ||
        inseminationExplicitlyCleared ||
        isNegativePregnancy),
    );

    const ibHistory = [...(selectedCalendarCow.ibHistory || [])];
    if (
      invalidatePreviousInsemination &&
      !ibHistory.some((entry) => entry.date === prevInseminationDate)
    ) {
      const result = isNegativePregnancy
        ? "Tidak hamil"
        : selectedCalendarCow.pregnancyResult &&
            selectedCalendarCow.pregnancyResult !== "Belum diperiksa"
          ? selectedCalendarCow.pregnancyResult
          : "Gagal (birahi lagi)";
      ibHistory.push({ date: prevInseminationDate, result });
    }

    let nextInseminationDate = reproDraft.inseminationDate || "";
    let nextPregnancyResult = reproDraft.pregnancyResult || "Belum diperiksa";

    if (invalidatePreviousInsemination && !isNewInseminationProvided) {
      nextInseminationDate = "";
      nextPregnancyResult = "Belum diperiksa";
    }

    let updated = {
      ...selectedCalendarCow,
      ...reproDraft,
      inseminationDate: nextInseminationDate,
      pregnancyResult: nextPregnancyResult,
      ibHistory,
      ...(invalidatePreviousInsemination
        ? {
            pregnant: false,
            status:
              selectedCalendarCow.status === "Hamil"
                ? "Sehat"
                : selectedCalendarCow.status,
            heatChecks: [],
          }
        : {}),
      nextDewormingDate: reproDraft.lastDewormingDate
        ? addMonthsToDate(reproDraft.lastDewormingDate, 2)
        : "",
    };

    if (
      !invalidatePreviousInsemination &&
      reproDraft.pregnancyResult === "Hamil"
    ) {
      updated = { ...updated, status: "Hamil", pregnant: true };
    } else if (
      !invalidatePreviousInsemination &&
      reproDraft.pregnancyResult === "Tidak hamil"
    ) {
      if (updated.status === "Hamil" || updated.pregnant) {
        updated = { ...updated, status: "Sehat", pregnant: false };
      }
    }

    try {
      await saveRecord("cows", updated);
      cows = cows.map((cow) => (cow.id === updated.id ? updated : cow));
      reproDraft = {
        ...reproDraft,
        heatDate: updated.heatDate || "",
        inseminationDate: updated.inseminationDate || "",
        pregnancyResult: updated.pregnancyResult || "Belum diperiksa",
      };
      reproMessage = invalidatePreviousInsemination
        ? "Tanggal birahi diperbarui. IB sebelumnya tetap tersimpan di riwayat; silakan catat IB baru jika dilakukan."
        : "Tanggal birahi terakhir dan catatan sapi berhasil disimpan.";
    } catch {
      reproMessage =
        "Gagal menyimpan catatan. Periksa ruang penyimpanan browser lalu coba lagi.";
    }
  }

  async function toggleHeatCheck(date) {
    if (!selectedCalendarCow) return;
    const checkedDates = new Set(selectedCalendarCow.heatChecks || []);
    const isNowChecked = !checkedDates.has(date);
    if (isNowChecked) checkedDates.add(date);
    else checkedDates.delete(date);

    const byDate = { ...(selectedCalendarCow.heatObservationsByDate || {}) };
    if (isNowChecked && byDate[date]?.length) {
      byDate[date] = [];
    }

    const updated = {
      ...selectedCalendarCow,
      heatChecks: [...checkedDates],
      heatObservationsByDate: byDate,
    };
    await saveRecord("cows", updated);
    cows = cows.map((cow) => (cow.id === updated.id ? updated : cow));
  }

  async function toggleHeatObservation(date, observation) {
    if (!selectedCalendarCow) return;
    const byDate = { ...(selectedCalendarCow.heatObservationsByDate || {}) };
    const previous =
      byDate[date] ||
      (date === selectedCalendarCow.heatDate
        ? selectedCalendarCow.heatObservations || []
        : []);
    const observations = new Set(previous);
    if (observations.has(observation)) observations.delete(observation);
    else observations.add(observation);
    byDate[date] = [...observations];

    const heatChecks = new Set(selectedCalendarCow.heatChecks || []);
    if (observations.size > 0) {
      heatChecks.delete(date);
    }

    let updated = {
      ...selectedCalendarCow,
      heatObservationsByDate: byDate,
      heatChecks: [...heatChecks],
    };

    if (
      observations.size > 0 &&
      selectedCalendarCow.inseminationDate &&
      date >= selectedCalendarCow.inseminationDate
    ) {
      const ibHistory = [...(selectedCalendarCow.ibHistory || [])];
      if (
        !ibHistory.some(
          (entry) => entry.date === selectedCalendarCow.inseminationDate,
        )
      ) {
        ibHistory.push({
          date: selectedCalendarCow.inseminationDate,
          result:
            selectedCalendarCow.pregnancyResult &&
            selectedCalendarCow.pregnancyResult !== "Belum diperiksa"
              ? selectedCalendarCow.pregnancyResult
              : "Gagal (birahi lagi)",
        });
      }
      updated = {
        ...updated,
        heatDate: date,
        inseminationDate: "",
        pregnancyResult: "Belum diperiksa",
        pregnant: false,
        status:
          selectedCalendarCow.status === "Hamil"
            ? "Sehat"
            : selectedCalendarCow.status,
        heatChecks: [],
        ibHistory,
      };
      reproDraft = {
        ...reproDraft,
        heatDate: date,
        inseminationDate: "",
        pregnancyResult: "Belum diperiksa",
      };
      reproMessage = `Tanda birahi teramati pada ${localDate(date)}. Sapi dicatat birahi lagi dan IB sebelumnya dipindahkan ke riwayat.`;
    }

    await saveRecord("cows", updated);
    cows = cows.map((cow) => (cow.id === updated.id ? updated : cow));
  }

  async function markCowInHeat(date) {
    if (!selectedCalendarCow) return;
    const ibHistory = [...(selectedCalendarCow.ibHistory || [])];
    if (
      selectedCalendarCow.inseminationDate &&
      !ibHistory.some(
        (entry) => entry.date === selectedCalendarCow.inseminationDate,
      )
    ) {
      ibHistory.push({
        date: selectedCalendarCow.inseminationDate,
        result:
          selectedCalendarCow.pregnancyResult &&
          selectedCalendarCow.pregnancyResult !== "Belum diperiksa"
            ? selectedCalendarCow.pregnancyResult
            : "Gagal (birahi lagi)",
      });
    }
    const updated = {
      ...selectedCalendarCow,
      heatDate: date,
      inseminationDate: "",
      pregnancyResult: "Belum diperiksa",
      pregnant: false,
      status:
        selectedCalendarCow.status === "Hamil"
          ? "Sehat"
          : selectedCalendarCow.status,
      heatChecks: [],
      ibHistory,
    };
    await saveRecord("cows", updated);
    cows = cows.map((cow) => (cow.id === updated.id ? updated : cow));
    reproDraft = {
      ...reproDraft,
      heatDate: date,
      inseminationDate: "",
      pregnancyResult: "Belum diperiksa",
    };
    reproMessage = `Sapi dicatat birahi lagi pada ${localDate(date)}. IB sebelumnya dipindahkan ke riwayat.`;
  }

  async function deleteCow(cow) {
    if (
      !(await askConfirmation({
        title: "Hapus data sapi?",
        message: `Data sapi ${cow.name} akan dihapus dari perangkat ini.`,
        confirmLabel: "Hapus sapi",
        danger: true,
      }))
    )
      return;
    await removeRecord("cows", cow.id);
    cows = cows.filter((item) => item.id !== cow.id);
  }

  async function addSchedule(event) {
    event.preventDefault();
    const record = {
      id: `schedule-${crypto.randomUUID()}`,
      kind: scheduleKind,
      title: scheduleTitle.trim(),
      detail: scheduleDetail.trim() || "Peternakan",
      date: scheduleDate,
      time: scheduleTime,
    };
    await saveRecord("schedules", record);
    schedules = [...schedules, record].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    );
    scheduleTitle = "";
    scheduleDetail = "";
    showScheduleForm = false;
  }

  async function deleteSchedule(item) {
    if (
      !(await askConfirmation({
        title: "Hapus jadwal?",
        message: `Jadwal "${item.title}" akan dihapus.`,
        confirmLabel: "Hapus jadwal",
        danger: true,
      }))
    )
      return;
    await removeRecord("schedules", item.id);
    schedules = schedules.filter((row) => row.id !== item.id);
  }

  async function addExpense(event) {
    event.preventDefault();
    const existing = expenses.find(
      (expense) => expense.id === editingExpenseId,
    );
    const record = {
      ...(existing || {}),
      id: existing?.id || `expense-${crypto.randomUUID()}`,
      name: expenseName.trim(),
      category: expenseCategory,
      detail: expenseCategory,
      amount: Number(expenseAmount),
      date: expenseDate,
    };
    await saveRecord("expenses", record);
    expenses = existing
      ? expenses.map((expense) => (expense.id === record.id ? record : expense))
      : [record, ...expenses];
    editingExpenseId = null;
    expenseName = "";
    expenseAmount = "";
    showExpenseForm = false;
  }

  function editExpense(expense) {
    editingExpenseId = expense.id;
    expenseName = expense.name;
    expenseCategory = expense.category || "Pakan";
    expenseAmount = String(expense.amount);
    expenseDate = expense.date;
    showExpenseForm = true;
    showIncomeForm = false;
    financeHistoryTab = "pengeluaran";
  }

  function startNewExpense() {
    editingExpenseId = null;
    expenseName = "";
    expenseCategory = "Pakan";
    expenseAmount = "";
    expenseDate = new Date().toISOString().slice(0, 10);
    showExpenseForm = !showExpenseForm;
    showIncomeForm = false;
  }

  async function addIncome(event) {
    event.preventDefault();
    const existing = incomes.find((income) => income.id === editingIncomeId);
    const record = {
      ...(existing || {}),
      id: existing?.id || `income-${crypto.randomUUID()}`,
      name: incomeName.trim(),
      category: incomeCategory,
      detail: incomeCategory,
      amount: Number(incomeAmount),
      date: incomeDate,
    };
    await saveRecord("incomes", record);
    incomes = existing
      ? incomes.map((income) => (income.id === record.id ? record : income))
      : [record, ...incomes];
    editingIncomeId = null;
    incomeName = "";
    incomeAmount = "";
    showIncomeForm = false;
  }

  function editIncome(income) {
    editingIncomeId = income.id;
    incomeName = income.name;
    incomeCategory = income.category || "Jual kohe";
    incomeAmount = String(income.amount);
    incomeDate = income.date;
    showIncomeForm = true;
    showExpenseForm = false;
    financeHistoryTab = "pemasukan";
  }

  function startNewIncome() {
    editingIncomeId = null;
    incomeName = "";
    incomeCategory = "Jual kohe";
    incomeAmount = "";
    incomeDate = new Date().toISOString().slice(0, 10);
    showIncomeForm = !showIncomeForm;
    showExpenseForm = false;
  }

  async function deleteExpense(expense) {
    if (
      !(await askConfirmation({
        title: "Hapus pengeluaran?",
        message: `Catatan "${expense.name}" akan dihapus.`,
        confirmLabel: "Hapus catatan",
        danger: true,
      }))
    )
      return;
    await removeRecord("expenses", expense.id);
    expenses = expenses.filter((row) => row.id !== expense.id);
  }

  async function deleteIncome(income) {
    if (
      !(await askConfirmation({
        title: "Hapus pemasukan?",
        message: `Catatan "${income.name}" akan dihapus.`,
        confirmLabel: "Hapus catatan",
        danger: true,
      }))
    )
      return;
    await removeRecord("incomes", income.id);
    incomes = incomes.filter((row) => row.id !== income.id);
  }

  function exportData() {
    const backup = {
      format: "catatan-peternak-backup",
      version: 4,
      exportedAt: new Date().toISOString(),
      profile,
      cows,
      schedules,
      expenses,
      incomes,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `catatan-peternakan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    backupMessage = "File cadangan berhasil diunduh.";
  }

  async function importData(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    backupMessage = "";
    try {
      const backup = JSON.parse(await file.text());
      const valid =
        backup?.format === "catatan-peternak-backup" &&
        [1, 2, 3, 4].includes(backup.version) &&
        backup.profile?.ownerName &&
        backup.profile?.farmName &&
        ["cows", "schedules", "expenses"].every(
          (name) =>
            Array.isArray(backup[name]) &&
            backup[name].every((row) => row && typeof row.id === "string"),
        ) &&
        (backup.incomes === undefined ||
          (Array.isArray(backup.incomes) &&
            backup.incomes.every((row) => row && typeof row.id === "string")));
      if (!valid) throw new Error("Format file cadangan tidak dikenali.");
      if (
        !(await askConfirmation({
          title: "Pulihkan data cadangan?",
          message:
            "Semua data di perangkat ini akan diganti dengan isi file cadangan.",
          confirmLabel: "Ganti data",
        }))
      )
        return;
      const normalizedBackup = { ...backup, diseases: [] };
      normalizedBackup.cows = backup.cows
        .map(normalizeCowReproduction)
        .map((cow) => ({
          ...cow,
          heatChecks: Array.isArray(cow.heatChecks) ? cow.heatChecks : [],
        }));
      normalizedBackup.incomes =
        Array.isArray(backup.incomes) &&
        backup.incomes.every((row) => row && typeof row.id === "string")
          ? backup.incomes
          : [];
      await replaceAllData(normalizedBackup);
      profile = backup.profile;
      cows = normalizedBackup.cows;
      schedules = backup.schedules;
      expenses = backup.expenses;
      incomes = normalizedBackup.incomes;
      navigateTo("home");
      backupMessage = "Data berhasil dipulihkan dari file cadangan.";
    } catch (error) {
      backupMessage = error.message || "File cadangan tidak dapat dibuka.";
    } finally {
      input.value = "";
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = text.replace(/^\uFEFF/, "");
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (char === '"' && quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && source[index + 1] === "\n") index += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = "";
      } else cell += char;
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  async function importExpenses(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    expenseImportMessage = "";
    try {
      const rows = parseCsv(await file.text());
      const expectedHeaders = [
        "nama",
        "kategori",
        "jumlah",
        "tanggal",
        "keterangan",
      ];
      const headers = rows.shift()?.map((value) => value.toLowerCase());
      if (
        !headers ||
        expectedHeaders.some((header, index) => headers[index] !== header)
      ) {
        throw new Error(
          "Kolom CSV harus berurutan: nama, kategori, jumlah, tanggal, keterangan.",
        );
      }
      const categories = ["Pakan", "Obat", "Kesehatan", "Perawatan", "Lainnya"];
      const records = rows.map((values, index) => {
        const row = Object.fromEntries(
          headers.map((header, column) => [header, values[column] || ""]),
        );
        const amount = Number(row.jumlah);
        if (
          !row.nama ||
          !Number.isFinite(amount) ||
          amount <= 0 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(row.tanggal)
        ) {
          throw new Error(
            `Data baris ${index + 2} belum benar. Isi nama, jumlah positif, dan tanggal YYYY-MM-DD.`,
          );
        }
        return {
          id: `expense-${crypto.randomUUID()}`,
          name: row.nama,
          category:
            categories.find(
              (category) =>
                category.toLowerCase() === row.kategori.toLowerCase(),
            ) || "Lainnya",
          amount,
          date: row.tanggal,
          detail: row.keterangan,
        };
      });
      if (!records.length)
        throw new Error("File CSV belum berisi baris pengeluaran.");
      for (const record of records) await saveRecord("expenses", record);
      expenses = [...records, ...expenses];
      expenseImportMessage = `${records.length} catatan pengeluaran berhasil diimpor.`;
    } catch (error) {
      expenseImportMessage = error.message || "File CSV tidak dapat dibaca.";
    } finally {
      input.value = "";
    }
  }

  function downloadExpenseSample() {
    const csv =
      "nama,kategori,jumlah,tanggal,keterangan\nPakan konsentrat,Pakan,250000,2026-10-20,Pembelian pakan mingguan\nObat cacing,Obat,85000,2026-10-20,Untuk sapi Lestari";
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "contoh-impor-pengeluaran.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function finishSetup(event) {
    event.preventDefault();
    setupError = "";
    const nextProfile = {
      ownerName: ownerName.trim(),
      farmName: farmName.trim(),
    };
    if (!nextProfile.ownerName || !nextProfile.farmName) {
      setupError = "Isi nama pemilik dan nama peternakan untuk melanjutkan.";
      return;
    }
    try {
      await saveProfile(nextProfile);
      profile = nextProfile;
    } catch {
      setupError = "Profil belum bisa disimpan di browser ini. Coba lagi.";
    }
  }

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const model = Object.defineProperties(
    {},
    {
      activeTab: { get: () => activeTab, set: (value) => (activeTab = value) },
      addCow: { get: () => addCow },
      addDaysToDate: { get: () => addDaysToDate },
      addExpense: { get: () => addExpense },
      addIncome: { get: () => addIncome },
      addMonthsToDate: { get: () => addMonthsToDate },
      addSchedule: { get: () => addSchedule },
      applyTheme: { get: () => applyTheme },
      askConfirmation: { get: () => askConfirmation },
      availableBalance: {
        get: () => availableBalance,
        set: (value) => (availableBalance = value),
      },
      backupFileInput: {
        get: () => backupFileInput,
        set: (value) => (backupFileInput = value),
      },
      backupMessage: {
        get: () => backupMessage,
        set: (value) => (backupMessage = value),
      },
      calvingEstimate: { get: () => calvingEstimate },
      cashflowTotal: {
        get: () => cashflowTotal,
        set: (value) => (cashflowTotal = value),
      },
      closeConfirmation: { get: () => closeConfirmation },
      closeCalendarDetails: { get: () => closeCalendarDetails },
      confirmModal: {
        get: () => confirmModal,
        set: (value) => (confirmModal = value),
      },
      confirmResolver: {
        get: () => confirmResolver,
        set: (value) => (confirmResolver = value),
      },
      cowAge: { get: () => cowAge },
      cowBirthDate: {
        get: () => cowBirthDate,
        set: (value) => (cowBirthDate = value),
      },
      cowBreed: { get: () => cowBreed, set: (value) => (cowBreed = value) },
      cowBreedFilter: {
        get: () => cowBreedFilter,
        set: (value) => (cowBreedFilter = value),
      },
      cowBreedOptions: {
        get: () => cowBreedOptions,
        set: (value) => (cowBreedOptions = value),
      },
      cowCategory: {
        get: () => cowCategory,
        set: (value) => (cowCategory = value),
      },
      cowCategoryFilter: {
        get: () => cowCategoryFilter,
        set: (value) => (cowCategoryFilter = value),
      },
      cowCategoryOptions: {
        get: () => cowCategoryOptions,
        set: (value) => (cowCategoryOptions = value),
      },
      cowFilter: { get: () => cowFilter, set: (value) => (cowFilter = value) },
      cowMotherId: {
        get: () => cowMotherId,
        set: (value) => (cowMotherId = value),
      },
      cowName: { get: () => cowName, set: (value) => (cowName = value) },
      cowSearch: { get: () => cowSearch, set: (value) => (cowSearch = value) },
      cowStatus: { get: () => cowStatus, set: (value) => (cowStatus = value) },
      cowTone: { get: () => cowTone },
      cows: { get: () => cows, set: (value) => (cows = value) },
      customEnd: { get: () => customEnd, set: (value) => (customEnd = value) },
      customStart: {
        get: () => customStart,
        set: (value) => (customStart = value),
      },
      dateLabel: { get: () => dateLabel },
      deleteCow: { get: () => deleteCow },
      deleteExpense: { get: () => deleteExpense },
      deleteIncome: { get: () => deleteIncome },
      deleteSchedule: { get: () => deleteSchedule },
      displayScheduleDate: { get: () => displayScheduleDate },
      downloadExpenseSample: { get: () => downloadExpenseSample },
      editCow: { get: () => editCow },
      editExpense: { get: () => editExpense },
      editIncome: { get: () => editIncome },
      editingCowId: {
        get: () => editingCowId,
        set: (value) => (editingCowId = value),
      },
      editingExpenseId: {
        get: () => editingExpenseId,
        set: (value) => (editingExpenseId = value),
      },
      editingIncomeId: {
        get: () => editingIncomeId,
        set: (value) => (editingIncomeId = value),
      },
      expandedScheduleGroups: {
        get: () => expandedScheduleGroups,
        set: (value) => (expandedScheduleGroups = value),
      },
      expenseAmount: {
        get: () => expenseAmount,
        set: (value) => (expenseAmount = value),
      },
      expenseCategory: {
        get: () => expenseCategory,
        set: (value) => (expenseCategory = value),
      },
      expenseDate: {
        get: () => expenseDate,
        set: (value) => (expenseDate = value),
      },
      expenseIcon: { get: () => expenseIcon },
      expenseImportInput: {
        get: () => expenseImportInput,
        set: (value) => (expenseImportInput = value),
      },
      expenseImportMessage: {
        get: () => expenseImportMessage,
        set: (value) => (expenseImportMessage = value),
      },
      expenseName: {
        get: () => expenseName,
        set: (value) => (expenseName = value),
      },
      expenseRange: {
        get: () => expenseRange,
        set: (value) => (expenseRange = value),
      },
      expenseRangeOptions: { get: () => expenseRangeOptions },
      expenseSearch: {
        get: () => expenseSearch,
        set: (value) => (expenseSearch = value),
      },
      expenseTotal: {
        get: () => expenseTotal,
        set: (value) => (expenseTotal = value),
      },
      expenses: { get: () => expenses, set: (value) => (expenses = value) },
      exportData: { get: () => exportData },
      farmName: { get: () => farmName, set: (value) => (farmName = value) },
      filterFinanceRows: { get: () => filterFinanceRows },
      filteredCows: {
        get: () => filteredCows,
        set: (value) => (filteredCows = value),
      },
      filteredExpenses: {
        get: () => filteredExpenses,
        set: (value) => (filteredExpenses = value),
      },
      filteredIncomes: {
        get: () => filteredIncomes,
        set: (value) => (filteredIncomes = value),
      },
      filteredRevenue: {
        get: () => filteredRevenue,
        set: (value) => (filteredRevenue = value),
      },
      financeHistoryTab: {
        get: () => financeHistoryTab,
        set: (value) => (financeHistoryTab = value),
      },
      finishSetup: { get: () => finishSetup },
      handleHeatDateChange: { get: () => handleHeatDateChange },
      hasObservedHeatAfterInsemination: {
        get: () => hasObservedHeatAfterInsemination,
      },
      heatCheckRecommendations: { get: () => heatCheckRecommendations },
      importData: { get: () => importData },
      importExpenses: { get: () => importExpenses },
      incomeAmount: {
        get: () => incomeAmount,
        set: (value) => (incomeAmount = value),
      },
      incomeCategory: {
        get: () => incomeCategory,
        set: (value) => (incomeCategory = value),
      },
      incomeDate: {
        get: () => incomeDate,
        set: (value) => (incomeDate = value),
      },
      incomeName: {
        get: () => incomeName,
        set: (value) => (incomeName = value),
      },
      incomeTotal: {
        get: () => incomeTotal,
        set: (value) => (incomeTotal = value),
      },
      incomes: { get: () => incomes, set: (value) => (incomes = value) },
      isCowInseminationActive: { get: () => isCowInseminationActive },
      isLoading: { get: () => isLoading, set: (value) => (isLoading = value) },
      knownCowBreeds: { get: () => knownCowBreeds },
      localDate: { get: () => localDate },
      markCowInHeat: { get: () => markCowInHeat },
      money: { get: () => money },
      motherName: { get: () => motherName },
      normalizeCowBreed: { get: () => normalizeCowBreed },
      normalizeCowReproduction: { get: () => normalizeCowReproduction },
      openReproductionDetails: { get: () => openReproductionDetails },
      navigateTo: { get: () => navigateTo },
      ownerName: { get: () => ownerName, set: (value) => (ownerName = value) },
      parseCsv: { get: () => parseCsv },
      pregnancyCheckRecommendation: {
        get: () => pregnancyCheckRecommendation,
        set: (value) => (pregnancyCheckRecommendation = value),
      },
      pregnancyLikelihood: {
        get: () => pregnancyLikelihood,
        set: (value) => (pregnancyLikelihood = value),
      },
      pregnancyLikelihoodForCow: { get: () => pregnancyLikelihoodForCow },
      profile: { get: () => profile, set: (value) => (profile = value) },
      reproDraft: {
        get: () => reproDraft,
        set: (value) => (reproDraft = value),
      },
      reproMessage: {
        get: () => reproMessage,
        set: (value) => (reproMessage = value),
      },
      reproductiveCowLabel: { get: () => reproductiveCowLabel },
      saveReproductionDetails: { get: () => saveReproductionDetails },
      scheduleDate: {
        get: () => scheduleDate,
        set: (value) => (scheduleDate = value),
      },
      scheduleDetail: {
        get: () => scheduleDetail,
        set: (value) => (scheduleDetail = value),
      },
      scheduleIcon: { get: () => scheduleIcon },
      scheduleKind: {
        get: () => scheduleKind,
        set: (value) => (scheduleKind = value),
      },
      scheduleTime: {
        get: () => scheduleTime,
        set: (value) => (scheduleTime = value),
      },
      scheduleTitle: {
        get: () => scheduleTitle,
        set: (value) => (scheduleTitle = value),
      },
      scheduleTone: { get: () => scheduleTone },
      schedules: { get: () => schedules, set: (value) => (schedules = value) },
      seedCows: { get: () => seedCows },
      seedExpenses: { get: () => seedExpenses },
      seedSchedules: { get: () => seedSchedules },
      selectedCalendarCow: {
        get: () => selectedCalendarCow,
        set: (value) => (selectedCalendarCow = value),
      },
      selectedCalendarCowId: {
        get: () => selectedCalendarCowId,
        set: (value) => (selectedCalendarCowId = value),
      },
      setupError: {
        get: () => setupError,
        set: (value) => (setupError = value),
      },
      showCowForm: {
        get: () => showCowForm,
        set: (value) => (showCowForm = value),
      },
      showExpenseForm: {
        get: () => showExpenseForm,
        set: (value) => (showExpenseForm = value),
      },
      showIncomeForm: {
        get: () => showIncomeForm,
        set: (value) => (showIncomeForm = value),
      },
      showScheduleForm: {
        get: () => showScheduleForm,
        set: (value) => (showScheduleForm = value),
      },
      startNewCow: { get: () => startNewCow },
      startNewExpense: { get: () => startNewExpense },
      startNewIncome: { get: () => startNewIncome },
      stats: { get: () => stats, set: (value) => (stats = value) },
      theme: { get: () => theme, set: (value) => (theme = value) },
      todayKey: { get: () => todayKey },
      toggleHeatCheck: { get: () => toggleHeatCheck },
      toggleHeatObservation: { get: () => toggleHeatObservation },
      toggleTheme: { get: () => toggleTheme },
      totalCapital: {
        get: () => totalCapital,
        set: (value) => (totalCapital = value),
      },
      upcomingScheduleGroups: {
        get: () => upcomingScheduleGroups,
        set: (value) => (upcomingScheduleGroups = value),
      },
      upcomingSchedules: {
        get: () => upcomingSchedules,
        set: (value) => (upcomingSchedules = value),
      },
      updateCowStatus: { get: () => updateCowStatus },
      weaningDateForCow: { get: () => weaningDateForCow },
    },
  );
  return { model };
}
