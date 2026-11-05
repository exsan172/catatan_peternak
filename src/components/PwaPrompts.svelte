<script>
  import { onMount } from "svelte";

  let updateAvailable = $state(false);
  let installVisible = $state(false);
  let installPrompt = $state(null);
  let installHelp = $state(false);

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function dismissInstall() {
    installVisible = false;
    localStorage.setItem("catatan-peternak-install-dismissed", "true");
  }

  async function installApp() {
    if (!installPrompt) {
      installHelp = true;
      return;
    }

    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    installPrompt = null;
    if (result.outcome === "accepted") installVisible = false;
  }

  function reloadForUpdate() {
    window.location.reload();
  }

  async function checkForAppUpdate() {
    const currentVersion = getDocumentVersion(document);
    if (!currentVersion || !navigator.onLine) return;

    try {
      const response = await fetch(`/index.html?update-check=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const html = await response.text();
      const latestVersion = getDocumentVersion(
        new DOMParser().parseFromString(html, "text/html"),
      );
      if (latestVersion && latestVersion !== currentVersion) {
        updateAvailable = true;
      }
    } catch {
      // Update checks are best-effort and must not interrupt offline use.
    }
  }

  function getDocumentVersion(page) {
    const script = page
      .querySelector('script[type="module"][src]')
      ?.getAttribute("src");
    const styles = [...page.querySelectorAll('link[rel="stylesheet"][href]')]
      .map((link) => link.getAttribute("href"))
      .sort();
    return script ? `${script}|${styles.join("|")}` : null;
  }

  onMount(() => {
    const standalone = isStandalone();
    const hadController = Boolean(navigator.serviceWorker?.controller);
    if (
      !standalone &&
      localStorage.getItem("catatan-peternak-install-dismissed") !== "true"
    ) {
      installVisible = true;
    }

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      installPrompt = event;
      installVisible = !isStandalone();
    };
    const handleInstalled = () => {
      installVisible = false;
      installPrompt = null;
    };
    const handleControllerChange = () => {
      if (hadController && navigator.serviceWorker.controller) {
        updateAvailable = true;
      }
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    navigator.serviceWorker?.ready.then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        updateAvailable = true;
      }
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            updateAvailable = true;
          }
        });
      });
      registration.update().catch(() => {});
    });

    checkForAppUpdate();
    const updateCheckInterval = window.setInterval(
      checkForAppUpdate,
      5 * 60 * 1000,
    );

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
      window.clearInterval(updateCheckInterval);
    };
  });
</script>

{#if updateAvailable}
  <aside class="pwa-notice update-notice" role="status">
    <div>
      <strong>Pembaruan tersedia</strong>
      <p>Muat ulang Catatan Peternak untuk memakai versi terbaru.</p>
    </div>
    <button class="pwa-primary" onclick={reloadForUpdate}>Muat ulang</button>
    <button
      class="pwa-dismiss"
      aria-label="Tutup pemberitahuan"
      onclick={() => (updateAvailable = false)}>×</button
    >
  </aside>
{/if}

{#if installVisible && !isStandalone()}
  <aside
    class="pwa-notice install-notice"
    role="region"
    aria-label="Pasang aplikasi"
  >
    <div>
      <strong>Pasang Catatan Peternak</strong>
      <p>
        {#if installHelp}
          Buka menu browser, lalu pilih “Tambahkan ke layar utama” atau “Instal
          aplikasi”.
        {:else if installPrompt}
          Pasang aplikasi agar lebih mudah dibuka dari layar utama.
        {:else}
          Untuk memasang, buka menu browser lalu pilih “Tambahkan ke layar
          utama”.
        {/if}
      </p>
    </div>
    <button class="pwa-primary" onclick={installApp}
      >{installPrompt ? "Pasang" : "Cara pasang"}</button
    >
    <button
      class="pwa-dismiss"
      aria-label="Tutup banner instalasi"
      onclick={dismissInstall}>×</button
    >
  </aside>
{/if}

<style>
  .pwa-notice {
    position: fixed;
    z-index: 40;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(680px, calc(100vw - 28px));
    padding: 13px 14px;
    border: 1px solid #d9e0e8;
    border-radius: 14px;
    background: #fff;
    color: #24324a;
    box-shadow: 0 12px 35px rgb(0 0 0 / 18%);
    transform: translateX(-50%);
  }

  .pwa-notice > div {
    flex: 1;
    min-width: 0;
  }

  .pwa-notice strong {
    font-size: 13px;
  }

  .pwa-notice p {
    margin: 4px 0 0;
    color: #667387;
    font-size: 11px;
    line-height: 1.4;
  }

  .update-notice {
    top: max(14px, env(safe-area-inset-top));
  }

  .install-notice {
    bottom: max(86px, calc(env(safe-area-inset-bottom) + 76px));
  }

  .pwa-primary,
  .pwa-dismiss {
    flex: none;
    min-height: 36px;
    border: 0;
    border-radius: 9px;
    cursor: pointer;
  }

  .pwa-primary {
    padding: 0 12px;
    background: #315fae;
    color: white;
    font:
      700 11px system-ui,
      sans-serif;
  }

  .pwa-dismiss {
    width: 32px;
    background: transparent;
    color: #758094;
    font-size: 21px;
  }

  :global(:root[data-theme="dark"]) .pwa-notice {
    border-color: #303631;
    background: #101211;
    color: #edf1ed;
  }

  :global(:root[data-theme="dark"]) .pwa-notice p {
    color: #a4ada5;
  }

  :global(:root[data-theme="dark"]) .pwa-primary {
    border: 1px solid #435a78;
    background: #26374f;
    color: #d5e2f5;
  }

  :global(:root[data-theme="dark"]) .pwa-dismiss {
    color: #b5beb6;
  }

  @media (max-width: 480px) {
    .pwa-notice {
      gap: 8px;
      padding: 11px;
    }

    .pwa-notice strong {
      font-size: 12px;
    }

    .pwa-notice p {
      font-size: 10px;
    }

    .pwa-primary {
      padding: 0 9px;
      font-size: 10px;
    }
  }
</style>
