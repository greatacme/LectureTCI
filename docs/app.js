(function () {
  const data = window.LectureTCIData;
  const page = document.body.dataset.page;
  const state = {
    sessionStatus: "준비",
    selectedSetId: data?.testSets?.[0]?.id,
    sessionCode: "LT-4821",
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

  function initInstructor() {
    const setSelect = document.getElementById("test-set-select");
    const itemList = document.getElementById("item-list");
    const participantList = document.getElementById("participant-list");
    const participantCount = document.getElementById("participant-count");
    const completedCount = document.getElementById("completed-count");
    const sessionStatus = document.getElementById("session-status");
    const lectureCode = document.getElementById("lecture-code");
    const showQr = document.getElementById("show-qr");
    const closeQr = document.getElementById("close-qr");
    const qrDialog = document.getElementById("qr-dialog");
    const qrImage = document.getElementById("qr-image");
    const qrCodeText = document.getElementById("qr-code-text");

    function renderCode() {
      lectureCode.textContent = state.sessionCode;
      qrCodeText.textContent = state.sessionCode;
    }

    function updateQrImage() {
      const studentUrl = absoluteUrl("student.html");
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(studentUrl)}`;
      qrImage.src = qrSrc;
    }

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
            <article class="participant-row is-${participant.status}">
              <strong>${participant.id}</strong>
              <b>${participant.progress}%</b>
            </article>
          `,
        )
        .join("");
    }

    function setSessionStatus(nextStatus) {
      state.sessionStatus = nextStatus;
      sessionStatus.textContent = nextStatus;
    }

    function generateSessionCode() {
      const number = Math.floor(1000 + Math.random() * 9000);
      state.sessionCode = `LT-${number}`;
      renderCode();
    }

    document.addEventListener("click", (event) => {
      const sessionButton = event.target.closest("[data-session-action]");
      if (sessionButton) {
        const labels = {
          start: "입력 진행 중",
          "close-score": "입력 종료 및 결과 취합 완료",
          share: "결과 공유 중",
          end: "체험 종료",
        };
        if (sessionButton.dataset.sessionAction === "start") {
          generateSessionCode();
          showQr.disabled = false;
        }
        setSessionStatus(labels[sessionButton.dataset.sessionAction]);
      }
    });

    showQr.addEventListener("click", () => {
      updateQrImage();
      renderCode();
      qrDialog.showModal();
    });

    closeQr.addEventListener("click", () => {
      qrDialog.close();
    });

    qrDialog.addEventListener("click", (event) => {
      if (event.target === qrDialog) {
        qrDialog.close();
      }
    });

    setSelect.addEventListener("change", (event) => {
      state.selectedSetId = event.target.value;
      renderItems();
    });

    renderItems();
    renderParticipants();
    renderCode();
    setSessionStatus(state.sessionStatus);
  }

  function initStudent() {
    const sessionCodeInput = document.getElementById("session-code");
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
      state.sessionCode = sessionCodeInput.value.trim() || "LT-4821";
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
