<script>
  import Icon from "../Icon.svelte";
  let { model } = $props();
</script>

<section class="page-heading">
  <p class="eyebrow">AKUN PETERNAKAN</p>
  <h1>Profil</h1>
  <p class="subheading">Informasi pemilik dan peternakanmu.</p>
</section>
<section class="profile-details profile-info-card" aria-label="Informasi profil">
  <article class="profile-detail-card">
    <span class="profile-detail-icon">
      <Icon name={"cow"} size={20} />
    </span>
    <div>
      <p>Nama pemilik</p>
      <strong>{model.profile.ownerName}</strong>
    </div>
  </article>
  <article class="profile-detail-card">
    <span class="profile-detail-icon">
      <Icon name={"barn"} size={20} />
    </span>
    <div>
      <p>Nama peternakan</p>
      <strong>{model.profile.farmName}</strong>
    </div>
  </article>
  <article class="profile-detail-card">
    <span class="profile-detail-icon">
      <Icon name={"cow"} size={20} />
    </span>
    <div>
      <p>Jumlah ternak</p>
      <strong>{model.cows.length} <small>ekor</small> </strong>
    </div>
  </article>
</section>
<section class="backup-card profile-backup-card">
  <div class="backup-copy">
    <strong>Pindahkan data ke perangkat lain</strong>
    <p>
      Ekspor file cadangan, lalu impor di perangkat tujuan. Bisa dilakukan tanpa
      internet.
    </p>
  </div>
  <div class="backup-actions">
    <button onclick={model.exportData}>
      <Icon name={"download"} size={17} /> Ekspor data</button
    >
    <button class="secondary" onclick={() => model.backupFileInput?.click()}>
      <Icon name={"upload"} size={17} /> Impor data</button
    >
    <input
      bind:this={model.backupFileInput}
      class="visually-hidden"
      type="file"
      accept="application/json,.json"
      onchange={model.importData}
    />
  </div>
  {#if model.backupMessage}<p class="backup-message" role="status">
      {model.backupMessage}
    </p>{/if}
</section>
