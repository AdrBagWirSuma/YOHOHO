const DEFAULT = {
  birthdayName: "Sharlaine",
  senderName: "someone who loves you",
  mainPhoto: "Assets/images/photo0.jpg",
  birthdayMusic: "Assets/music/lagu-hbd.mp3",
};
const page = document.body.dataset.page;
const config = { ...DEFAULT };
const AUDIO_FALLBACKS = {
  birthday: "Assets/music/lagu-hbd.mp3",
  dating: "Assets/music/lagu-hbd.mp3",
};

function resolveAsset(path) {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  const cleanPath = path.replace(/^\.\//, "").replace(/^(\.\.\/)+/, "");
  return page === "home" ? cleanPath : `../${cleanPath}`;
}

function loadConfig() {
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
  audio.loop = true;
  return audio;
}

function playMusic(mode) {
  const audio = createAudio(mode);
  const configuredPath = config.birthdayMusic;
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

function init() {
  loadConfig();
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
  if (["short-letter", "memories", "heart-letter", "closing"].includes(page)) {
    playMusic("birthday");
  }
  if (page === "memories") startSlideshow();
  if (page !== "home") {
    const retryMode = "birthday";
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
}
init();
