// Cattle and date calculations shared by the farm pages.
export function createCattleHelpers({ knownCowBreeds }) {
  function localDate(date) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }
  function cowAge(birthDate) {
    if (!birthDate) return "";
    const birth = new Date(`${birthDate}T00:00:00`);
    const today = new Date(`${todayKey()}T00:00:00`);
    if (birth > today) return "Belum lahir";
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return (
      [
        years ? `${years} tahun` : "",
        months ? `${months} bulan` : "",
        days ? `${days} hari` : "",
      ]
        .filter(Boolean)
        .join(" ") || "0 hari"
    );
  }
  function todayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
  function cowTone(cow) {
    return cow.status === "Sakit" ? "peach" : cow.pregnant ? "lilac" : "mint";
  }
  function normalizeCowBreed(breed) {
    const value = String(breed || "").trim();
    if (/^simental$/i.test(value)) return "Simmental";
    if (/^peranakan\s+ongole$/i.test(value)) return "PO";
    return (
      knownCowBreeds.find(
        (item) =>
          item.toLocaleLowerCase("id") === value.toLocaleLowerCase("id"),
      ) || value
    );
  }
  function scheduleTone(kind) {
    return kind === "Birahi" ? "peach" : kind === "Pakan" ? "sage" : "mint";
  }
  function scheduleIcon(kind) {
    return kind === "Birahi"
      ? "spark"
      : kind === "Pakan"
        ? "leaf"
        : kind === "Sapih"
          ? "cow"
          : "stethoscope";
  }
  function expenseIcon(category) {
    return category === "Kesehatan" || category === "Obat"
      ? "stethoscope"
      : category === "Perawatan"
        ? "barn"
        : "leaf";
  }
  function money(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  function displayScheduleDate(date) {
    const value = new Date(`${date}T00:00:00`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrowValue = new Date(now);
    tomorrowValue.setDate(now.getDate() + 1);
    if (value.getTime() === now.getTime()) return "Hari ini";
    if (value.getTime() === tomorrowValue.getTime()) return "Besok";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(value);
  }
  function addDaysToDate(date, days) {
    if (!date) return "";
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() + days);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  function calvingEstimate(inseminationDate) {
    if (!inseminationDate) return null;
    const expectedDate = addDaysToDate(inseminationDate, 283);
    return {
      expectedDate,
      earliestDate: addDaysToDate(inseminationDate, 279),
      latestDate: addDaysToDate(inseminationDate, 287),
      preparationStart: addDaysToDate(expectedDate, -28),
      preparationEnd: addDaysToDate(expectedDate, -14),
    };
  }
  function hasObservedHeatAfterInsemination(cow) {
    if (!cow?.inseminationDate || !cow.heatObservationsByDate) return false;
    return Object.entries(cow.heatObservationsByDate).some(
      ([date, observations]) =>
        date > cow.inseminationDate &&
        Array.isArray(observations) &&
        observations.length > 0,
    );
  }
  function isCowInseminationActive(cow) {
    if (!cow?.inseminationDate) return false;
    if (cow.pregnancyResult === "Tidak hamil") return false;
    if (cow.heatDate && cow.heatDate > cow.inseminationDate) return false;
    if (hasObservedHeatAfterInsemination(cow)) return false;
    return true;
  }
  function normalizeCowReproduction(cow) {
    if (
      cow.heatDate &&
      cow.inseminationDate &&
      cow.heatDate > cow.inseminationDate
    ) {
      const ibHistory = [...(cow.ibHistory || [])];
      if (!ibHistory.some((entry) => entry.date === cow.inseminationDate)) {
        const result =
          cow.pregnancyResult && cow.pregnancyResult !== "Belum diperiksa"
            ? cow.pregnancyResult
            : "Gagal (birahi lagi)";
        ibHistory.push({ date: cow.inseminationDate, result });
      }
      return {
        ...cow,
        ibHistory,
        inseminationDate: "",
        pregnancyResult: "Belum diperiksa",
        pregnant: false,
        status: cow.status === "Hamil" ? "Sehat" : cow.status,
        heatChecks: [],
      };
    }
    return cow;
  }
  return {
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
  };
}
