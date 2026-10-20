<script>
  import { onMount } from 'svelte';

  let activeTab = $state('home');
  let cowFilter = $state('Semua');
  let selectedCalendarCowId = $state(null);
  let reproDraft = $state({ heatDate: '', inseminationDate: '', pregnancyResult: 'Belum diperiksa', lastDewormingDate: '', nextDewormingDate: '', calvingDate: '' });
  let reproMessage = $state('');
  let profile = $state(null);
  let isLoading = $state(true);
  let ownerName = $state('');
  let farmName = $state('');
  let setupError = $state('');
  let backupMessage = $state('');
  let backupFileInput = $state(null);
  let expenseImportInput = $state(null);
  let expenseImportMessage = $state('');
  let confirmModal = $state(null);
  let confirmResolver = null;
  let cows = $state([]);
  let schedules = $state([]);
  let expenses = $state([]);
  let incomes = $state([]);
  let showCowForm = $state(false);
  let showScheduleForm = $state(false);
  let showExpenseForm = $state(false);
  let showIncomeForm = $state(false);
  let cowName = $state('');
  let cowBreed = $state('PO');
  let cowStatus = $state('Sehat');
  let cowBirthDate = $state('');
  let scheduleTitle = $state('');
  let scheduleKind = $state('Birahi');
  let scheduleDate = $state(new Date().toISOString().slice(0, 10));
  let scheduleTime = $state('09:00');
  let scheduleDetail = $state('');
  let expenseName = $state('');
  let expenseCategory = $state('Pakan');
  let expenseAmount = $state('');
  let expenseSearch = $state('');
  let expenseDate = $state(new Date().toISOString().slice(0, 10));
  let incomeName = $state('');
  let incomeCategory = $state('Jual kohe');
  let incomeAmount = $state('');
  let incomeDate = $state(new Date().toISOString().slice(0, 10));
  let expenseRange = $state('Semua');
  let customStart = $state(new Date().toISOString().slice(0, 10));
  let customEnd = $state(new Date().toISOString().slice(0, 10));

  const seedCows = [];
  const seedSchedules = [];
  const seedExpenses = [];
  const expenseRangeOptions = ['Semua', 'Hari ini', 'Minggu ini', 'Bulan ini', 'Bulan lalu', 'Filter tanggal'];
  const demoRecordIds = {
    cows: ['cow-024', 'cow-018', 'cow-031', 'cow-011'],
    schedules: ['schedule-checkup', 'schedule-heat', 'schedule-feed'],
    expenses: ['expense-feed', 'expense-medicine', 'expense-barn'],
  };

  function askConfirmation({ title, message, confirmLabel = 'Ya, lanjutkan', danger = false }) {
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

  function openProfileDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB tidak tersedia'));
      const request = indexedDB.open('catatan-peternak', 4);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        for (const store of ['cows', 'schedules', 'expenses', 'incomes', 'diseases']) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function loadProfile() {
    try {
      const db = await openProfileDB();
      const saved = await new Promise((resolve, reject) => {
        const request = db.transaction('settings', 'readonly').objectStore('settings').get('profile');
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return saved;
    } catch {
      try { return JSON.parse(localStorage.getItem('catatan-peternak-profile') || 'null'); }
      catch { return null; }
    }
  }

  async function saveProfile(nextProfile) {
    try {
      const db = await openProfileDB();
      await new Promise((resolve, reject) => {
        const request = db.transaction('settings', 'readwrite').objectStore('settings').put(nextProfile, 'profile');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch {
      localStorage.setItem('catatan-peternak-profile', JSON.stringify(nextProfile));
    }
  }

  async function loadCollection(storeName, defaults) {
    try {
      const db = await openProfileDB();
      const rows = await new Promise((resolve, reject) => {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (rows.length) { db.close(); return rows; }
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        for (const row of defaults) transaction.objectStore(storeName).put(row);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
      return defaults;
    } catch {
      try {
        const saved = JSON.parse(localStorage.getItem(`catatan-peternak-${storeName}`) || 'null');
        if (Array.isArray(saved)) return saved;
        localStorage.setItem(`catatan-peternak-${storeName}`, JSON.stringify(defaults));
      } catch { /* Use starter records when browser storage is unavailable. */ }
      return defaults;
    }
  }

  async function saveRecord(storeName, record) {
    try {
      const db = await openProfileDB();
      await new Promise((resolve, reject) => {
        const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(record);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch {
      const rows = JSON.parse(localStorage.getItem(`catatan-peternak-${storeName}`) || '[]');
      localStorage.setItem(`catatan-peternak-${storeName}`, JSON.stringify([...rows.filter((row) => row.id !== record.id), record]));
    }
  }

  async function removeRecord(storeName, id) {
    try {
      const db = await openProfileDB();
      await new Promise((resolve, reject) => {
        const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch {
      const rows = JSON.parse(localStorage.getItem(`catatan-peternak-${storeName}`) || '[]');
      localStorage.setItem(`catatan-peternak-${storeName}`, JSON.stringify(rows.filter((row) => row.id !== id)));
    }
  }

  async function removePreviousDemoRecords() {
    try {
      const db = await openProfileDB();
      for (const [storeName, ids] of Object.entries(demoRecordIds)) {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          for (const id of ids) transaction.objectStore(storeName).delete(id);
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
        });
      }
      db.close();
    } catch { /* The fallback below handles browsers without IndexedDB. */ }
    for (const [storeName, ids] of Object.entries(demoRecordIds)) {
      try {
        const key = `catatan-peternak-${storeName}`;
        const rows = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(rows.filter((row) => !ids.includes(row.id))));
      } catch { /* Ignore unavailable browser storage. */ }
    }
  }

  function localDate(date) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`)); }
  function todayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  function cowTone(cow) { return cow.status === 'Sakit' ? 'peach' : cow.pregnant ? 'lilac' : 'mint'; }
  function scheduleTone(kind) { return kind === 'Birahi' ? 'peach' : kind === 'Pakan' ? 'sage' : 'mint'; }
  function scheduleIcon(kind) { return kind === 'Birahi' ? 'spark' : kind === 'Pakan' ? 'leaf' : kind === 'Sapih' ? 'cow' : 'stethoscope'; }
  function expenseIcon(category) { return category === 'Kesehatan' || category === 'Obat' ? 'stethoscope' : category === 'Perawatan' ? 'barn' : 'leaf'; }
  function money(amount) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount); }
  function displayScheduleDate(date) {
    const value = new Date(`${date}T00:00:00`);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const tomorrowValue = new Date(now); tomorrowValue.setDate(now.getDate() + 1);
    if (value.getTime() === now.getTime()) return 'Hari ini';
    if (value.getTime() === tomorrowValue.getTime()) return 'Besok';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(value);
  }
  function addDaysToDate(date, days) {
    if (!date) return '';
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() + days);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  function reproductiveCowLabel(cow) {
    const nextHeatCheck = heatCheckRecommendations(cow)[0];
    if (nextHeatCheck) return `Pantau birahi: ${localDate(nextHeatCheck)}`;
    if (cow.pregnancyResult && cow.pregnancyResult !== 'Belum diperiksa') return `Hasil PKB: ${cow.pregnancyResult}`;
    if (cow.inseminationDate) return `Rekomendasi PKB: ${localDate(addDaysToDate(cow.inseminationDate, 60))}`;
    return 'Belum ada jadwal birahi atau IB';
  }
  function weaningDateForCow(cow) {
    return cow.status === 'Menyusui' && cow.calvingDate ? addMonthsToDate(cow.calvingDate, 5) : '';
  }
  function pregnancyLikelihoodForCow(cow) {
    if (!cow?.inseminationDate || cow.pregnancyResult === 'Hamil' || cow.pregnancyResult === 'Tidak hamil') return null;
    const today = todayKey();
    const checkedCycles = heatCheckRecommendations(cow)
      .filter((date) => date <= today && cow.heatChecks?.includes(date));
    if (!checkedCycles.length) return null;
    return { percent: checkedCycles.length >= 2 ? 80 : 70, cycles: checkedCycles.length };
  }
  function heatCheckRecommendations(cow) {
    const anchor = cow.inseminationDate || cow.heatDate;
    if (!anchor) return [];
    const pregnancyCheckDate = cow.inseminationDate ? addDaysToDate(cow.inseminationDate, 60) : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dates = [];
    for (let cycle = 1; cycle <= 20; cycle += 1) {
      const date = addDaysToDate(anchor, cycle * 21);
      if (pregnancyCheckDate && date >= pregnancyCheckDate) break;
      dates.push(date);
    }
    return dates;
  }

  let stats = $derived([
    { label: 'Semua ternak', value: String(cows.length), unit: 'ekor', icon: 'cow', tone: 'sage', note: 'Total sapi' },
    { label: 'Sehat', value: String(cows.filter((cow) => cow.status === 'Sehat').length), unit: 'ekor', icon: 'heart', tone: 'mint', note: 'Kondisi baik' },
    { label: 'Sakit', value: String(cows.filter((cow) => cow.status === 'Sakit').length), unit: 'ekor', icon: 'activity', tone: 'peach', note: 'Perlu dipantau' },
    { label: 'Hamil', value: String(cows.filter((cow) => cow.status === 'Hamil' || cow.pregnant).length), unit: 'ekor', icon: 'baby', tone: 'lilac', note: 'Dalam pemantauan' },
    { label: 'Menyusui', value: String(cows.filter((cow) => cow.status === 'Menyusui').length), unit: 'ekor', icon: 'cow', tone: 'sage', note: 'Perlu dipantau' },
  ]);
  function filterFinanceRows(rows) {
    const query = expenseSearch.trim().toLocaleLowerCase('id');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start;
    let end;
    if (expenseRange === 'Semua') {
      return rows.filter((row) => !query || row.name.toLocaleLowerCase('id').includes(query));
    } else if (expenseRange === 'Hari ini') {
      start = end = today;
    } else if (expenseRange === 'Minggu ini') {
      start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (expenseRange === 'Bulan lalu') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (expenseRange === 'Filter tanggal') {
      start = customStart ? new Date(`${customStart}T00:00:00`) : null;
      end = customEnd ? new Date(`${customEnd}T00:00:00`) : null;
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    const startKey = start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : '';
    const endKey = end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}` : '9999-12-31';
    return rows.filter((row) => row.date >= startKey && row.date <= endKey)
      .filter((row) => !query || row.name.toLocaleLowerCase('id').includes(query));
  }
  let filteredExpenses = $derived.by(() => filterFinanceRows(expenses));
  let filteredIncomes = $derived.by(() => filterFinanceRows(incomes));
  let expenseTotal = $derived(filteredExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0));
  let incomeTotal = $derived(filteredIncomes.reduce((total, income) => total + Number(income.amount || 0), 0));
  let cashflowTotal = $derived(incomeTotal - expenseTotal);
  let filteredCows = $derived(cows.filter((cow) => cowFilter === 'Semua' || (cowFilter === 'Hamil' ? cow.status === 'Hamil' || cow.pregnant : cow.status === cowFilter)));
  let selectedCalendarCow = $derived(cows.find((cow) => cow.id === selectedCalendarCowId) || null);
  let pregnancyCheckRecommendation = $derived(selectedCalendarCow?.inseminationDate && (!selectedCalendarCow.pregnancyResult || selectedCalendarCow.pregnancyResult === 'Belum diperiksa') ? addDaysToDate(selectedCalendarCow.inseminationDate, 60) : null);
  let pregnancyLikelihood = $derived(pregnancyLikelihoodForCow(selectedCalendarCow));
  let upcomingSchedules = $derived.by(() => {
    const today = todayKey();
    const items = schedules
      .filter((item) => item.date >= today)
      .map((item) => ({ ...item, source: 'manual' }));
    for (const cow of cows) {
      const detail = `${cow.name} · Sapi #${cow.code}`;
      for (const date of heatCheckRecommendations(cow)) {
        if (date >= today) items.push({ id: `heat-${cow.id}-${date}`, source: 'cow', cow, kind: 'Birahi', title: 'Pantau birahi siklus 21 hari', detail, date, time: '' });
      }
      if (cow.inseminationDate && (!cow.pregnancyResult || cow.pregnancyResult === 'Belum diperiksa')) {
        const date = addDaysToDate(cow.inseminationDate, 60);
        if (date >= today) items.push({ id: `pkb-${cow.id}`, source: 'cow', cow, kind: 'PKB', title: 'Pemeriksaan kebuntingan (PKB)', detail, date, time: '' });
      }
      if (cow.nextDewormingDate && cow.nextDewormingDate >= today) {
        items.push({ id: `deworm-${cow.id}`, source: 'cow', cow, kind: 'Obat cacing', title: 'Jadwal obat cacing', detail, date: cow.nextDewormingDate, time: '' });
      }
      const weaningDate = weaningDateForCow(cow);
      if (weaningDate && weaningDate >= today) {
        items.push({ id: `weaning-${cow.id}`, source: 'cow', cow, kind: 'Sapih', title: 'Jadwal sapih pedet', detail, date: weaningDate, time: '' });
      }
    }
    return items.sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`));
  });

  onMount(async () => {
    await removePreviousDemoRecords();
    [profile, cows, schedules, expenses, incomes] = await Promise.all([
      loadProfile(),
      loadCollection('cows', seedCows),
      loadCollection('schedules', seedSchedules),
      loadCollection('expenses', seedExpenses),
      loadCollection('incomes', []),
    ]);
    isLoading = false;
  });

  async function addCow(event) {
    event.preventDefault();
    const record = { id: `cow-${crypto.randomUUID()}`, name: cowName.trim(), code: String(Date.now()).slice(-4), breed: cowBreed, status: cowStatus, pregnant: cowStatus === 'Hamil', birthDate: cowBirthDate || null };
    await saveRecord('cows', record);
    cows = [...cows, record]; cowName = ''; cowBreed = 'PO'; cowStatus = 'Sehat'; cowBirthDate = ''; showCowForm = false;
  }

  async function updateCowStatus(cow, status) {
    const updated = { ...cow, status, pregnant: status === 'Hamil' };
    await saveRecord('cows', updated);
    cows = cows.map((item) => item.id === cow.id ? updated : item);
  }

  function openReproductionDetails(cow) {
    selectedCalendarCowId = cow.id;
    reproDraft = {
      heatDate: cow.heatDate || '',
      inseminationDate: cow.inseminationDate || '',
      pregnancyResult: cow.pregnancyResult || 'Belum diperiksa',
      lastDewormingDate: cow.lastDewormingDate || '',
      nextDewormingDate: cow.lastDewormingDate ? addMonthsToDate(cow.lastDewormingDate, 2) : '',
      calvingDate: cow.calvingDate || '',
    };
    reproMessage = '';
  }

  function addMonthsToDate(dateString, months) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const targetMonthIndex = month - 1 + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }

  async function saveReproductionDetails(event) {
    event.preventDefault();
    if (!selectedCalendarCow) return;
    let updated = {
      ...selectedCalendarCow,
      ...reproDraft,
      nextDewormingDate: reproDraft.lastDewormingDate ? addMonthsToDate(reproDraft.lastDewormingDate, 2) : '',
    };
    if (reproDraft.pregnancyResult === 'Hamil') updated = { ...updated, status: 'Hamil', pregnant: true };
    else if (reproDraft.pregnancyResult === 'Tidak hamil' && (updated.status === 'Hamil' || updated.pregnant)) updated = { ...updated, status: 'Sehat', pregnant: false };
    await saveRecord('cows', updated);
    cows = cows.map((cow) => cow.id === updated.id ? updated : cow);
    reproMessage = 'Jadwal dan catatan sapi berhasil disimpan.';
  }

  async function toggleHeatCheck(date) {
    if (!selectedCalendarCow) return;
    const checkedDates = new Set(selectedCalendarCow.heatChecks || []);
    if (checkedDates.has(date)) checkedDates.delete(date);
    else checkedDates.add(date);
    const updated = { ...selectedCalendarCow, heatChecks: [...checkedDates] };
    await saveRecord('cows', updated);
    cows = cows.map((cow) => cow.id === updated.id ? updated : cow);
  }

  async function deleteCow(cow) {
    if (!await askConfirmation({ title: 'Hapus data sapi?', message: `Data sapi ${cow.name} akan dihapus dari perangkat ini.`, confirmLabel: 'Hapus sapi', danger: true })) return;
    await removeRecord('cows', cow.id);
    cows = cows.filter((item) => item.id !== cow.id);
  }

  async function addSchedule(event) {
    event.preventDefault();
    const record = { id: `schedule-${crypto.randomUUID()}`, kind: scheduleKind, title: scheduleTitle.trim(), detail: scheduleDetail.trim() || 'Peternakan', date: scheduleDate, time: scheduleTime };
    await saveRecord('schedules', record);
    schedules = [...schedules, record].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    scheduleTitle = ''; scheduleDetail = ''; showScheduleForm = false;
  }

  async function deleteSchedule(item) {
    if (!await askConfirmation({ title: 'Hapus jadwal?', message: `Jadwal "${item.title}" akan dihapus.`, confirmLabel: 'Hapus jadwal', danger: true })) return;
    await removeRecord('schedules', item.id);
    schedules = schedules.filter((row) => row.id !== item.id);
  }

  async function addExpense(event) {
    event.preventDefault();
    const record = { id: `expense-${crypto.randomUUID()}`, name: expenseName.trim(), category: expenseCategory, detail: expenseCategory, amount: Number(expenseAmount), date: expenseDate };
    await saveRecord('expenses', record);
    expenses = [record, ...expenses]; expenseName = ''; expenseAmount = ''; showExpenseForm = false;
  }

  async function addIncome(event) {
    event.preventDefault();
    const record = { id: `income-${crypto.randomUUID()}`, name: incomeName.trim(), category: incomeCategory, detail: incomeCategory, amount: Number(incomeAmount), date: incomeDate };
    await saveRecord('incomes', record);
    incomes = [record, ...incomes];
    incomeName = ''; incomeAmount = ''; showIncomeForm = false;
  }

  async function deleteExpense(expense) {
    if (!await askConfirmation({ title: 'Hapus pengeluaran?', message: `Catatan "${expense.name}" akan dihapus.`, confirmLabel: 'Hapus catatan', danger: true })) return;
    await removeRecord('expenses', expense.id);
    expenses = expenses.filter((row) => row.id !== expense.id);
  }

  async function deleteIncome(income) {
    if (!await askConfirmation({ title: 'Hapus pemasukan?', message: `Catatan "${income.name}" akan dihapus.`, confirmLabel: 'Hapus catatan', danger: true })) return;
    await removeRecord('incomes', income.id);
    incomes = incomes.filter((row) => row.id !== income.id);
  }

  function exportData() {
    const backup = {
      format: 'catatan-peternak-backup',
      version: 4,
      exportedAt: new Date().toISOString(),
      profile,
      cows,
      schedules,
      expenses,
      incomes,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catatan-peternakan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    backupMessage = 'File cadangan berhasil diunduh.';
  }

  async function replaceAllData(backup) {
    const collectionNames = ['cows', 'schedules', 'expenses', 'incomes', 'diseases'];
    try {
      const db = await openProfileDB();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings', ...collectionNames], 'readwrite');
        transaction.objectStore('settings').put(backup.profile, 'profile');
        for (const name of collectionNames) {
          const store = transaction.objectStore(name);
          store.clear();
          for (const row of backup[name]) store.put(row);
        }
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Import dibatalkan'));
      });
      db.close();
    } catch {
      localStorage.setItem('catatan-peternak-profile', JSON.stringify(backup.profile));
      for (const name of collectionNames) localStorage.setItem(`catatan-peternak-${name}`, JSON.stringify(backup[name]));
    }
  }

  async function importData(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    backupMessage = '';
    try {
      const backup = JSON.parse(await file.text());
      const valid = backup?.format === 'catatan-peternak-backup'
        && [1, 2, 3, 4].includes(backup.version)
        && backup.profile?.ownerName
        && backup.profile?.farmName
        && ['cows', 'schedules', 'expenses'].every((name) => Array.isArray(backup[name]) && backup[name].every((row) => row && typeof row.id === 'string'))
        && (backup.incomes === undefined || (Array.isArray(backup.incomes) && backup.incomes.every((row) => row && typeof row.id === 'string')));
      if (!valid) throw new Error('Format file cadangan tidak dikenali.');
      if (!await askConfirmation({ title: 'Pulihkan data cadangan?', message: 'Semua data di perangkat ini akan diganti dengan isi file cadangan.', confirmLabel: 'Ganti data' })) return;
      const normalizedBackup = { ...backup, diseases: [] };
      normalizedBackup.cows = backup.cows.map((cow) => ({ ...cow, heatChecks: Array.isArray(cow.heatChecks) ? cow.heatChecks : [] }));
      normalizedBackup.incomes = Array.isArray(backup.incomes) && backup.incomes.every((row) => row && typeof row.id === 'string') ? backup.incomes : [];
      await replaceAllData(normalizedBackup);
      profile = backup.profile;
      cows = normalizedBackup.cows;
      schedules = backup.schedules;
      expenses = backup.expenses;
      incomes = normalizedBackup.incomes;
      activeTab = 'home';
      backupMessage = 'Data berhasil dipulihkan dari file cadangan.';
    } catch (error) {
      backupMessage = error.message || 'File cadangan tidak dapat dibuka.';
    } finally {
      input.value = '';
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    const source = text.replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (char === '"' && quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && source[index + 1] === '\n') index += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = []; cell = '';
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
    expenseImportMessage = '';
    try {
      const rows = parseCsv(await file.text());
      const expectedHeaders = ['nama', 'kategori', 'jumlah', 'tanggal', 'keterangan'];
      const headers = rows.shift()?.map((value) => value.toLowerCase());
      if (!headers || expectedHeaders.some((header, index) => headers[index] !== header)) {
        throw new Error('Kolom CSV harus berurutan: nama, kategori, jumlah, tanggal, keterangan.');
      }
      const categories = ['Pakan', 'Obat', 'Kesehatan', 'Perawatan', 'Lainnya'];
      const records = rows.map((values, index) => {
        const row = Object.fromEntries(headers.map((header, column) => [header, values[column] || '']));
        const amount = Number(row.jumlah);
        if (!row.nama || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(row.tanggal)) {
          throw new Error(`Data baris ${index + 2} belum benar. Isi nama, jumlah positif, dan tanggal YYYY-MM-DD.`);
        }
        return {
          id: `expense-${crypto.randomUUID()}`,
          name: row.nama,
          category: categories.find((category) => category.toLowerCase() === row.kategori.toLowerCase()) || 'Lainnya',
          amount,
          date: row.tanggal,
          detail: row.keterangan,
        };
      });
      if (!records.length) throw new Error('File CSV belum berisi baris pengeluaran.');
      for (const record of records) await saveRecord('expenses', record);
      expenses = [...records, ...expenses];
      expenseImportMessage = `${records.length} catatan pengeluaran berhasil diimpor.`;
    } catch (error) {
      expenseImportMessage = error.message || 'File CSV tidak dapat dibaca.';
    } finally {
      input.value = '';
    }
  }

  function downloadExpenseSample() {
    const csv = 'nama,kategori,jumlah,tanggal,keterangan\nPakan konsentrat,Pakan,250000,2026-10-20,Pembelian pakan mingguan\nObat cacing,Obat,85000,2026-10-20,Untuk sapi Lestari';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contoh-impor-pengeluaran.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function finishSetup(event) {
    event.preventDefault();
    setupError = '';
    const nextProfile = { ownerName: ownerName.trim(), farmName: farmName.trim() };
    if (!nextProfile.ownerName || !nextProfile.farmName) {
      setupError = 'Isi nama pemilik dan nama peternakan untuk melanjutkan.';
      return;
    }
    try {
      await saveProfile(nextProfile);
      profile = nextProfile;
    } catch {
      setupError = 'Profil belum bisa disimpan di browser ini. Coba lagi.';
    }
  }

  const dateLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
</script>

{#snippet Icon(name, size = 20)}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {#if name === 'home'}<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />
    {:else if name === 'cow'}<path d="M5 9 3 6l4 1m12 2 2-3-4 1M5 10a7 7 0 0 1 14 0v5a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z"/><path d="M9 12h.01M15 12h.01M9 16h6M8 19v2m8-2v2" />
    {:else if name === 'wallet'}<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18m-5 5h.01M7 5V3h11" />
    {:else if name === 'heart'}<path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.8 2.6Z"/><path d="M8 12h2l1-2 2 4 1-2h2" />
    {:else if name === 'activity'}<path d="M3 12h4l3-8 4 16 3-8h4" />
    {:else if name === 'baby'}<circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M9 15c1.8 1.4 4.2 1.4 6 0M12 3v3" />
    {:else if name === 'calendar'}<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18" />
    {:else if name === 'stethoscope'}<path d="M6 3v5a4 4 0 0 0 8 0V3m-8 0H4m10 0h2m-6 9v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="11" r="2"/><path d="M10 3v2" />
    {:else if name === 'spark'}<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    {:else if name === 'leaf'}<path d="M20 4c-9 0-14 4-14 10a6 6 0 0 0 6 6c6 0 10-7 8-16Z"/><path d="M4 21c3-5 7-8 12-11" />
    {:else if name === 'arrow'}<path d="M5 12h14m-6-6 6 6-6 6" />
    {:else if name === 'plus'}<path d="M12 5v14m-7-7h14" />
    {:else if name === 'barn'}<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/><path d="M3 10h18M9 20v-6h6v6" />
    {:else if name === 'bell'}<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" />
    {:else if name === 'chevron'}<path d="m9 18 6-6-6-6" />
    {:else if name === 'download'}<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
    {:else if name === 'upload'}<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12" />{/if}
  </svg>
{/snippet}

{#if isLoading}
  <main class="setup-page"><div class="setup-loading"><span class="setup-brand-mark">{@render Icon('cow', 22)}</span><p>Menyiapkan peternakan...</p></div></main>
{:else if !profile}
  <main class="setup-page">
    <section class="setup-card">
      <span class="setup-brand-mark">{@render Icon('cow', 24)}</span>
      <p class="setup-eyebrow">SELAMAT DATANG DI RANCH</p>
      <h1>Mulai catatan<br />peternakanmu.</h1>
      <p class="setup-description">Kenalan dulu, yuk. Informasi ini disimpan di browser perangkatmu.</p>
      <form class="setup-form" onsubmit={finishSetup}>
        <label for="owner-name">Nama pemilik</label>
        <input id="owner-name" bind:value={ownerName} autocomplete="name" placeholder="Contoh: Andi Saputra" required />
        <label for="farm-name">Nama peternakan</label>
        <input id="farm-name" bind:value={farmName} autocomplete="organization" placeholder="Contoh: Peternakan Makmur" required />
        {#if setupError}<p class="setup-error" role="alert">{setupError}</p>{/if}
        <button class="setup-submit" type="submit">Mulai mencatat <span>{@render Icon('arrow', 17)}</span></button>
      </form>
      <p class="setup-privacy">Data profil tersimpan lokal di browser ini.</p>
    </section>
  </main>
{:else}
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#home" onclick={() => activeTab = 'home'} aria-label="Ranch Home">
      <span class="brand-mark">{@render Icon('cow', 21)}</span>
      <span class="brand-farm-name">{profile.farmName}</span>
    </a>
    <div class="top-actions">
      <button class="avatar" aria-label="Pemilik {profile.ownerName}">{profile.ownerName.slice(0, 1).toUpperCase()}</button>
    </div>
  </header>

  <main class="main-content">
    {#if activeTab === 'home'}
      <section class="welcome-row">
      <div><p class="eyebrow">{dateLabel} · {profile.farmName}</p><h1>Selamat datang, <span>{profile.ownerName}</span> 👋</h1><p class="subheading">Ini ringkasan peternakanmu hari ini.</p></div>
      </section>

      <section class="section-block">
        <div class="section-heading"><div><p class="eyebrow">KONDISI TERNAK</p><h2>Ringkasan sapi</h2></div><button class="text-link" onclick={() => activeTab = 'sapi'}>Lihat semua {@render Icon('arrow', 15)}</button></div>
        <div class="stats-grid">
          {#each stats as stat}
            <article class="stat-card"><div class="stat-top"><span class="stat-icon {stat.tone}">{@render Icon(stat.icon, 19)}</span><span class="stat-note">{stat.note}</span></div><div class="stat-value">{stat.value}<span>{stat.unit}</span></div><p class="stat-label">{stat.label}</p></article>
          {/each}
        </div>
      </section>

      <section class="section-block schedule-section">
        <div class="section-heading"><div><p class="eyebrow">JANGAN TERLEWAT</p><h2>Jadwal mendatang</h2></div></div>
        <div class="schedule-list">
          {#each upcomingSchedules as item (item.id)}
            <article class="schedule-card"><span class="schedule-icon {scheduleTone(item.kind)}">{@render Icon(scheduleIcon(item.kind), 19)}</span><div class="schedule-info"><span class="schedule-kind">{item.kind}</span><h3>{item.title}</h3><p>{item.detail}</p></div><div class="schedule-time"><strong>{displayScheduleDate(item.date)}</strong><span>{item.time || 'Pengingat'}</span></div>{#if item.source === 'manual'}<button class="delete-record" aria-label="Hapus jadwal" onclick={() => deleteSchedule(item)}>×</button>{:else}<button class="schedule-open" aria-label="Buka detail sapi {item.cow.name}" onclick={() => { activeTab = 'kalender'; openReproductionDetails(item.cow); }}>{@render Icon('chevron', 17)}</button>{/if}</article>
          {/each}
        </div>
        {#if upcomingSchedules.length === 0}<p class="empty-record">Belum ada jadwal mendatang. Tambahkan jadwal atau catat tanggal birahi, IB, dan obat cacing pada data sapi.</p>{/if}
      </section>

      <section class="tip-banner"><span class="tip-icon">✳</span><div><strong>Catatan hari ini</strong><p>Jangan lupa cek ketersediaan air minum di kandang.</p></div><span class="tip-chevron">{@render Icon('chevron', 16)}</span></section>
      <section class="backup-card"><div class="backup-copy"><strong>Pindahkan data ke perangkat lain</strong><p>Ekspor file cadangan, lalu impor di perangkat tujuan. Bisa dilakukan tanpa internet.</p></div><div class="backup-actions"><button onclick={exportData}>{@render Icon('download', 17)} Ekspor data</button><button class="secondary" onclick={() => backupFileInput?.click()}>{@render Icon('upload', 17)} Impor data</button><input bind:this={backupFileInput} class="visually-hidden" type="file" accept="application/json,.json" onchange={importData} /></div>{#if backupMessage}<p class="backup-message" role="status">{backupMessage}</p>{/if}</section>
    {:else if activeTab === 'sapi'}
      <section class="page-heading"><p class="eyebrow">DATA PETERNAKAN</p><h1>Daftar sapi</h1><p class="subheading">Kelola dan pantau kondisi ternakmu.</p></section>
      <div class="section-heading cow-title-row"><div class="cow-summary"><div><span class="eyebrow">TOTAL TERNAK</span><strong>{cows.length} <small>ekor</small></strong></div><span class="summary-cow">{@render Icon('cow', 32)}</span></div><button class="round-action" aria-label="Tambah sapi" onclick={() => showCowForm = !showCowForm}>{@render Icon('plus', 18)}</button></div>
      {#if showCowForm}<form class="record-form" onsubmit={addCow}><label>Nama sapi<input bind:value={cowName} placeholder="Contoh: Putri" required /></label><div class="form-grid"><label>Jenis sapi<select bind:value={cowBreed}><option>PO</option><option>Limousin</option><option>Simmental</option><option>Brahman</option><option>Angus</option><option>Lainnya</option></select></label><label>Kondisi<select bind:value={cowStatus}><option>Sehat</option><option>Sakit</option><option>Menyusui</option><option>Hamil</option></select></label></div><label>Tanggal lahir <span class="optional-label">(opsional)</span><input type="date" bind:value={cowBirthDate} /></label><button class="form-submit" type="submit">Simpan sapi</button></form>{/if}
      <div class="filter-row"><button class="filter-pill" class:selected={cowFilter === 'Semua'} onclick={() => cowFilter = 'Semua'}>Semua <span>{cows.length}</span></button><button class="filter-pill" class:selected={cowFilter === 'Sehat'} onclick={() => cowFilter = 'Sehat'}>Sehat <span>{cows.filter((cow) => cow.status === 'Sehat').length}</span></button><button class="filter-pill" class:selected={cowFilter === 'Sakit'} onclick={() => cowFilter = 'Sakit'}>Sakit <span>{cows.filter((cow) => cow.status === 'Sakit').length}</span></button><button class="filter-pill" class:selected={cowFilter === 'Menyusui'} onclick={() => cowFilter = 'Menyusui'}>Menyusui <span>{cows.filter((cow) => cow.status === 'Menyusui').length}</span></button><button class="filter-pill" class:selected={cowFilter === 'Hamil'} onclick={() => cowFilter = 'Hamil'}>Hamil <span>{cows.filter((cow) => cow.status === 'Hamil' || cow.pregnant).length}</span></button></div>
      <div class="cow-list">{#each filteredCows as cow (cow.id)}<article class="cow-card"><span class="cow-avatar {cowTone(cow)}">{cow.name.slice(0, 1).toUpperCase()}</span><div class="cow-info"><h3><button class="cow-name-link" onclick={() => { activeTab = 'kalender'; openReproductionDetails(cow); }}>{cow.name}</button></h3><p>#{cow.code} · {cow.breed}</p>{#if cow.birthDate}<p class="cow-birth">Lahir: {localDate(cow.birthDate)}</p>{/if}{#if cow.calvingDate}<p class="cow-birth">Melahirkan: {localDate(cow.calvingDate)}</p>{/if}{#if weaningDateForCow(cow)}<p class="cow-pregnancy-likelihood">Sapih: {localDate(weaningDateForCow(cow))}</p>{/if}{#if pregnancyLikelihoodForCow(cow)}<p class="cow-pregnancy-likelihood">Perkiraan bunting: {pregnancyLikelihoodForCow(cow).percent}%</p>{/if}</div><select class="status-select" aria-label="Ubah status sapi" value={cow.status === 'Hamil' || cow.pregnant ? 'Hamil' : cow.status} onchange={(event) => updateCowStatus(cow, event.currentTarget.value)}><option>Sehat</option><option>Sakit</option><option>Menyusui</option><option>Hamil</option></select><button class="delete-record" aria-label="Hapus sapi" onclick={() => deleteCow(cow)}>×</button></article>{/each}</div>
      {#if filteredCows.length === 0}<p class="empty-record">Belum ada sapi pada kategori ini.</p>{/if}
    {:else if activeTab === 'pengeluaran'}
      <section class="page-heading"><p class="eyebrow">KEUANGAN PETERNAKAN</p><h1>Keuangan kandang</h1><p class="subheading">Catat pemasukan dan pengeluaran kandang.</p></section>
      <div class="expense-filters" aria-label="Filter rentang pengeluaran">
        {#each expenseRangeOptions as range}<button class:chosen={expenseRange === range} onclick={() => expenseRange = range}>{range}</button>{/each}
      </div>
      {#if expenseRange === 'Filter tanggal'}
        <div class="custom-range"><label>Dari<input type="date" bind:value={customStart} /></label><span>sampai</span><label>Sampai<input type="date" bind:value={customEnd} /></label></div>
      {/if}
      <label class="expense-search"><span class="sr-only">Cari nama transaksi</span><input type="search" bind:value={expenseSearch} placeholder="Cari nama pemasukan atau pengeluaran" /></label>
      <div class="cashflow-grid"><article class="cashflow-card income"><span>Total pemasukan</span><strong>{money(incomeTotal)}</strong></article><article class="cashflow-card outgoing"><span>Total pengeluaran</span><strong>{money(expenseTotal)}</strong></article><article class="cashflow-card balance"><span>Arus kas bersih</span><strong>{money(cashflowTotal)}</strong></article></div>
      <div class="finance-add-actions"><button class="finance-add-button" onclick={() => { showIncomeForm = !showIncomeForm; showExpenseForm = false; }}>{@render Icon('plus', 17)} Tambah pemasukan</button><button class="finance-add-button" onclick={() => { showExpenseForm = !showExpenseForm; showIncomeForm = false; }}>{@render Icon('plus', 17)} Tambah pengeluaran</button></div>
      {#if showIncomeForm}<form class="record-form income-form" onsubmit={addIncome}><label>Nama pemasukan<input bind:value={incomeName} placeholder="Contoh: Jual kohe" required /></label><div class="form-grid"><label>Kategori<select bind:value={incomeCategory}><option>Jual kohe</option><option>Jual pedet</option><option>Jual sapi</option><option>Susu</option><option>Lainnya</option></select></label><label>Jumlah (Rp)<input type="number" min="1" bind:value={incomeAmount} placeholder="150000" required /></label><label>Tanggal<input type="date" bind:value={incomeDate} required /></label></div><button class="form-submit" type="submit">Simpan pemasukan</button></form>{/if}
      {#if showExpenseForm}<form class="record-form income-form" onsubmit={addExpense}><label>Nama pengeluaran<input bind:value={expenseName} placeholder="Contoh: Pakan konsentrat" required /></label><div class="form-grid"><label>Kategori<select bind:value={expenseCategory}><option>Pakan</option><option>Obat</option><option>Kesehatan</option><option>Perawatan</option><option>Lainnya</option></select></label><label>Jumlah (Rp)<input type="number" min="1" bind:value={expenseAmount} placeholder="250000" required /></label><label>Tanggal<input type="date" bind:value={expenseDate} required /></label></div><button class="form-submit" type="submit">Simpan pengeluaran</button></form>{/if}
      <section class="section-block expenses-section"><div class="section-heading"><div><p class="eyebrow">RIWAYAT</p><h2>Pengeluaran terbaru</h2></div><div class="expense-heading-actions"><button class="import-trigger" aria-label="Impor pengeluaran CSV" title="Impor pengeluaran CSV" onclick={() => expenseImportInput?.click()}>{@render Icon('upload', 17)}<span>Impor</span></button><input bind:this={expenseImportInput} class="visually-hidden" type="file" accept=".csv,text/csv" onchange={importExpenses} /></div></div>
        <details class="expense-import-format"><summary>Contoh format CSV</summary><p>Urutan kolom: nama, kategori, jumlah, tanggal, keterangan. Jumlah tanpa Rp/pemisah ribuan; tanggal YYYY-MM-DD.</p><pre>nama,kategori,jumlah,tanggal,keterangan
Pakan konsentrat,Pakan,250000,2026-10-20,Pembelian pakan mingguan
Obat cacing,Obat,85000,2026-10-20,Untuk sapi Lestari</pre><button class="sample-download" onclick={downloadExpenseSample}>{@render Icon('download', 15)} Unduh contoh CSV</button></details>
        {#if expenseImportMessage}<p class="backup-message" role="status">{expenseImportMessage}</p>{/if}
        <div class="expense-list">{#each filteredExpenses as expense (expense.id)}<article class="expense-card"><span class="expense-icon {expense.category === 'Kesehatan' || expense.category === 'Obat' ? 'peach' : expense.category === 'Perawatan' ? 'lilac' : 'sage'}">{@render Icon(expenseIcon(expense.category), 19)}</span><div class="expense-info"><h3>{expense.name}</h3><p>{expense.detail} · {localDate(expense.date)}</p></div><strong>{money(expense.amount)}</strong><button class="delete-record" aria-label="Hapus pengeluaran" onclick={() => deleteExpense(expense)}>×</button></article>{/each}</div>
        {#if filteredExpenses.length === 0}<p class="empty-record">Tidak ada pengeluaran pada rentang ini.</p>{/if}
      </section>
      <section class="section-block income-section"><div class="section-heading"><div><p class="eyebrow">UANG MASUK</p><h2>Pemasukan terbaru</h2></div></div>
        <div class="expense-list">{#each filteredIncomes as income (income.id)}<article class="expense-card income-card"><span class="expense-icon mint">{@render Icon('wallet', 19)}</span><div class="expense-info"><h3>{income.name}</h3><p>{income.category} · {localDate(income.date)}</p></div><strong>+{money(income.amount)}</strong><button class="delete-record" aria-label="Hapus pemasukan" onclick={() => deleteIncome(income)}>×</button></article>{/each}</div>
        {#if filteredIncomes.length === 0}<p class="empty-record">Tidak ada pemasukan pada rentang ini.</p>{/if}
      </section>
    {:else if activeTab === 'kalender'}
      <section class="page-heading"><p class="eyebrow">REPRODUKSI SAPI</p><h1>Kalender birahi</h1><p class="subheading">Catat birahi, IB, cek kehamilan, dan obat cacing.</p></section>
      {#if selectedCalendarCow}
        <button class="calendar-back" onclick={() => selectedCalendarCowId = null}>‹ Kembali ke daftar sapi</button>
        <section class="repro-profile"><span class="cow-avatar {cowTone(selectedCalendarCow)}">{selectedCalendarCow.name.slice(0, 1).toUpperCase()}</span><div><h2>{selectedCalendarCow.name}</h2><p>#{selectedCalendarCow.code} · {selectedCalendarCow.breed}{selectedCalendarCow.birthDate ? ` · Lahir ${localDate(selectedCalendarCow.birthDate)}` : ''}</p></div></section>
        <div class="repro-recommendations">
          {#if selectedCalendarCow.inseminationDate}<article class="recommendation-card insemination"><span class="recommendation-icon">{@render Icon('spark', 20)}</span><div><strong>Inseminasi buatan (IB)</strong><p>Dilakukan {localDate(selectedCalendarCow.inseminationDate)}</p></div></article>{/if}
          {#if weaningDateForCow(selectedCalendarCow)}<article class="recommendation-card weaning"><span class="recommendation-icon">{@render Icon('cow', 20)}</span><div><strong>Jadwal sapih</strong><p>{localDate(weaningDateForCow(selectedCalendarCow))} · lima bulan setelah melahirkan</p></div></article>{/if}
          {#if pregnancyLikelihood}<article class="recommendation-card likelihood"><span class="recommendation-icon">{@render Icon('heart', 20)}</span><div><strong>Perkiraan kemungkinan bunting: {pregnancyLikelihood.percent}%</strong><p>{pregnancyLikelihood.cycles === 1 ? 'Satu siklus (sekitar 21 hari) terpantau tanpa birahi.' : 'Dua siklus atau lebih terpantau tanpa birahi.'} Ini perkiraan dari catatan tidak kembali birahi, bukan diagnosis.</p><a href="https://www.nadis.org.uk/disease-a-z/cattle/fertility-in-dairy-herds/part-5-pregnancy-diagnosis/" target="_blank" rel="noreferrer">Tentang keterbatasan perkiraan</a></div></article>{/if}
          {#if pregnancyCheckRecommendation}<article class="recommendation-card pregnancy"><span class="recommendation-icon">{@render Icon('baby', 20)}</span><div><strong>Cek kehamilan</strong><p>Rekomendasi sekitar {localDate(pregnancyCheckRecommendation)}, 60 hari setelah IB.</p></div></article>{/if}
          {#each heatCheckRecommendations(selectedCalendarCow) as heatDate}<article class="recommendation-card heat"><span class="recommendation-icon">{@render Icon('spark', 20)}</span><div class="heat-check-copy"><strong>{heatDate < todayKey() ? 'Pengecekan birahi terlewat' : 'Pantau birahi · siklus 21 hari'}</strong><p>Cek birahi {heatDate < todayKey() ? 'sejak' : 'sekitar'} {localDate(heatDate)}. Siklus dapat bervariasi 17–24 hari.</p><label class="heat-check-toggle" class:disabled={heatDate > todayKey()}><input type="checkbox" disabled={heatDate > todayKey()} checked={selectedCalendarCow.heatChecks?.includes(heatDate) || false} onchange={() => toggleHeatCheck(heatDate)} /> {heatDate > todayKey() ? 'Belum waktunya dicek' : 'Sudah dipantau, birahi tidak terlihat'}</label></div></article>{/each}
          {#if selectedCalendarCow.nextDewormingDate}<article class="recommendation-card deworm"><span class="recommendation-icon">{@render Icon('stethoscope', 20)}</span><div><strong>Jadwal obat cacing</strong><p>{localDate(selectedCalendarCow.nextDewormingDate)}</p></div></article>{/if}
        </div>
        <form class="record-form repro-form" onsubmit={saveReproductionDetails}>
          <p class="eyebrow">CATATAN REPRODUKSI</p>
          <label>Tanggal birahi terakhir<input type="date" bind:value={reproDraft.heatDate} /></label>
          <label>Tanggal IB (inseminasi buatan)<input type="date" bind:value={reproDraft.inseminationDate} /></label>
          {#if selectedCalendarCow.status === 'Menyusui'}<label>Tanggal melahirkan<input type="date" bind:value={reproDraft.calvingDate} /></label>{/if}
          {#if pregnancyCheckRecommendation}<div class="recommendation-note">Pemeriksaan dapat dilakukan paling cepat 45 hari setelah IB. Untuk mengurangi risiko kehilangan kebuntingan, disarankan sekitar 60 hari: <strong>{localDate(pregnancyCheckRecommendation)}</strong>. Lakukan bersama dokter hewan atau petugas terlatih.</div>{/if}
          <label>Hasil cek kehamilan<select bind:value={reproDraft.pregnancyResult}><option>Belum diperiksa</option><option>Hamil</option><option>Tidak hamil</option></select></label>
          <div class="form-grid"><label>Terakhir diberi obat cacing<input type="date" bind:value={reproDraft.lastDewormingDate} oninput={() => reproDraft.nextDewormingDate = addMonthsToDate(reproDraft.lastDewormingDate, 2)} /></label><label>Jadwal berikutnya (otomatis)<input type="date" value={addMonthsToDate(reproDraft.lastDewormingDate, 2)} readonly /></label></div>
          <p class="deworming-note">Jadwal berikutnya dihitung dua bulan dari tanggal pemberian terakhir.</p>
          <button class="form-submit" type="submit">Simpan jadwal sapi</button>
          {#if reproMessage}<p class="backup-message" role="status">{reproMessage}</p>{/if}
        </form>
      {:else}
        <div class="repro-guidance"><strong>Perkiraan siklus birahi</strong><p>Siklus sapi rata-rata 21 hari dan dapat berkisar 17–24 hari. Tanggal di halaman ini adalah pengingat untuk dipantau, bukan kepastian birahi.</p></div>
        {#if cows.length === 0}<p class="empty-record">Tambahkan data sapi terlebih dahulu untuk membuat kalender birahi.</p>{/if}
        <div class="calendar-cow-list">{#each cows as cow (cow.id)}<button class="calendar-cow-card" onclick={() => openReproductionDetails(cow)}><span class="cow-avatar {cowTone(cow)}">{cow.name.slice(0, 1).toUpperCase()}</span><span class="calendar-cow-info"><strong>{cow.name}</strong><small>#{cow.code} · {cow.breed}</small>{#if cow.inseminationDate}<small>IB: {localDate(cow.inseminationDate)}</small>{/if}{#if cow.calvingDate}<small>Melahirkan: {localDate(cow.calvingDate)}</small>{/if}{#if weaningDateForCow(cow)}<small class="cow-pregnancy-likelihood">Jadwal sapih: {localDate(weaningDateForCow(cow))}</small>{/if}<small>{reproductiveCowLabel(cow)}</small>{#if pregnancyLikelihoodForCow(cow)}<small class="cow-pregnancy-likelihood">Perkiraan bunting: {pregnancyLikelihoodForCow(cow).percent}%</small>{/if}</span>{@render Icon('chevron', 19)}</button>{/each}</div>
      {/if}
    {/if}
  </main>

  <nav class="bottom-nav" aria-label="Navigasi utama">
    <button class:active={activeTab === 'home'} onclick={() => activeTab = 'home'}>{@render Icon('home', 21)}<span>Home</span></button>
    <button class:active={activeTab === 'sapi'} onclick={() => activeTab = 'sapi'}>{@render Icon('cow', 21)}<span>Sapi</span></button>
    <button class:active={activeTab === 'pengeluaran'} onclick={() => activeTab = 'pengeluaran'}>{@render Icon('wallet', 21)}<span>Keuangan</span></button>
    <button class:active={activeTab === 'kalender'} onclick={() => { activeTab = 'kalender'; selectedCalendarCowId = null; }}>{@render Icon('calendar', 21)}<span>Kalender</span></button>
  </nav>
  {#if confirmModal}
    <div class="modal-backdrop">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" tabindex="-1">
        <span class="confirm-modal-icon">{@render Icon(confirmModal.danger ? 'activity' : 'upload', 22)}</span>
        <h2 id="confirm-title">{confirmModal.title}</h2>
        <p id="confirm-message">{confirmModal.message}</p>
        <div class="confirm-modal-actions"><button class="confirm-cancel" onclick={() => closeConfirmation(false)}>Batal</button><button class:danger={confirmModal.danger} class="confirm-accept" onclick={() => closeConfirmation(true)}>{confirmModal.confirmLabel}</button></div>
      </div>
    </div>
  {/if}
</div>
{/if}
