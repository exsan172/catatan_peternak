<script>
  import Icon from "../Icon.svelte";
  let { model } = $props();
</script>

<section class="page-heading">
  <p class="eyebrow">AKUN PETERNAKAN</p>
  <h1>Profil</h1>
  <p class="subheading">Informasi pemilik dan peternakanmu.</p>
</section>
<section class="profile-details" aria-label="Informasi profil">
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
