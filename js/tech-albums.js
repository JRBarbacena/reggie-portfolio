const ALBUMS = {
  aws: {
    title: "AWS community",
    description: "Community moments, a field visit, and conversations that made the learning feel bigger than a screen.",
    photos: [
      ["assets/images/photos/KiroVerse.JPG", "Reggie with friends in front of an AWS wall sign"],
      ["assets/images/photos/AWS_HQ.JPG", "Reggie beside an illuminated AWS sign"],
    ],
  },
  "build-nights": {
    title: "Build nights",
    description: "A room full of ideas, hands-on learning, and the energy of building alongside other people.",
    photos: [
      ["assets/images/photos/BuildNights_AWS.JPG", "Attendees gathered during an AWS Build Night"],
      ["assets/images/photos/KiroVerse.JPG", "Friends and fellow attendees at an AWS event"],
      ["assets/images/photos/AWS_HQ.JPG", "Reggie visiting an AWS space"],
    ],
  },
  cursor: {
    title: "Cafe Cursor",
    description: "A small album for the AI tooling side of the journey, with a few related field notes while more photos are still on the way.",
    photos: [
      ["assets/images/photos/Cursor_Cafe.JPG", "Reggie at Cafe Cursor Manila holding a coffee"],
      ["assets/images/photos/AWS_HQ.JPG", "Reggie at an AWS visit"],
      ["assets/images/photos/BuildNights_AWS.JPG", "People gathered at a tech community event"],
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

  document.querySelectorAll("[data-album-id]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const album = ALBUMS[trigger.dataset.albumId];
      if (!album) return;
      title.textContent = album.title;
      description.textContent = album.description;
      gallery.replaceChildren(
        ...album.photos.map(([src, alt]) => {
          const figure = document.createElement("figure");
          const image = document.createElement("img");
          image.src = src;
          image.alt = alt;
          image.loading = "lazy";
          figure.append(image);
          return figure;
        })
      );
      modal.showModal();
    });
  });

  close.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAlbums);
} else {
  initAlbums();
}
