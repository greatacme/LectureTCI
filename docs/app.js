(function () {
  const data = window.LectureTCIData;
  const page = document.body.dataset.page;
  const state = {
    sessionStatus: "준비",
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
      .sort((a, b) => a.order - b.order);
  }

  function showView(viewId) {
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("is-active", view.id === viewId);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderResult(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !data.resultCategories) {
      return;
    }

    container.innerHTML = data.resultCategories
      .map(
        (category) => `
          <article class="result-category">
            <header class="result-category-header">
              <div>
                <h3>${category.title}</h3>
                <p>${category.summary}</p>
              </div>
            </header>
            <div class="measure-list">
              ${category.measures
                .map(
                  (measure, measureIndex) => `
                    <section class="measure-row is-${measure.tone}">
                      <div class="measure-main">
                        <div class="measure-title">
                          <strong>${category.id}.${measureIndex + 1} ${measure.name}</strong>
                          <span>${measure.level}</span>
                        </div>
                        <div class="measure-bar" aria-label="${measure.name} ${measure.score}점">
                          <div style="width: ${measure.score}%"></div>
                        </div>
                      </div>
                      <b>${measure.score}</b>
                      <p>${measure.description}</p>
                    </section>
                  `,
                )
                .join("")}
            </div>
          </article>
        `,
      )
      .join("");
  }

  function initInstructor() {
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

    function renderParticipants() {
      participantCount.textContent = data.participants.length;
      completedCount.textContent = data.participants.filter((p) => p.status === "completed").length;
      participantList.innerHTML = data.participants
        .map((participant) => {
          const isCompleted = participant.status === "completed" || participant.progress === 100;
          if (isCompleted) {
            return `
              <button class="participant-row participant-result-button is-${participant.status}" data-participant-result="${participant.id}" type="button" aria-label="${participant.id} 결과 보기">
                <strong>${participant.id}</strong>
                <b>${participant.progress}%</b>
              </button>
            `;
          }
          return `
            <article class="participant-row is-${participant.status}">
              <strong>${participant.id}</strong>
              <b>${participant.progress}%</b>
            </article>
          `;
        })
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

    participantList.addEventListener("click", (event) => {
      const resultButton = event.target.closest("[data-participant-result]");
      if (!resultButton) {
        return;
      }
      const params = new URLSearchParams({
        s: state.sessionCode,
        participant: resultButton.dataset.participantResult,
      });
      window.location.href = `${absoluteUrl("result.html")}?${params.toString()}`;
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
    const backToTest = document.getElementById("back-to-test");
    const submitAnswer = document.getElementById("submit-answer");
    const submitConfirmTitle = document.getElementById("submit-confirm-title");
    const submitConfirmMessage = document.getElementById("submit-confirm-message");
    const submitActions = document.getElementById("submit-actions");
    const resultWait = document.getElementById("result-wait");
    const resultWaitMessage = document.getElementById("result-wait-message");
    const viewResult = document.getElementById("view-result");

    function resetSubmitConfirm() {
      submitConfirmTitle.textContent = "제출하시겠습니까?";
      submitConfirmMessage.textContent = "제출 후에는 응답을 수정할 수 없습니다. 이전 화면으로 돌아가 마지막으로 답변을 확인할 수 있습니다.";
      submitActions.classList.remove("is-hidden");
      resultWait.classList.add("is-hidden");
      resultWaitMessage.textContent = "강사의 채점이 끝나면 결과보기가 활성화됩니다.";
      viewResult.disabled = true;
    }

    function renderSubmittedWait() {
      submitConfirmTitle.textContent = "제출되었습니다";
      submitConfirmMessage.textContent = "응답이 정상적으로 저장되었습니다.";
      submitActions.classList.add("is-hidden");
      resultWait.classList.remove("is-hidden");
      resultWaitMessage.textContent = "강사의 채점이 끝나면 결과보기가 활성화됩니다.";
      viewResult.disabled = true;

      window.setTimeout(() => {
        resultWaitMessage.textContent = "결과보기가 활성화되었습니다.";
        viewResult.disabled = false;
      }, 1800);
    }

    function renderQuestion() {
      const items = currentItems();
      const item = items[state.questionIndex];
      const progress = ((state.questionIndex + 1) / items.length) * 100;
      questionText.textContent = item.text;
      questionProgress.textContent = `${state.questionIndex + 1} / ${items.length}`;
      questionBar.style.width = `${progress}%`;
      prevQuestion.disabled = state.questionIndex === 0;
      nextQuestion.textContent = "다음";

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
        resetSubmitConfirm();
        showView("submit-confirm");
        return;
      }
      state.questionIndex += 1;
      renderQuestion();
    });

    backToTest.addEventListener("click", () => {
      renderQuestion();
      showView("student-test");
    });

    submitAnswer.addEventListener("click", () => {
      renderSubmittedWait();
    });

    viewResult.addEventListener("click", () => {
      renderResult("student-result-list");
      showView("submitted");
    });
  }

  function initResult() {
    renderResult("result-list");
  }

  if (page === "instructor") {
    initInstructor();
  }

  if (page === "student") {
    initStudent();
  }

  if (page === "result") {
    initResult();
  }
})();
