<script>
  import Icon from "../Icon.svelte";
  let { model } = $props();
</script>

<section class="page-heading">
  <p class="eyebrow">DATA PETERNAKAN</p>
  <h1>Daftar sapi</h1>
  <p class="subheading">Kelola dan pantau kondisi ternakmu.</p>
</section>
<div class="section-heading cow-title-row">
  <div class="cow-summary">
    <div>
      <span class="eyebrow">TOTAL TERNAK</span>
      <strong>{model.cows.length} <small>ekor</small> </strong>
    </div>
    <span class="summary-cow">
      <Icon name={"cow"} size={32} />
    </span>
  </div>
  <button
    class="round-action"
    aria-label="Tambah sapi"
    onclick={model.startNewCow}
  >
    <Icon name={"plus"} size={18} />
  </button>
</div>
{#if model.showCowForm}<form class="record-form" onsubmit={model.addCow}>
    <label
      >Nama sapi<input
        bind:value={model.cowName}
        placeholder="Contoh: Putri"
        required
      />
    </label>
    <div class="form-grid">
      <label
        >Jenis sapi<select bind:value={model.cowBreed}
          >{#each model.knownCowBreeds as breed}<option value={breed}
              >{breed}</option
            >{/each}
        </select>
      </label>
      <label
        >Kondisi<select bind:value={model.cowStatus}>
          <option>Sehat</option>
          <option>Sakit</option>
          <option>Menyusui</option>
          <option>Hamil</option>
        </select>
      </label>
    </div>
    <label
      >Kategori ternak <span class="optional-label">(opsional)</span>
      <select bind:value={model.cowCategory}>
        <option value="">Pilih kategori</option>
        <option>Pedet</option>
        <option>Dere</option>
        <option>Dara</option>
        <option>Calon induk</option>
        <option>Indukan</option>
        <option>Calon pejantan</option>
        <option>Pejantan muda</option>
        <option>Pejantan</option>
        <option>Bakalan</option>
        <option>Afkir</option>
      </select>
    </label>
    <label
      >Tanggal lahir <span class="optional-label">(opsional)</span>
      <input type="date" bind:value={model.cowBirthDate} />
    </label>
    <label
      >Induk <span class="optional-label">(opsional)</span>
      <select bind:value={model.cowMotherId}>
        <option value="">Belum diketahui</option
        >{#each model.cows.filter((candidate) => candidate.id !== model.editingCowId) as candidate (candidate.id)}<option
            value={candidate.id}>{candidate.name} · #{candidate.code}</option
          >{/each}
      </select>
    </label>{#if model.editingCowId}<button
        class="form-cancel"
        type="button"
        onclick={() => {
          model.editingCowId = null;
          model.showCowForm = false;
        }}>Batal</button
      >{/if}
    <button class="form-submit" type="submit"
      >{model.editingCowId ? "Simpan perubahan" : "Simpan sapi"}</button
    >
  </form>{/if}
<div class="cow-directory-filters">
  <label class="cow-search-field">
    <span class="sr-only">Cari nama ternak</span>
    <input
      type="search"
      bind:value={model.cowSearch}
      placeholder="Cari nama ternak"
    />
  </label>
  <select aria-label="Filter jenis sapi" bind:value={model.cowBreedFilter}>
    <option value="Semua">Semua jenis</option
    >{#each model.cowBreedOptions as breed}<option value={breed}>{breed}</option
      >{/each}
    <option value="__none__">Jenis belum diisi</option>
  </select>
  <select
    aria-label="Filter kategori ternak"
    bind:value={model.cowCategoryFilter}
  >
    <option value="Semua">Semua kategori</option
    >{#each model.cowCategoryOptions as category}<option value={category}
        >{category}</option
      >{/each}
    <option value="__none__">Kategori belum diisi</option>
  </select>
</div>
<div class="filter-row">
  <button
    class="filter-pill"
    class:selected={model.cowFilter === "Semua"}
    onclick={() => (model.cowFilter = "Semua")}
    >Semua <span>{model.cows.length}</span>
  </button>
  <button
    class="filter-pill"
    class:selected={model.cowFilter === "Sehat"}
    onclick={() => (model.cowFilter = "Sehat")}
    >Sehat <span
      >{model.cows.filter((cow) => cow.status === "Sehat").length}</span
    >
  </button>
  <button
    class="filter-pill"
    class:selected={model.cowFilter === "Sakit"}
    onclick={() => (model.cowFilter = "Sakit")}
    >Sakit <span
      >{model.cows.filter((cow) => cow.status === "Sakit").length}</span
    >
  </button>
  <button
    class="filter-pill"
    class:selected={model.cowFilter === "Menyusui"}
    onclick={() => (model.cowFilter = "Menyusui")}
    >Menyusui <span
      >{model.cows.filter((cow) => cow.status === "Menyusui").length}</span
    >
  </button>
  <button
    class="filter-pill"
    class:selected={model.cowFilter === "Hamil"}
    onclick={() => (model.cowFilter = "Hamil")}
    >Hamil <span
      >{model.cows.filter((cow) => cow.status === "Hamil" || cow.pregnant)
        .length}</span
    >
  </button>
</div>
<div class="cow-list">
  {#each model.filteredCows as cow (cow.id)}<article class="cow-card">
      <span class="cow-avatar {model.cowTone(cow)}"
        >{cow.name.slice(0, 1).toUpperCase()}</span
      >
      <div class="cow-info">
        <h3>
          <button
            class="cow-name-link"
            onclick={() => {
              model.openReproductionDetails(cow);
            }}>{cow.name}</button
          >
        </h3>
        <p>
          #{cow.code} · {model.normalizeCowBreed(cow.breed)}
          {#if cow.category}
            · {cow.category}{/if}
        </p>
        {#if model.motherName(cow)}<p>Induk: {model.motherName(cow)}</p>{/if}
        {#if cow.birthDate}<p class="cow-birth">
            Lahir: {model.localDate(cow.birthDate)}
          </p>
          <p class="cow-age">Umur: {model.cowAge(cow.birthDate)}</p>{/if}
        {#if cow.calvingDate}<p class="cow-birth">
            Melahirkan: {model.localDate(cow.calvingDate)}
          </p>{/if}
        {#if model.weaningDateForCow(cow)}<p class="cow-pregnancy-likelihood">
            Sapih: {model.localDate(model.weaningDateForCow(cow))}
          </p>{/if}
        {#if model.pregnancyLikelihoodForCow(cow)}<p
            class="cow-pregnancy-likelihood"
          >
            Perkiraan bunting: {model.pregnancyLikelihoodForCow(cow).percent}%
          </p>{/if}
      </div>
      <button
        class="edit-record"
        aria-label="Edit data sapi {cow.name}"
        onclick={() => model.editCow(cow)}>Edit</button
      >
      <select
        class="status-select"
        aria-label="Ubah status sapi"
        value={cow.status === "Hamil" || cow.pregnant ? "Hamil" : cow.status}
        onchange={(event) =>
          model.updateCowStatus(cow, event.currentTarget.value)}
      >
        <option>Sehat</option>
        <option>Sakit</option>
        <option>Menyusui</option>
        <option>Hamil</option>
      </select>
      <button
        class="delete-record"
        aria-label="Hapus sapi"
        onclick={() => model.deleteCow(cow)}>×</button
      >
    </article>{/each}
</div>
{#if model.filteredCows.length === 0}<p class="empty-record">
    {model.cows.length === 0
      ? "Belum ada ternak. Tambahkan data ternak terlebih dahulu."
      : "Tidak ada ternak yang cocok dengan pencarian dan filter."}
  </p>{/if}
