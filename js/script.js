import { addDoc, collection, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-config.js";

const DEFAULT = {
  birthdayName: "Sharlaine",
  senderName: "someone who loves you",
  mainPhoto: "Assets/images/photo0.jpg",
  birthdayMusic: "Assets/music/lagu-hbd.mp3",
  datingMusic: "Assets/music/lagu-jadian.mp3",
  questionText: "Would you be my girlfriend even if it has to be a secret according to what you want beforehand?",
};
const page = document.body.dataset.page;
const config = { ...DEFAULT };
const AUDIO_FALLBACKS = {
  birthday: "Assets/music/lagu-hbd.mp3",
  dating: "Assets/music/lagu-jadian.mp3",
};

function resolveAsset(path) {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  const cleanPath = path.replace(/^\.\//, "").replace(/^(\.\.\/)+/, "");
  return page === "home" ? cleanPath : `../${cleanPath}`;
}

async function loadConfig() {
  if (!db) {
    document.querySelectorAll("[data-config]").forEach((element) => {
      const value = config[element.dataset.config];
      if (value) element.textContent = value;
    });
    return;
  }

  try {
    const snapshot = await getDoc(doc(db, "settings", "website-config"));
    if (snapshot.exists()) Object.assign(config, snapshot.data());
  } catch (error) {
    console.warn("Memakai konfigurasi default./Using the default configuration.", error);
  }
  document.querySelectorAll("[data-config]").forEach((element) => {
    const value = config[element.dataset.config];
    if (value) element.textContent = value;
  });
}

function getMusicState() {
  try {
    return JSON.parse(localStorage.getItem("birthday-surprise-music") || "{}");
  } catch {
    return {};
  }
}
function saveMusicState(mode, currentTime) {
  localStorage.setItem("birthday-surprise-music", JSON.stringify({ mode, currentTime }));
}

function createAudio(mode) {
  const id = mode === "dating" ? "dating-audio" : "birthday-audio";
  let audio = document.getElementById(id);
  if (!audio) {

function showMusicPrompt(mode) {
  let prompt = document.querySelector("[data-music-prompt]");
  if (!prompt) {
    prompt = document.createElement("button");
    prompt.type = "button";
    prompt.className = "music-prompt";
    prompt.dataset.musicPrompt = "true";
    document.body.append(prompt);
  }
  prompt.textContent = mode === "dating" ? "Play the romantic song" : "Play the birthday song";
  prompt.onclick = () => {
    const audio = playMusic(mode);
    audio.play().then(() => prompt.remove()).catch(() => {});
  };
}

    audio = document.createElement("audio");
    audio.id = id;
    document.body.append(audio);
  }
  audio.loop = mode === "dating";
  return audio;
}

function playMusic(mode) {
  const audio = createAudio(mode);
  const configuredPath =
    mode === "dating" ? config.datingMusic : config.birthdayMusic;
  const paths = [configuredPath, AUDIO_FALLBACKS[mode]].filter(
    (path, index, all) => path && all.indexOf(path) === index,
  );
  const state = getMusicState();
  if (state.mode === mode && Number.isFinite(state.currentTime)) {
    audio.currentTime = state.currentTime;
  }
  let sourceIndex = 0;
  const loadSource = () => {
    audio.src = resolveAsset(paths[sourceIndex]);
    audio.load();
    if (state.mode === mode && Number.isFinite(state.currentTime)) {
      audio.currentTime = state.currentTime;
    }
  };
  audio.onerror = () => {
    if (sourceIndex < paths.length - 1) {
      sourceIndex += 1;
      loadSource();
      audio.play().catch(() => {});
    }
  };
  loadSource();
  audio.ontimeupdate = () => saveMusicState(mode, audio.currentTime);
  audio.play().catch(() => {});
  saveMusicState(mode, audio.currentTime);
  return audio;
}

function stopBirthdayMusic() {
  const audio = document.getElementById("birthday-audio");
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  saveMusicState("dating", 0);
}

function navigate(target, mode) {
  if (mode === "dating") stopBirthdayMusic();
  localStorage.setItem("music-mode", mode || "birthday");
  window.location.href = target;
}

function startSlideshow() {
  const slides = [...document.querySelectorAll(".slide")];
  if (slides.length < 2) return;
  let current = 0;
  window.setInterval(() => {
    slides[current].classList.remove("is-active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("is-active");
  }, 5000);
}

async function submitResponse(answer, form) {
  const reason = form.elements.reason.value.trim();
  const status = form.querySelector(".status");
  if (!reason) {
    status.textContent = "Please fill in your reason first.";
    form.elements.reason.focus();
    return;
  }
  if (!db) {
    status.textContent = "Firebase is not configured yet. Add the real configuration to send your answer.";
    return;
  }
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = "Submit your answer...";
  try {
    await addDoc(collection(db, "responses"), {
      answer,
      reason,
      createdAt: serverTimestamp(),
    });
    localStorage.setItem("response-submitted", answer);
    localStorage.setItem("response-date", new Date().toISOString());
    form.classList.add("is-hidden");
    form.nextElementSibling?.classList.remove("is-hidden");
    if (answer === "accept") celebrate();
  } catch (error) {
    console.error(error);
    status.textContent = "Your answer could not be sent. Please check your Firebase configuration.";
    button.disabled = false;
  }
}

function celebrate() {
  for (let index = 0; index < 18; index += 1) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "♥";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.bottom = `${Math.random() * 15}%`;
    heart.style.animationDelay = `${Math.random() * 0.8}s`;
    document.body.append(heart);
    setTimeout(() => heart.remove(), 4800);
  }
}

async function init() {
  await loadConfig();
  if (page === "home") {
    document.querySelector("[data-start]")?.addEventListener("click", () => {
      if (confirm("This little surprise is ready to be opened. Starting now?")) {
        playMusic("birthday");
        navigate("pages/birthday-letter.html", "birthday");
      }
    });
    return;
  }
  if (page === "birthday-letter" || page === "transition") {
    playMusic("birthday");
  }
  if (
    [
      "short-letter",
      "memories",
      "heart-letter",
      "proposal",
      "accept",
      "reject",
    ].includes(page)
  ) {
    playMusic("dating");
  }
  if (page === "memories") startSlideshow();
  if (page !== "home") {
    const retryMode = [
      "short-letter",
      "memories",
      "heart-letter",
      "proposal",
      "accept",
      "reject",
    ].includes(page)
      ? "dating"
      : "birthday";
    const retryMusic = () => {
      playMusic(retryMode);
    };
    document.addEventListener("pointerdown", retryMusic, { once: true });
    document.addEventListener("touchstart", retryMusic, { once: true, passive: true });
    document.addEventListener("click", retryMusic, { once: true });
  }
  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.dataset.next, button.dataset.mode || "birthday");
    });
  });
  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.dataset.answer, "dating");
    });
  });
  const form = document.querySelector("[data-response-form]");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitResponse(form.dataset.response, form);
    });
  }
  const success = document.querySelector(".response-success");
  if (success && localStorage.getItem("response-submitted") === page) {
    document.querySelector("[data-response-form]")?.classList.add("is-hidden");
    success.classList.remove("is-hidden");
  }
  const date = document.querySelector("[data-response-date]");
  if (date) {
    date.textContent = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
    }).format(new Date(localStorage.getItem("response-date") || Date.now()));
  }
}
init();
