const ALBUMS = {
  aws: {
    title: "AWS community",
    description: "Community moments, a field visit, and conversations that made the learning feel bigger than a screen.",
    photos: [
      { src: "assets/images/photos/KiroVerse.JPG", alt: "Reggie with friends in front of an AWS wall sign", width: 4032, height: 3024 },
      { src: "assets/images/photos/AWS_HQ.JPG", alt: "Reggie beside an illuminated AWS sign", width: 4032, height: 3024 },
    ],
  },
  "build-nights": {
    title: "Build nights",
    description: "A room full of ideas, hands-on learning, and the energy of building alongside other people.",
    photos: [
      { src: "assets/images/photos/BuildNights_AWS.JPG", alt: "Attendees gathered during an AWS Build Night", width: 4032, height: 3024 },
      { src: "assets/images/photos/KiroVerse.JPG", alt: "Friends and fellow attendees at an AWS event", width: 4032, height: 3024 },
      { src: "assets/images/photos/AWS_HQ.JPG", alt: "Reggie visiting an AWS space", width: 4032, height: 3024 },
    ],
  },
  cursor: {
    title: "Cafe Cursor",
    description: "A small album for the AI tooling side of the journey, using approved photos from related community events.",
    photos: [
      { src: "assets/images/photos/Cursor_Cafe.JPG", alt: "Reggie at Cafe Cursor Manila holding a coffee", width: 4032, height: 3024 },
      { src: "assets/images/photos/AWS_HQ.JPG", alt: "Reggie at an AWS visit", width: 4032, height: 3024 },
      { src: "assets/images/photos/BuildNights_AWS.JPG", alt: "People gathered at a tech community event", width: 4032, height: 3024 },
    ],
  },
};

function initAlbums() {
  const modal = document.querySelector("[data-album-modal]");
  const title = document.querySelector("[data-album-title]");
  const description = document.querySelector("[data-album-description]");
  const gallery = document.querySelector("[data-album-gallery]");
  const close = document.querySelector("[data-album-close]");
  if (!modal || !title || !description || !gallery || !close) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeTrigger = null;
  let closeTimer = 0;

  const finishClose = () => {
    window.clearTimeout(closeTimer);
    modal.classList.remove("is-closing");
    if (modal.open) modal.close();
    activeTrigger?.focus();
    activeTrigger = null;
  };

  const closeModal = () => {
    if (!modal.open || modal.classList.contains("is-closing")) return;
    if (reducedMotion.matches) {
      finishClose();
      return;
    }
    modal.classList.add("is-closing");
    modal.addEventListener("animationend", finishClose, { once: true });
    closeTimer = window.setTimeout(finishClose, 350);
  };

  document.querySelectorAll("[data-album-id]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const album = ALBUMS[trigger.dataset.albumId];
      if (!album) return;
      title.textContent = album.title;
      description.textContent = album.description;
      gallery.replaceChildren(
        ...album.photos.map(({ src, alt, width, height }) => {
          const figure = document.createElement("figure");
          const image = document.createElement("img");
          image.src = src;
          image.alt = alt;
          image.width = width;
          image.height = height;
          image.loading = "lazy";
          figure.append(image);
          return figure;
        })
      );
      activeTrigger = trigger;
      modal.classList.remove("is-closing");
      modal.showModal();
    });
  });

  close.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  modal.addEventListener("close", () => {
    modal.classList.remove("is-closing");
    window.clearTimeout(closeTimer);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAlbums);
} else {
  initAlbums();
}
