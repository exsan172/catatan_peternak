<script>
  import Icon from "./components/Icon.svelte";
  import PwaPrompts from "./components/PwaPrompts.svelte";
  import HomePage from "./components/pages/HomePage.svelte";
  import ProfilePage from "./components/pages/ProfilePage.svelte";
  import CowPage from "./components/pages/CowPage.svelte";
  import FinancePage from "./components/pages/FinancePage.svelte";
  import CalendarPage from "./components/pages/CalendarPage.svelte";
  import { createAppController } from "./lib/app-controller.svelte.js";
  const { model } = createAppController();
</script>

{#if model.isLoading}
  <main class="setup-page">
    <div class="setup-loading">
      <span class="setup-brand-mark"><Icon name={"cow"} size={22} /></span>
      <p>Menyiapkan peternakan...</p>
    </div>
  </main>
{:else if !model.profile}
  <main class="setup-page">
    <section class="setup-card">
      <span class="setup-brand-mark"><Icon name={"cow"} size={24} /></span>
      <p class="setup-eyebrow">SELAMAT DATANG DI CATATAN PETERNAK</p>
      <h1>Mulai catatan<br />peternakanmu.</h1>
      <p class="setup-description">
        Kenalan dulu, yuk. Informasi ini disimpan di browser perangkatmu.
      </p>
      <form class="setup-form" onsubmit={model.finishSetup}>
        <label for="owner-name">Nama pemilik</label>
        <input
          id="owner-name"
          bind:value={model.ownerName}
          autocomplete="name"
          placeholder="Contoh: Andi Saputra"
          required
        />
        <label for="farm-name">Nama peternakan</label>
        <input
          id="farm-name"
          bind:value={model.farmName}
          autocomplete="organization"
          placeholder="Contoh: Peternakan Makmur"
          required
        />
        {#if model.setupError}<p class="setup-error" role="alert">
            {model.setupError}
          </p>{/if}
        <button class="setup-submit" type="submit"
          >Mulai mencatat <span><Icon name={"arrow"} size={17} /></span></button
        >
      </form>
      <p class="setup-privacy">Data profil tersimpan lokal di browser ini.</p>
    </section>
  </main>
{:else}
  <div class="app-shell">
    <header class="topbar">
      <a
        class="brand"
        href="#home"
        onclick={(event) => {
          event.preventDefault();
          model.navigateTo("home");
        }}
        aria-label="Catatan Peternak"
      >
        <span class="brand-mark"><Icon name={"cow"} size={21} /></span>
        <span class="brand-farm-name">{model.profile.farmName}</span>
      </a>
      <div class="top-actions">
        <button
          class="theme-toggle"
          aria-label="Ganti tema"
          title="Ganti tema"
          onclick={model.toggleTheme}
          ><Icon
            name={model.theme === "dark" ? "sun" : "moon"}
            size={18}
          /></button
        >
        <button
          class="avatar"
          aria-label="Buka profil {model.profile.ownerName}"
          onclick={() => model.navigateTo("profil")}
          >{model.profile.ownerName.slice(0, 1).toUpperCase()}</button
        >
      </div>
    </header>

    <main class="main-content">
      {#if model.activeTab === "home"}
        <HomePage {model} />
      {:else if model.activeTab === "profil"}
        <ProfilePage {model} />
      {:else if model.activeTab === "sapi"}
        <CowPage {model} />
      {:else if model.activeTab === "pengeluaran"}
        <FinancePage {model} />
      {:else if model.activeTab === "kalender"}
        <CalendarPage {model} />
      {/if}
    </main>

    <nav class="bottom-nav" aria-label="Navigasi utama">
      <button
        class:active={model.activeTab === "home"}
        onclick={() => model.navigateTo("home")}
        ><Icon name={"home"} size={21} /><span>Home</span></button
      >
      <button
        class:active={model.activeTab === "sapi"}
        onclick={() => model.navigateTo("sapi")}
        ><Icon name={"cow"} size={21} /><span>Ternak</span></button
      >
      <button
        class:active={model.activeTab === "pengeluaran"}
        onclick={() => model.navigateTo("pengeluaran")}
        ><Icon name={"wallet"} size={21} /><span>Keuangan</span></button
      >
      <button
        class:active={model.activeTab === "kalender"}
        onclick={() => {
          model.navigateTo("kalender");
        }}><Icon name={"calendar"} size={21} /><span>Kalender</span></button
      >
    </nav>
    {#if model.confirmModal}
      <div class="modal-backdrop">
        <div
          class="confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          tabindex="-1"
        >
          <span class="confirm-modal-icon"
            ><Icon
              name={model.confirmModal.danger ? "activity" : "upload"}
              size={22}
            /></span
          >
          <h2 id="confirm-title">{model.confirmModal.title}</h2>
          <p id="confirm-message">{model.confirmModal.message}</p>
          <div class="confirm-modal-actions">
            <button
              class="confirm-cancel"
              onclick={() => model.closeConfirmation(false)}>Batal</button
            ><button
              class:danger={model.confirmModal.danger}
              class="confirm-accept"
              onclick={() => model.closeConfirmation(true)}
              >{model.confirmModal.confirmLabel}</button
            >
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
<PwaPrompts />
