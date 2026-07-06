(function () {
  const data = window.LectureTCIData;
  const state = {
    view: "instructor",
    sessionStatus: "준비",
    selectedSetId: data.testSets[0].id,
    questionIndex: 0,
    answers: {},
    studentId: "",
  };

  const views = Array.from(document.querySelectorAll(".view"));
  const navButtons = Array.from(document.querySelectorAll(".nav-button"));
  const setSelect = document.getElementById("test-set-select");
  const itemList = document.getElementById("item-list");
  const participantList = document.getElementById("participant-list");
  const participantCount = document.getElementById("participant-count");
  const completedCount = document.getElementById("completed-count");
  const sessionStatus = document.getElementById("session-status");
  const studentIdInput = document.getElementById("student-id");
  const questionText = document.getElementById("question-text");
  const questionProgress = document.getElementById("question-progress");
  const questionBar = document.getElementById("question-bar");
  const choiceGrid = document.getElementById("choice-grid");
  const prevQuestion = document.getElementById("prev-question");
  const nextQuestion = document.getElementById("next-question");

  function currentItems() {
    return data.items
      .filter((item) => item.setId === state.selectedSetId)
      .sort((a, b) => a.order - b.order);
  }

  function showView(viewId) {
    state.view = viewId;
    views.forEach((view) => view.classList.toggle("is-active", view.id === viewId));
    navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === viewId);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderTestSets() {
    setSelect.innerHTML = data.testSets
      .map((set) => `<option value="${set.id}">${set.name}</option>`)
      .join("");
    setSelect.value = state.selectedSetId;
  }

  function renderItems() {
    itemList.innerHTML = currentItems()
      .map(
        (item) => `
          <article class="item-row">
            <strong>${item.order}. ${item.text}</strong>
            <div class="tag-row">
              <span class="tag">${item.factor}</span>
              <span>반대 기준 ${item.reverseFactor}</span>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function statusLabel(status) {
    return {
      completed: "입력 완료",
      in_progress: "입력 중",
      not_started: "시작 전",
    }[status];
  }

  function renderParticipants() {
    participantCount.textContent = data.participants.length;
    completedCount.textContent = data.participants.filter((p) => p.status === "completed").length;
    participantList.innerHTML = data.participants
      .map(
        (participant) => `
          <article class="participant-row">
            <strong>${participant.id}</strong>
            <div class="tag-row">
              <span class="tag">${statusLabel(participant.status)}</span>
              <span>${participant.progress}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" style="width: ${participant.progress}%"></div>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderQuestion() {
    const items = currentItems();
    const item = items[state.questionIndex];
    const progress = ((state.questionIndex + 1) / items.length) * 100;
    questionText.textContent = item.text;
    questionProgress.textContent = `${state.questionIndex + 1} / ${items.length}`;
    questionBar.style.width = `${progress}%`;
    prevQuestion.disabled = state.questionIndex === 0;
    nextQuestion.textContent = state.questionIndex === items.length - 1 ? "제출" : "다음";

    const choices = [
      { value: 1, label: "전혀 아니다" },
      { value: 2, label: "아니다" },
      { value: 3, label: "보통이다" },
      { value: 4, label: "그렇다" },
      { value: 5, label: "매우 그렇다" },
    ];

    choiceGrid.innerHTML = choices
      .map(
        (choice) => `
          <button class="choice-button ${state.answers[item.id] === choice.value ? "is-selected" : ""}" data-answer="${choice.value}">
            ${choice.label}
          </button>
        `,
      )
      .join("");
  }

  function setSessionStatus(nextStatus) {
    state.sessionStatus = nextStatus;
    sessionStatus.textContent = nextStatus;
  }

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      showView(viewButton.dataset.view);
      return;
    }

    const sessionButton = event.target.closest("[data-session-action]");
    if (sessionButton) {
      const action = sessionButton.dataset.sessionAction;
      const labels = {
        start: "입력 진행 중",
        "close-score": "입력 종료 및 결과 취합 완료",
        share: "결과 공유 중",
        end: "체험 종료",
      };
      setSessionStatus(labels[action]);
      return;
    }

    const choiceButton = event.target.closest("[data-answer]");
    if (choiceButton) {
      const item = currentItems()[state.questionIndex];
      state.answers[item.id] = Number(choiceButton.dataset.answer);
      renderQuestion();
    }
  });

  document.getElementById("enter-test").addEventListener("click", () => {
    state.studentId = studentIdInput.value.trim() || "A102";
    state.questionIndex = 0;
    state.answers = {};
    renderQuestion();
    showView("student-test");
  });

  document.getElementById("copy-url").addEventListener("click", async () => {
    const url = "https://example.github.io/LectureTCI/?s=LT-4821";
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    setSessionStatus("참여 URL 복사됨");
  });

  setSelect.addEventListener("change", (event) => {
    state.selectedSetId = event.target.value;
    state.questionIndex = 0;
    renderItems();
  });

  prevQuestion.addEventListener("click", () => {
    state.questionIndex = Math.max(0, state.questionIndex - 1);
    renderQuestion();
  });

  nextQuestion.addEventListener("click", () => {
    const items = currentItems();
    if (state.questionIndex === items.length - 1) {
      showView("submitted");
      return;
    }
    state.questionIndex += 1;
    renderQuestion();
  });

  renderTestSets();
  renderItems();
  renderParticipants();
  setSessionStatus(state.sessionStatus);
})();
