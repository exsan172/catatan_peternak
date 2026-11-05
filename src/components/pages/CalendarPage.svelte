<script>
  import Icon from "../Icon.svelte";
  let { model } = $props();
</script>

<section class="page-heading">
  <p class="eyebrow">REPRODUKSI SAPI</p>
  <h1>Kalender birahi</h1>
  <p class="subheading">Catat birahi, IB, cek kehamilan, dan obat cacing.</p>
</section>
{#if model.selectedCalendarCow}
  <button class="calendar-back" onclick={() => model.closeCalendarDetails()}
    >‹ Kembali</button
  >
  <section class="repro-profile">
    <span class="cow-avatar {model.cowTone(model.selectedCalendarCow)}"
      >{model.selectedCalendarCow.name.slice(0, 1).toUpperCase()}</span
    >
    <div>
      <h2>{model.selectedCalendarCow.name}</h2>
      <p>
        #{model.selectedCalendarCow.code} · {model.normalizeCowBreed(
          model.selectedCalendarCow.breed,
        )}
        {#if model.selectedCalendarCow.category}
          · {model.selectedCalendarCow.category}{/if}
      </p>
      {#if model.selectedCalendarCow.birthDate}<p>
          Lahir: {model.localDate(model.selectedCalendarCow.birthDate)}
        </p>
        <p class="cow-age">
          Umur: {model.cowAge(model.selectedCalendarCow.birthDate)}
        </p>{/if}
    </div>
  </section>
  <div class="repro-recommendations">
    {#if model.selectedCalendarCow.inseminationDate && model.isCowInseminationActive(model.selectedCalendarCow)}<article
        class="recommendation-card insemination"
      >
        <span class="recommendation-icon">
          <Icon name={"spark"} size={20} />
        </span>
        <div>
          <strong>Inseminasi buatan (IB)</strong>
          <p>
            Dilakukan {model.localDate(
              model.selectedCalendarCow.inseminationDate,
            )}
          </p>
        </div>
      </article>{/if}
    {#if model.selectedCalendarCow.ibHistory?.length}<article
        class="recommendation-card insemination"
      >
        <span class="recommendation-icon">
          <Icon name={"spark"} size={20} />
        </span>
        <div>
          <strong>Riwayat IB</strong
          >{#each [...model.selectedCalendarCow.ibHistory].reverse() as entry}<p
            >
              {model.localDate(entry.date)} · {entry.result ||
                "Belum diperiksa"}
            </p>{/each}
        </div>
      </article>{/if}
    {#if model.isCowInseminationActive(model.selectedCalendarCow) && !model.selectedCalendarCow.calvingDate && model.selectedCalendarCow.pregnancyResult !== "Tidak hamil"}
      {@const estimate = model.calvingEstimate(
        model.selectedCalendarCow.inseminationDate,
      )}
      <article class="recommendation-card calving-estimate">
        <span class="recommendation-icon">
          <Icon name={"baby"} size={20} />
        </span>
        <div>
          <strong>Perkiraan kelahiran</strong>
          <p>
            {model.selectedCalendarCow.pregnancyResult === "Hamil" ||
            model.selectedCalendarCow.pregnant ||
            model.selectedCalendarCow.status === "Hamil"
              ? "Hasil cek mencatat sapi bunting."
              : "Jika IB berhasil dan hasil cek menunjukkan bunting:"}
          </p>
          <p>
            Perkiraan lahir: <b>{model.localDate(estimate.expectedDate)}</b> (sekitar
            283 hari setelah IB).
          </p>
          <p>
            Rentang kelahiran umum: {model.localDate(
              estimate.earliestDate,
            )}–{model.localDate(estimate.latestDate)}.
          </p>
          <p>
            Persiapan kandang dan perlengkapan: <b
              >{model.localDate(estimate.preparationStart)}–{model.localDate(
                estimate.preparationEnd,
              )}</b
            > (2–4 minggu sebelum perkiraan).
          </p>
          <small
            >Perkiraan dapat berbeda menurut sapi dan jenis kelamin pedet.</small
          >
        </div>
      </article>
    {/if}
    {#if model.weaningDateForCow(model.selectedCalendarCow)}<article
        class="recommendation-card weaning"
      >
        <span class="recommendation-icon">
          <Icon name={"cow"} size={20} />
        </span>
        <div>
          <strong>Jadwal sapih</strong>
          <p>
            {model.localDate(
              model.weaningDateForCow(model.selectedCalendarCow),
            )} · lima bulan setelah melahirkan
          </p>
        </div>
      </article>{/if}
    {#if model.pregnancyLikelihood}<article
        class="recommendation-card likelihood"
      >
        <span class="recommendation-icon">
          <Icon name={"heart"} size={20} />
        </span>
        <div>
          <strong
            >Perkiraan kemungkinan bunting: {model.pregnancyLikelihood
              .percent}%</strong
          >
          <p>
            {model.pregnancyLikelihood.cycles === 1
              ? "Satu siklus (sekitar 21 hari) terpantau tanpa birahi."
              : "Dua siklus atau lebih terpantau tanpa birahi."} Ini perkiraan dari
            catatan tidak kembali birahi, bukan diagnosis.
          </p>
          <a
            href="https://www.nadis.org.uk/disease-a-z/cattle/fertility-in-dairy-herds/part-5-pregnancy-diagnosis/"
            target="_blank"
            rel="noreferrer">Tentang keterbatasan perkiraan</a
          >
        </div>
      </article>{/if}
    {#if model.pregnancyCheckRecommendation}<article
        class="recommendation-card pregnancy"
      >
        <span class="recommendation-icon">
          <Icon name={"baby"} size={20} />
        </span>
        <div>
          <strong>Cek kehamilan</strong>
          <p>
            Rekomendasi sekitar {model.localDate(
              model.pregnancyCheckRecommendation,
            )}, 60 hari setelah IB.
          </p>
        </div>
      </article>{/if}
    {#if model.selectedCalendarCow.heatDate}<details class="heat-cycle">
        <summary>
          <span>Birahi terakhir</span>
          <strong>{model.localDate(model.selectedCalendarCow.heatDate)}</strong>
        </summary>
        <div class="heat-cycle-content">
          <p>Tanda yang teramati</p>
          <div class="heat-observation-list">
            {#each ["Menunggang", "Teriak-teriak", "Keluar lendir", "Vulva merah dan bengkak"] as observation}<label
              >
                <input
                  type="checkbox"
                  checked={(
                    model.selectedCalendarCow.heatObservationsByDate?.[
                      model.selectedCalendarCow.heatDate
                    ] ||
                    model.selectedCalendarCow.heatObservations ||
                    []
                  ).includes(observation)}
                  onchange={() =>
                    model.toggleHeatObservation(
                      model.selectedCalendarCow.heatDate,
                      observation,
                    )}
                />{observation}</label
              >{/each}
          </div>
        </div>
      </details>{/if}
    {#each model.heatCheckRecommendations(model.selectedCalendarCow) as heatDate}<details
        class="heat-cycle"
      >
        <summary>
          <span
            >{heatDate < model.todayKey()
              ? "Pengecekan birahi terlewat"
              : "Pantau birahi · siklus 21 hari"}</span
          >
          <strong>{model.localDate(heatDate)}</strong>
        </summary>
        <div class="heat-cycle-content">
          <p>
            {heatDate < model.todayKey()
              ? "Pengecekan sejak"
              : "Perkiraan birahi sekitar"}
            {model.localDate(heatDate)}. Siklus dapat bervariasi 17–24 hari.
          </p>
          <label
            class="heat-check-toggle"
            class:disabled={heatDate > model.todayKey()}
          >
            <input
              type="checkbox"
              disabled={heatDate > model.todayKey()}
              checked={model.selectedCalendarCow.heatChecks?.includes(
                heatDate,
              ) || false}
              onchange={() => model.toggleHeatCheck(heatDate)}
            />
            {heatDate > model.todayKey()
              ? "Belum waktunya dicek"
              : "Sudah dipantau, birahi tidak terlihat"}</label
          >
          <p>Tanda yang teramati</p>
          <div class="heat-observation-list">
            {#each ["Menunggang", "Teriak-teriak", "Keluar lendir", "Vulva merah dan bengkak"] as observation}<label
                class:disabled={heatDate > model.todayKey()}
              >
                <input
                  type="checkbox"
                  disabled={heatDate > model.todayKey()}
                  checked={model.selectedCalendarCow.heatObservationsByDate?.[
                    heatDate
                  ]?.includes(observation) || false}
                  onchange={() =>
                    model.toggleHeatObservation(heatDate, observation)}
                />{observation}</label
              >{/each}
          </div>
          {#if model.isCowInseminationActive(model.selectedCalendarCow) && heatDate <= model.todayKey()}<div
              class="heat-cycle-action"
            >
              <button
                type="button"
                class="btn-heat-again"
                onclick={() => model.markCowInHeat(heatDate)}
              >
                <Icon name={"spark"} size={15} />
                <span
                  >Catat birahi lagi ({model.localDate(heatDate)}) · IB gagal</span
                >
              </button>
            </div>{/if}
        </div>
      </details>{/each}
    {#if model.selectedCalendarCow.nextDewormingDate}<article
        class="recommendation-card deworm"
      >
        <span class="recommendation-icon">
          <Icon name={"stethoscope"} size={20} />
        </span>
        <div>
          <strong>Jadwal obat cacing</strong>
          <p>{model.localDate(model.selectedCalendarCow.nextDewormingDate)}</p>
        </div>
      </article>{/if}
  </div>
  <form class="record-form repro-form" onsubmit={model.saveReproductionDetails}>
    <p class="eyebrow">CATATAN REPRODUKSI</p>
    <label
      >Tanggal birahi terakhir<input
        type="date"
        bind:value={model.reproDraft.heatDate}
        oninput={model.handleHeatDateChange}
      />
    </label>
    <label
      >Tanggal IB (inseminasi buatan)<input
        type="date"
        bind:value={model.reproDraft.inseminationDate}
      />
    </label>
    {#if model.selectedCalendarCow.status === "Menyusui"}<label
        >Tanggal melahirkan<input
          type="date"
          bind:value={model.reproDraft.calvingDate}
        />
      </label>{/if}
    {#if model.pregnancyCheckRecommendation}<div class="recommendation-note">
        Pemeriksaan dapat dilakukan paling cepat 45 hari setelah IB. Untuk
        mengurangi risiko kehilangan kebuntingan, disarankan sekitar 60 hari: <strong
          >{model.localDate(model.pregnancyCheckRecommendation)}</strong
        >. Lakukan bersama dokter hewan atau petugas terlatih.
      </div>{/if}
    <label
      >Hasil cek kehamilan<select bind:value={model.reproDraft.pregnancyResult}>
        <option>Belum diperiksa</option>
        <option>Hamil</option>
        <option>Tidak hamil</option>
      </select>
    </label>
    <div class="form-grid">
      <label
        >Terakhir diberi obat cacing<input
          type="date"
          bind:value={model.reproDraft.lastDewormingDate}
          oninput={() =>
            (model.reproDraft.nextDewormingDate = model.addMonthsToDate(
              model.reproDraft.lastDewormingDate,
              2,
            ))}
        />
      </label>
      <label
        >Jadwal berikutnya (otomatis)<input
          type="date"
          value={model.addMonthsToDate(model.reproDraft.lastDewormingDate, 2)}
          readonly
        />
      </label>
    </div>
    <p class="deworming-note">
      Jadwal berikutnya dihitung dua bulan dari tanggal pemberian terakhir.
    </p>
    <button class="form-submit" type="submit">Simpan jadwal sapi</button>
    {#if model.reproMessage}<p class="backup-message" role="status">
        {model.reproMessage}
      </p>{/if}
  </form>
{:else}
  <div class="repro-guidance">
    <strong>Perkiraan siklus birahi</strong>
    <p>
      Siklus sapi rata-rata 21 hari dan dapat berkisar 17–24 hari. Tanggal di
      halaman ini adalah pengingat untuk dipantau, bukan kepastian birahi.
    </p>
  </div>
  {#if model.cows.length === 0}<p class="empty-record">
      Tambahkan data sapi terlebih dahulu untuk membuat kalender birahi.
    </p>{/if}
  <div class="calendar-cow-list">
    {#each model.cows as cow (cow.id)}<button
        class="calendar-cow-card"
        onclick={() => model.openReproductionDetails(cow)}
      >
        <span class="cow-avatar {model.cowTone(cow)}"
          >{cow.name.slice(0, 1).toUpperCase()}</span
        >
        <span class="calendar-cow-info">
          <strong>{cow.name}</strong>
          <small
            >#{cow.code} · {model.normalizeCowBreed(cow.breed)}
            {#if cow.category}
              · {cow.category}{/if}
          </small>{#if cow.birthDate}<small class="cow-age"
              >Umur: {model.cowAge(cow.birthDate)}</small
            >{/if}
          {#if cow.inseminationDate && model.isCowInseminationActive(cow)}<small
              >IB: {model.localDate(cow.inseminationDate)}</small
            >{/if}
          {#if cow.calvingDate}<small
              >Melahirkan: {model.localDate(cow.calvingDate)}</small
            >{/if}
          {#if model.weaningDateForCow(cow)}<small
              class="cow-pregnancy-likelihood"
              >Jadwal sapih: {model.localDate(
                model.weaningDateForCow(cow),
              )}</small
            >{/if}
          <small>{model.reproductiveCowLabel(cow)}</small
          >{#if model.pregnancyLikelihoodForCow(cow)}<small
              class="cow-pregnancy-likelihood"
              >Perkiraan bunting: {model.pregnancyLikelihoodForCow(cow)
                .percent}%</small
            >{/if}
        </span>
        <Icon name={"chevron"} size={19} />
      </button>{/each}
  </div>
{/if}
