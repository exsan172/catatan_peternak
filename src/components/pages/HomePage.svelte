<script>
  import Icon from "../Icon.svelte";
  import { slide } from "svelte/transition";
  let { model } = $props();
</script>

<section class="welcome-row">
  <div>
    <p class="eyebrow">{model.dateLabel} · {model.profile.farmName}</p>
    <h1>Selamat datang, <span>{model.profile.ownerName}</span> 👋</h1>
    <p class="subheading">Ini ringkasan peternakanmu hari ini.</p>
  </div>
</section>

<section class="section-block">
  <div class="section-heading">
    <div>
      <p class="eyebrow">KONDISI TERNAK</p>
      <h2>Ringkasan sapi</h2>
    </div>
    <button class="text-link" onclick={() => model.navigateTo("sapi")}
      >Lihat semua <Icon name={"arrow"} size={15} />
    </button>
  </div>
  <div class="stats-grid">
    {#each model.stats as stat}
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-icon {stat.tone}">
            <Icon name={stat.icon} size={19} />
          </span>
          <span class="stat-note">{stat.note}</span>
        </div>
        <div class="stat-value">{stat.value}<span>{stat.unit}</span></div>
        <p class="stat-label">{stat.label}</p>
      </article>
    {/each}
  </div>
</section>

<section class="section-block schedule-section">
  <div class="section-heading">
    <div>
      <p class="eyebrow">JANGAN TERLEWAT</p>
      <h2>Jadwal mendatang</h2>
    </div>
  </div>
  {#each model.upcomingScheduleGroups as group (group.id)}
    <div class="schedule-group">
      <button
        class="schedule-group-heading"
        aria-expanded={Boolean(model.expandedScheduleGroups[group.id])}
        onclick={() =>
          (model.expandedScheduleGroups = {
            ...expandedScheduleGroups,
            [group.id]: !model.expandedScheduleGroups[group.id],
          })}
      >
        <span class="schedule-group-cow-icon">
          <Icon name={"cow"} size={20} />
        </span>
        <span class="schedule-group-name"
          >{group.name}
          {#if group.code}<small>Sapi #{group.code}</small>{/if}
        </span>
        <span class="schedule-group-count">{group.items.length} jadwal</span>
        <span
          class="schedule-group-arrow"
          class:expanded={model.expandedScheduleGroups[group.id]}
        >
          <Icon name={"chevron"} size={17} />
        </span>
      </button>
      {#if model.expandedScheduleGroups[group.id]}
        <div
          class="schedule-list schedule-group-content"
          transition:slide={{ duration: 220 }}
        >
          {#each group.items as item (item.id)}
            <article class="schedule-card">
              <span class="schedule-icon {model.scheduleTone(item.kind)}">
                <Icon name={model.scheduleIcon(item.kind)} size={19} />
              </span>
              <div class="schedule-info">
                <span class="schedule-kind">{item.kind}</span>
                <h3>{item.title}</h3>
                {#if item.source === "manual"}<p>{item.detail}</p>{/if}
              </div>
              <div class="schedule-time">
                <strong>{model.displayScheduleDate(item.date)}</strong>
                <span>{item.time || "Pengingat"}</span>
              </div>
              {#if item.source === "manual"}<button
                  class="delete-record"
                  aria-label="Hapus jadwal"
                  onclick={() => model.deleteSchedule(item)}>×</button
                >{:else}<button
                  class="schedule-open"
                  aria-label="Buka detail sapi {item.cow.name}"
                  onclick={() => {
                    model.openReproductionDetails(item.cow);
                  }}
                >
                  <Icon name={"chevron"} size={17} />
                </button>{/if}
            </article>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
  {#if model.upcomingSchedules.length === 0}<p class="empty-record">
      Belum ada jadwal mendatang. Tambahkan jadwal atau catat tanggal birahi,
      IB, dan obat cacing pada data sapi.
    </p>{/if}
</section>

<section class="backup-card">
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
