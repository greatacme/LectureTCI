(function () {
  const data = window.LectureTCIData;
  const page = document.body.dataset.page;
  const state = {
    sessionStatus: "준비",
    selectedSetId: data?.testSets?.[0]?.id,
    questionIndex: 0,
    answers: {},
    studentId: "",
  };

  function absoluteUrl(path) {
    return new URL(path, window.location.href).href;
  }

  function currentItems() {
    return data.items
      .filter((item) => item.setId === state.selectedSetId)
      .sort((a, b) => a.order - b.order);
  }

  function showView(viewId) {
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("is-active", view.id === viewId);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function statusLabel(status) {
    return {
      completed: "입력 완료",
      in_progress: "입력 중",
      not_started: "시작 전",
    }[status];
  }

  function initInstructor() {
    const setSelect = document.getElementById("test-set-select");
    const itemList = document.getElementById("item-list");
    const participantList = document.getElementById("participant-list");
    const participantCount = document.getElementById("participant-count");
    const completedCount = document.getElementById("completed-count");
    const sessionStatus = document.getElementById("session-status");
    const studentUrl = document.getElementById("student-url");
    const resultUrl = document.getElementById("result-url");

    studentUrl.textContent = absoluteUrl("student.html?s=LT-4821");
    resultUrl.textContent = absoluteUrl("result.html?s=LT-4821");

    setSelect.innerHTML = data.testSets
      .map((set) => `<option value="${set.id}">${set.name}</option>`)
      .join("");
    setSelect.value = state.selectedSetId;

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

    function setSessionStatus(nextStatus) {
      state.sessionStatus = nextStatus;
      sessionStatus.textContent = nextStatus;
    }

    document.addEventListener("click", async (event) => {
      const sessionButton = event.target.closest("[data-session-action]");
      if (sessionButton) {
        const labels = {
          start: "입력 진행 중",
          "close-score": "입력 종료 및 결과 취합 완료",
          share: "결과 공유 중",
          end: "체험 종료",
        };
        setSessionStatus(labels[sessionButton.dataset.sessionAction]);
        return;
      }

      const copyButton = event.target.closest("[data-copy-target]");
      if (copyButton) {
        const target = document.getElementById(copyButton.dataset.copyTarget);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(target.textContent);
        }
        setSessionStatus("URL 복사됨");
      }
    });

    setSelect.addEventListener("change", (event) => {
      state.selectedSetId = event.target.value;
      renderItems();
    });

    renderItems();
    renderParticipants();
    setSessionStatus(state.sessionStatus);
  }

  function initStudent() {
    const studentIdInput = document.getElementById("student-id");
    const questionText = document.getElementById("question-text");
    const questionProgress = document.getElementById("question-progress");
    const questionBar = document.getElementById("question-bar");
    const choiceGrid = document.getElementById("choice-grid");
    const prevQuestion = document.getElementById("prev-question");
    const nextQuestion = document.getElementById("next-question");

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

    document.getElementById("enter-test").addEventListener("click", () => {
      state.studentId = studentIdInput.value.trim() || "A102";
      state.questionIndex = 0;
      state.answers = {};
      renderQuestion();
      showView("student-test");
    });

    document.addEventListener("click", (event) => {
      const choiceButton = event.target.closest("[data-answer]");
      if (choiceButton) {
        const item = currentItems()[state.questionIndex];
        state.answers[item.id] = Number(choiceButton.dataset.answer);
        renderQuestion();
      }
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
  }

  if (page === "instructor") {
    initInstructor();
  }

  if (page === "student") {
    initStudent();
  }
})();
