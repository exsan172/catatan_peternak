<script>
  let { name, size = 20 } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === "home"}<path
      d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"
    />
  {:else if name === "cow"}<path
      d="M5 9 3 6l4 1m12 2 2-3-4 1M5 10a7 7 0 0 1 14 0v5a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z"
    /><path d="M9 12h.01M15 12h.01M9 16h6M8 19v2m8-2v2" />
  {:else if name === "wallet"}<rect
      x="3"
      y="5"
      width="18"
      height="15"
      rx="2"
    /><path d="M3 9h18m-5 5h.01M7 5V3h11" />
  {:else if name === "heart"}<path
      d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.8 2.6Z"
    /><path d="M8 12h2l1-2 2 4 1-2h2" />
  {:else if name === "activity"}<path d="M3 12h4l3-8 4 16 3-8h4" />
  {:else if name === "baby"}<circle cx="12" cy="12" r="9" /><path
      d="M8.5 10h.01M15.5 10h.01M9 15c1.8 1.4 4.2 1.4 6 0M12 3v3"
    />
  {:else if name === "calendar"}<rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
    /><path d="M16 3v4M8 3v4M3 10h18" />
  {:else if name === "stethoscope"}<path
      d="M6 3v5a4 4 0 0 0 8 0V3m-8 0H4m10 0h2m-6 9v2a5 5 0 0 0 10 0v-1"
    /><circle cx="20" cy="11" r="2" /><path d="M10 3v2" />
  {:else if name === "spark"}<path
      d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"
    />
  {:else if name === "leaf"}<path
      d="M20 4c-9 0-14 4-14 10a6 6 0 0 0 6 6c6 0 10-7 8-16Z"
    /><path d="M4 21c3-5 7-8 12-11" />
  {:else if name === "arrow"}<path d="M5 12h14m-6-6 6 6-6 6" />
  {:else if name === "plus"}<path d="M12 5v14m-7-7h14" />
  {:else if name === "barn"}<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z" /><path
      d="M3 10h18M9 20v-6h6v6"
    />
  {:else if name === "bell"}<path
      d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"
    />
  {:else if name === "chevron"}<path d="m9 18 6-6-6-6" />
  {:else if name === "download"}<path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"
    />
  {:else if name === "upload"}<path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12"
    />
  {:else if name === "sun"}<circle cx="12" cy="12" r="4" /><path
      d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
    />
  {:else if name === "moon"}<path
      d="M20.9 13.2A8.5 8.5 0 0 1 10.8 3.1 8.5 8.5 0 1 0 20.9 13.2Z"
    />{/if}
</svg>
