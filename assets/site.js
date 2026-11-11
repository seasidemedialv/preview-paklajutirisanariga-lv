/* Lead site (shared kit) - mobile menu (owner rule 12), jump to the form, lead forms. No dependencies. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const LANG = (document.documentElement.lang || "lv").slice(0, 2);
  const I18N = {
    lv: { required: "Lūdzu, aizpildiet šo lauku.", phone: "Lūdzu, ierakstiet tālruņa numuru (vismaz 8 cipari).", sending: "Sūtām…",
          error: "Neizdevās nosūtīt. Pārbaudiet interneta savienojumu un mēģiniet vēlreiz.",
          done: '<strong>Paldies! Pieteikums saņemts.</strong> Speciālists ar Jums sazināsies <b>5 minūšu laikā</b>, lai precizētu darbu un cenu. Lūdzu, esiet sasniedzams pa tālruni.',
          uploading: "Augšupielādējam foto…", uploadFailed: "Foto neizdevās augšupielādēt. Mēģiniet vēlreiz vai noņemiet foto un nosūtiet pieteikumu bez tā.",
          fileTooBig: "Fails ir par lielu, līdz 10 MB.", fileWrongType: "Der JPG, PNG vai WebP fails.", tooManyFiles: "Var pievienot līdz 3 foto.",
          photoRemove: "Noņemt foto", photoCount: (n) => `Pievienoti foto: ${n} no 3`, photosRestored: "Pārlūks restartējās. Foto ir saglabāti. Ja pēdējais neparādījās, uzņemiet to vēlreiz.",
          },
    en: { required: "Please fill in this field.", phone: "Please enter a phone number (at least 8 digits).", sending: "Sending…",
          error: "Sending failed. Please check your internet connection and try again.",
          done: '<strong>Thank you! Your request has been received.</strong> A specialist will contact you <b>within 5 minutes</b> to confirm the job and the price. Please make sure you can be reached by phone.',
          uploading: "Uploading photos…", uploadFailed: "The photos could not be uploaded. Try again, or remove them and send the request without them.",
          fileTooBig: "The file is too large, 10 MB at most.", fileWrongType: "Please use a JPG, PNG or WebP file.", tooManyFiles: "You can add up to 3 photos.",
          photoRemove: "Remove photo", photoCount: (n) => `Photos added: ${n} of 3`, photosRestored: "The browser restarted. Your photos are safe. If the last one did not appear, take it again.",
          },
    ru: { required: "Пожалуйста, заполните это поле.", phone: "Пожалуйста, укажите номер телефона (не менее 8 цифр).", sending: "Отправляем…",
          error: "Не удалось отправить. Проверьте подключение к интернету и попробуйте еще раз.",
          done: '<strong>Спасибо! Заявка получена.</strong> Специалист свяжется с Вами <b>в течение 5 минут</b>, чтобы уточнить работу и цену. Пожалуйста, будьте доступны по телефону.',
          uploading: "Загружаем фото…", uploadFailed: "Не удалось загрузить фото. Попробуйте еще раз или удалите фото и отправьте заявку без них.",
          fileTooBig: "Файл слишком большой, не более 10 МБ.", fileWrongType: "Подойдет файл JPG, PNG или WebP.", tooManyFiles: "Можно добавить до 3 фото.",
          photoRemove: "Удалить фото", photoCount: (n) => `Добавлено фото: ${n} из 3`, photosRestored: "Браузер перезапустился. Фото сохранены. Если последнее не появилось, сделайте его еще раз.",
          },
  };
  const MSG = I18N[LANG] || I18N.lv;
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- mobile nav ---- */
  const toggle = $(".nav-toggle"), nav = $("#nav"), backdrop = $(".nav-backdrop");
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      document.documentElement.classList.toggle("nav-open", open);   // dims + blurs the page, stops it scrolling behind the menu
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    if (backdrop) backdrop.addEventListener("click", () => setOpen(false));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
    matchMedia("(min-width: 1101px)").addEventListener("change", (m) => { if (m.matches) setOpen(false); });
  }

  /* ---- the sticky phone bar steps aside while a lead form is on screen or being filled in ---- */
  const sticky = $(".stickycta"), leadForms = $$("[data-lead-form]");
  if (sticky && leadForms.length) {
    const seen = new Set();
    let focused = false;
    const update = () => sticky.classList.toggle("is-away", focused || seen.size > 0);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
        update();
      }, { threshold: 0.15 });
      leadForms.forEach((f) => io.observe(f));
    }
    leadForms.forEach((f) => {
      f.addEventListener("focusin", () => { focused = true; update(); });
      f.addEventListener("focusout", () => { setTimeout(() => { focused = leadForms.some((x) => x.contains(document.activeElement)); update(); }, 0); });
    });
  }

  /* ---- jump to the form and focus its first field ---- */
  $$("[data-to-form]").forEach((a) => a.addEventListener("click", (e) => {
    const form = $("#forma");   // the hero form (same form on every page)
    if (!form) return;
    e.preventDefault();
    form.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    const first = form.querySelector("select, input:not([type=hidden])");
    setTimeout(() => first && first.focus({ preventScroll: true }), 450);
  }));

  /* ---- optional photos (recipe: Microsite Building/Photo-in-a-form-recipe) ----
     Downscaled once at add time, one at a time; only the small blobs stay in memory. Each form keeps them in
     sessionStorage, because Android can kill the tab while the camera app is open. Upload happens before the webhook and
     a failed upload stops the send. The field exists only when site_config.json form.image_worker_url is set. */
  const MAX_IMAGES = 3, MAX_BYTES = 10 * 1024 * 1024, MAX_EDGE = 2000, THUMB_EDGE = 320, JPEG_Q = 0.82;
  const TYPES = ["image/jpeg", "image/png", "image/webp"];
  const storeKey = (id) => `lead_photos_v1:${id}`;
  const blobToDataUrl = (blob) => new Promise((res) => {
    const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(blob);
  });
  const dataUrlToBlob = (url) => {
    try {
      const [head, b64] = url.split(",");
      const bin = atob(b64), arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: (head.match(/:(.*?);/) || [])[1] || "image/jpeg" });
    } catch (e) { return null; }
  };
  const savePhotos = async (id, files) => {
    try {
      if (!files.length) { sessionStorage.removeItem(storeKey(id)); return; }
      const packed = [];
      for (const f of files) packed.push({ name: f.displayName, size: f.displaySize, upload: await blobToDataUrl(f), thumb: await blobToDataUrl(f.thumbBlob || f) });
      sessionStorage.setItem(storeKey(id), JSON.stringify(packed));
    } catch (e) { try { sessionStorage.removeItem(storeKey(id)); } catch (e2) { /* private mode: photos still work in this tab */ } }
  };
  const loadPhotos = (id) => {
    try {
      return JSON.parse(sessionStorage.getItem(storeKey(id)) || "[]").map((p) => {
        const blob = dataUrlToBlob(p.upload);
        if (!blob) return null;
        blob.displayName = p.name; blob.displaySize = p.size; blob.thumbBlob = dataUrlToBlob(p.thumb) || blob;
        return blob;
      }).filter(Boolean);
    } catch (e) { return []; }
  };
  const clearPhotos = (id) => { try { sessionStorage.removeItem(storeKey(id)); } catch (e) { /* nothing stored */ } };
  // <img> + drawImage scaled by the LONG edge: the smallest decode on phones, never upscales. Falls back to the file itself.
  const downscale = (file, edge, q) => new Promise((resolve) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.decoding = "async";
    let settled = false;
    const finish = (blob) => {
      if (settled) return;                       // clearing src fires a phantom onerror
      settled = true;
      URL.revokeObjectURL(url);
      img.onload = img.onerror = null;
      img.removeAttribute("src");
      resolve(blob || file);
    };
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight, scale = Math.min(1, edge / Math.max(w, h));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => { c.width = c.height = 0; finish(b); }, "image/jpeg", q);
      } catch (e) { finish(null); }
    };
    img.onerror = () => finish(null);
    img.src = url;
  });
  const sizeText = (n) => (n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1).replace(".0", "")} MB`);
  const initPhotoField = (field) => {
    const input = $("[data-photo-input]", field), drop = $("[data-photo-drop]", field), list = $("[data-photo-list]", field), count = $("[data-photo-count]", field);
    const camera = $("[data-photo-camera]", field), gallery = $("[data-photo-gallery]", field);
    const form = input.form, id = form.id, files = [], urls = [];
    field.photoFiles = files;
    let reserved = 0, chain = Promise.resolve();   // slots are claimed at pick time: downscaling is async and files.length lags
    const note = (text, isErr) => {
      let n = $(".file-status", field);
      if (!n) { n = document.createElement("small"); n.className = "file-status"; field.append(n); }
      n.textContent = text; n.classList.toggle("is-err", !!isErr);
    };
    const render = () => {
      urls.splice(0).forEach(URL.revokeObjectURL);
      list.textContent = "";
      files.forEach((file) => {
        const url = URL.createObjectURL(file.thumbBlob || file); urls.push(url);
        const item = document.createElement("div"), img = document.createElement("img"), size = document.createElement("span"), rm = document.createElement("button");
        item.className = "photo-item"; img.className = "photo-thumb"; img.src = url; img.alt = "";
        size.className = "photo-size"; size.textContent = sizeText(file.displaySize || file.size);
        rm.type = "button"; rm.className = "photo-remove"; rm.setAttribute("aria-label", MSG.photoRemove);
        rm.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        rm.addEventListener("click", () => {      // by identity: render() rebuilds the list, an index would go stale
          const at = files.indexOf(file);
          if (at !== -1) { files.splice(at, 1); reserved = Math.max(0, reserved - 1); }
          savePhotos(id, files); render(); note("", false);
        });
        item.append(img, size, rm); list.append(item);
      });
      field.classList.toggle("has-file", files.length > 0);
      field.classList.toggle("is-full", Math.max(files.length, reserved) >= MAX_IMAGES);
      count.textContent = files.length ? MSG.photoCount(files.length) : "";
    };
    const accept = (incoming) => {
      const picked = Array.from(incoming || []);
      if (!picked.length) return;
      let problem = "";
      const queue = [];
      for (const file of picked) {
        if (reserved >= MAX_IMAGES) { problem = MSG.tooManyFiles; break; }
        if (!TYPES.includes(file.type)) { problem = MSG.fileWrongType; continue; }
        if (file.size > MAX_BYTES) { problem = MSG.fileTooBig; continue; }
        if (files.some((f) => f.displayName === file.name && f.displaySize === file.size) || queue.some((f) => f.name === file.name && f.size === file.size)) continue;
        reserved++; queue.push(file);
      }
      input.value = "";                           // the same file can be picked again, the camera reopened
      note(problem, !!problem);
      if (!queue.length) return;
      field.classList.toggle("is-full", reserved >= MAX_IMAGES);
      chain = chain.then(async () => {
        for (const file of queue) {               // one decode at a time; the original is dropped after this loop
          const upload = await downscale(file, MAX_EDGE, JPEG_Q);
          upload.displayName = file.name; upload.displaySize = file.size;
          upload.thumbBlob = await downscale(upload, THUMB_EDGE, 0.7);
          if (files.length < MAX_IMAGES) { files.push(upload); await savePhotos(id, files); } else reserved = Math.max(files.length, reserved - 1);
          render();
          await new Promise((r) => setTimeout(r, 0));
        }
      }).catch(() => {});
    };
    input.addEventListener("change", () => accept(input.files));
    // bare capture, never capture="environment": naming a camera makes some Android camera apps restart the tab
    const openPicker = (cam) => {
      if (reserved >= MAX_IMAGES) { note(MSG.tooManyFiles, true); return; }
      if (cam) { input.setAttribute("capture", ""); input.removeAttribute("multiple"); } else { input.removeAttribute("capture"); input.setAttribute("multiple", ""); }
      input.click();
    };
    camera.addEventListener("click", () => openPicker(true));
    gallery.addEventListener("click", () => openPicker(false));
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
    ["dragleave", "dragend"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("dragging")));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("dragging"); accept(e.dataTransfer && e.dataTransfer.files); });
    const restored = loadPhotos(id).slice(0, MAX_IMAGES);
    if (restored.length) { files.push(...restored); reserved = files.length; note(MSG.photosRestored, false); }
    render();
  };
  // one photo to the Worker, returns its public URL; a retry after a failed send reuses it
  const uploadImage = async (worker, blob) => {
    if (blob.uploadedUrl) return blob.uploadedUrl;
    const fd = new FormData();
    fd.append("file", blob, blob.displayName || "photo.jpg");   // no Content-Type by hand: the browser adds the boundary
    const res = await fetch(worker, { method: "POST", body: fd });
    const out = await res.json();
    if (!res.ok || !out.success || !out.image_url) throw new Error(out.error || "upload failed");
    blob.uploadedUrl = out.image_url;
    return out.image_url;
  };
  $$("[data-photo-field]").forEach(initPhotoField);

  /* ---- lead forms (the only contact channel) ---- */
  const valid = (form) => {
    let ok = true, firstBad = null;
    $$("[required]", form).forEach((el) => {
      let bad = !String(el.value || "").trim();
      if (!bad && el.name === "phone") bad = String(el.value).replace(/\D/g, "").length < 8;
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      const hint = el.parentElement.querySelector(".field__err");
      if (bad) {
        ok = false; firstBad = firstBad || el;
        if (!hint) { const s = document.createElement("small"); s.className = "field__err"; s.textContent = el.name === "phone" ? MSG.phone : MSG.required; el.after(s); }
      } else if (hint) hint.remove();
    });
    if (firstBad) firstBad.focus();
    return ok;
  };

  $$("[data-lead-form]").forEach((form) => {
    const status = $(".form__status", form);
    const btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.company_website && form.company_website.value) return;          // honeypot
      if (!valid(form)) return;
      const data = Object.fromEntries(new FormData(form).entries());
      // optional choice groups (site_config.json form.choice): a group with nothing chosen still sends its key, empty
      $$("input[type=radio][name]", form).forEach((r) => { if (!(r.name in data)) data[r.name] = ""; });
      delete data.company_website;
      delete data.photo;                                                        // the input's value, not the image
      const field = $("[data-photo-field]", form), photos = (field && field.photoFiles) || [];
      const payload = {
        ...data,
        source: location.href,
        page_path: location.pathname,
        language: document.documentElement.lang || "lv",
        site: location.hostname,
        request_id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
        image_urls: [],
      };
      btn.disabled = true; btn.setAttribute("aria-busy", "true"); status.className = "form__status"; status.textContent = photos.length ? MSG.uploading : MSG.sending;
      if (photos.length) {
        try {
          field.classList.add("uploading");
          payload.image_urls = await Promise.all(photos.map((b) => uploadImage(form.dataset.imageWorker, b)));
          status.textContent = MSG.sending;
        } catch (err) {                                                         // never send a photo-less lead silently
          status.className = "form__status is-err"; status.textContent = MSG.uploadFailed;
          btn.removeAttribute("aria-busy"); btn.disabled = false;
          return;
        } finally { field.classList.remove("uploading"); }
      }
      // no endpoint yet (lead flow not connected): fail visibly, never pretend the request was sent
      const send = () => (!form.dataset.endpoint ? Promise.resolve({ ok: false }) : fetch(form.dataset.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .catch(() => ({ ok: false })));                                                  // network error counts as a failed attempt
      try {
        let res = await send();
        for (const wait of [1500, 5000]) {                                      // two retries with backoff: a mobile network or the webhook can blink
          if (res.ok) break;
          await new Promise((r) => setTimeout(r, wait)); res = await send();
        }
        if (!res.ok) throw new Error(String(res.status));
        form.classList.add("is-sent");
        clearPhotos(form.id);
        status.innerHTML = `<div class="form__done">${MSG.done}</div>`;
        if (window.dataLayer) window.dataLayer.push({ event: "lead_submit", form: form.id });
      } catch (err) {
        status.className = "form__status is-err"; status.textContent = MSG.error;
      } finally {
        btn.removeAttribute("aria-busy");
        if (!form.classList.contains("is-sent")) btn.disabled = false;
      }
    });
  });
})();
