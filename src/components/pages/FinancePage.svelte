<script>
  import Icon from "../Icon.svelte";
  let { model } = $props();
</script>

<section class="page-heading">
  <p class="eyebrow">KEUANGAN PETERNAKAN</p>
  <h1>Keuangan kandang</h1>
  <p class="subheading">Catat pemasukan dan pengeluaran kandang.</p>
</section>
<div class="expense-filters" aria-label="Filter rentang pengeluaran">
  {#each model.expenseRangeOptions as range}<button
      class:chosen={model.expenseRange === range}
      onclick={() => (model.expenseRange = range)}>{range}</button
    >{/each}
</div>
{#if model.expenseRange === "Filter tanggal"}
  <div class="custom-range">
    <label>Dari<input type="date" bind:value={model.customStart} /> </label>
    <span>sampai</span>
    <label>Sampai<input type="date" bind:value={model.customEnd} /> </label>
  </div>
{/if}
<label class="expense-search">
  <span class="sr-only">Cari nama transaksi</span>
  <input
    type="search"
    bind:value={model.expenseSearch}
    placeholder="Cari nama pemasukan atau pengeluaran"
  />
</label>
<div class="cashflow-grid">
  <article class="cashflow-card income">
    <span>Total pemasukan</span>
    <strong>{model.money(model.incomeTotal)}</strong>
  </article>
  <article class="cashflow-card outgoing">
    <span>Total pengeluaran</span>
    <strong>{model.money(model.expenseTotal)}</strong>
  </article>
  <article class="cashflow-card balance">
    <span>Arus kas bersih · sesuai filter</span>
    <strong>{model.money(model.cashflowTotal)}</strong>
  </article>
  <article class="cashflow-card available">
    <div class="available-balance-values">
      <div>
        <span>Total modal</span>
        <strong>{model.money(model.totalCapital)}</strong>
      </div>
      <div>
        <span>Sisa sekarang</span>
        <strong>{model.money(model.availableBalance)}</strong>
      </div>
    </div>
  </article>
</div>
<div class="finance-history-tabs" role="tablist" aria-label="Riwayat keuangan">
  <button
    id="expenses-tab"
    role="tab"
    aria-selected={model.financeHistoryTab === "pengeluaran"}
    class:chosen={model.financeHistoryTab === "pengeluaran"}
    onclick={() => (model.financeHistoryTab = "pengeluaran")}
    >Pengeluaran <span>{model.filteredExpenses.length}</span>
  </button>
  <button
    id="incomes-tab"
    role="tab"
    aria-selected={model.financeHistoryTab === "pemasukan"}
    class:chosen={model.financeHistoryTab === "pemasukan"}
    onclick={() => (model.financeHistoryTab = "pemasukan")}
    >Pemasukan <span>{model.filteredIncomes.length}</span>
  </button>
</div>
{#if model.financeHistoryTab === "pengeluaran"}
  <div
    class="section-block expenses-section"
    role="tabpanel"
    aria-labelledby="expenses-tab"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">RIWAYAT</p>
        <h2>Pengeluaran terbaru</h2>
      </div>
      <div class="expense-heading-actions">
        <button class="finance-add-button" onclick={model.startNewExpense}>
          <Icon name={"plus"} size={17} />
          <span>Tambah</span>
        </button>
        <button
          class="import-trigger"
          aria-label="Impor pengeluaran CSV"
          title="Impor pengeluaran CSV"
          onclick={() => model.expenseImportInput?.click()}
        >
          <Icon name={"upload"} size={17} />
          <span>Impor</span>
        </button>
        <input
          bind:this={model.expenseImportInput}
          class="visually-hidden"
          type="file"
          accept=".csv,text/csv"
          onchange={model.importExpenses}
        />
      </div>
    </div>
    {#if model.showExpenseForm}<form
        class="record-form income-form"
        onsubmit={model.addExpense}
      >
        <label
          >Nama pengeluaran<input
            bind:value={model.expenseName}
            placeholder="Contoh: Pakan konsentrat"
            required
          />
        </label>
        <div class="form-grid">
          <label
            >Kategori<select bind:value={model.expenseCategory}>
              <option>Pakan</option>
              <option>Obat</option>
              <option>Kesehatan</option>
              <option>Perawatan</option>
              <option>Lainnya</option>
            </select>
          </label>
          <label
            >Jumlah (Rp)<input
              type="number"
              min="1"
              bind:value={model.expenseAmount}
              placeholder="250000"
              required
            />
          </label>
          <label
            >Tanggal<input
              type="date"
              bind:value={model.expenseDate}
              required
            />
          </label>
        </div>
        {#if model.editingExpenseId}<button
            class="form-cancel"
            type="button"
            onclick={() => {
              model.editingExpenseId = null;
              model.showExpenseForm = false;
            }}>Batal</button
          >{/if}
        <button class="form-submit" type="submit"
          >{model.editingExpenseId
            ? "Simpan perubahan"
            : "Simpan pengeluaran"}</button
        >
      </form>{/if}
    <details class="expense-import-format">
      <summary>Contoh format CSV</summary>
      <p>
        Urutan kolom: nama, kategori, jumlah, tanggal, keterangan. Jumlah tanpa
        Rp/pemisah ribuan; tanggal YYYY-MM-DD.
      </p>
      <pre>nama,kategori,jumlah,tanggal,keterangan
      Pakan konsentrat,Pakan,250000,2026-10-20,Pembelian pakan mingguan
    Obat cacing,Obat,85000,2026-10-20,Untuk sapi Lestari</pre>
      <button class="sample-download" onclick={model.downloadExpenseSample}>
        <Icon name={"download"} size={15} /> Unduh contoh CSV</button
      >
    </details>
    {#if model.expenseImportMessage}<p class="backup-message" role="status">
        {model.expenseImportMessage}
      </p>{/if}
    <div class="expense-list">
      {#each model.filteredExpenses as expense (expense.id)}<article
          class="expense-card"
        >
          <span
            class="expense-icon {expense.category === 'Kesehatan' ||
            expense.category === 'Obat'
              ? 'peach'
              : expense.category === 'Perawatan'
                ? 'lilac'
                : 'sage'}"
          >
            <Icon name={model.expenseIcon(expense.category)} size={19} />
          </span>
          <div class="expense-info">
            <h3>{expense.name}</h3>
            <p>{expense.detail} · {model.localDate(expense.date)}</p>
          </div>
          <strong>{model.money(expense.amount)}</strong>
          <button
            class="edit-record"
            aria-label="Edit pengeluaran {expense.name}"
            onclick={() => model.editExpense(expense)}>Edit</button
          >
          <button
            class="delete-record"
            aria-label="Hapus pengeluaran"
            onclick={() => model.deleteExpense(expense)}>×</button
          >
        </article>{/each}
    </div>
    {#if model.filteredExpenses.length === 0}<p class="empty-record">
        Tidak ada pengeluaran pada rentang ini.
      </p>{/if}
  </div>
{:else}
  <div
    class="section-block income-section"
    role="tabpanel"
    aria-labelledby="incomes-tab"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">UANG MASUK</p>
        <h2>Pemasukan terbaru</h2>
      </div>
      <div class="expense-heading-actions">
        <button class="finance-add-button" onclick={model.startNewIncome}>
          <Icon name={"plus"} size={17} />
          <span>Tambah</span>
        </button>
      </div>
    </div>
    {#if model.showIncomeForm}<form
        class="record-form income-form"
        onsubmit={model.addIncome}
      >
        <label
          >Nama pemasukan<input
            bind:value={model.incomeName}
            placeholder="Contoh: Jual kohe"
            required
          />
        </label>
        <div class="form-grid">
          <label
            >Kategori<select bind:value={model.incomeCategory}>
              <option>Modal</option>
              <option>Jual kohe</option>
              <option>Jual pedet</option>
              <option>Jual sapi</option>
              <option>Susu</option>
              <option>Lainnya</option>
            </select>
          </label>
          <label
            >Jumlah (Rp)<input
              type="number"
              min="1"
              bind:value={model.incomeAmount}
              placeholder="150000"
              required
            />
          </label>
          <label
            >Tanggal<input type="date" bind:value={model.incomeDate} required />
          </label>
        </div>
        {#if model.editingIncomeId}<button
            class="form-cancel"
            type="button"
            onclick={() => {
              model.editingIncomeId = null;
              model.showIncomeForm = false;
            }}>Batal</button
          >{/if}
        <button class="form-submit" type="submit"
          >{model.editingIncomeId
            ? "Simpan perubahan"
            : "Simpan pemasukan"}</button
        >
      </form>{/if}
    <div class="expense-list">
      {#each model.filteredIncomes as income (income.id)}<article
          class="expense-card income-card"
        >
          <span class="expense-icon mint">
            <Icon name={"wallet"} size={19} />
          </span>
          <div class="expense-info">
            <h3>{income.name}</h3>
            <p>{income.category} · {model.localDate(income.date)}</p>
          </div>
          <strong>+{model.money(income.amount)}</strong>
          <button
            class="edit-record"
            aria-label="Edit pemasukan {income.name}"
            onclick={() => model.editIncome(income)}>Edit</button
          >
          <button
            class="delete-record"
            aria-label="Hapus pemasukan"
            onclick={() => model.deleteIncome(income)}>×</button
          >
        </article>{/each}
    </div>
    {#if model.filteredIncomes.length === 0}<p class="empty-record">
        Tidak ada pemasukan pada rentang ini.
      </p>{/if}
  </div>
{/if}
