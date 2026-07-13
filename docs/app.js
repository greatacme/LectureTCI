(function () {
  const data = window.LectureTCIData;
  const page = document.body.dataset.page;
  const apiBaseUrl = new URLSearchParams(window.location.search).get("api")
    || window.LectureTCIConfig?.apiBaseUrl
    || "https://lecturetci-api-323067825792.asia-northeast3.run.app";
  const instructorStorageKey = "LectureTCI.instructorSession.v1";
  const studentStorageKey = "LectureTCI.studentSession.v1";
  const state = {
    sessionStatus: "준비",
    sessionCode: "준비중",
    sessionId: "",
    questionIndex: 0,
    answers: {},
    studentId: "",
    isSubmitted: false,
    sessionBackendStatus: "",
    questions: [],
    pollTimer: null,
  };

  function absoluteUrl(path) {
    return new URL(path, window.location.href).href;
  }

  function apiUrl(path) {
    return `${apiBaseUrl.replace(/\/$/, "")}${path}`;
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(body?.message || "서버 요청을 처리하지 못했습니다.");
    }

    return body;
  }

  function toViewQuestion(question) {
    return {
      id: question.id,
      order: question.questionNo,
      measureId: question.measureId,
      text: question.questionText,
      scaleMin: question.scaleMin,
      scaleMax: question.scaleMax,
    };
  }

  function currentItems() {
    const items = state.questions.length ? state.questions : data.items;
    return [...items].sort((a, b) => a.order - b.order);
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
    const sessionResultList = document.getElementById("session-result-list");
    const sessionResultStatus = document.getElementById("session-result-status");
    const sessionRecovery = document.getElementById("session-recovery");
    const sessionRecoveryList = document.getElementById("session-recovery-list");
    const participantCount = document.getElementById("participant-count");
    const completedCount = document.getElementById("completed-count");
    const dashboardProgressGauge = document.getElementById("dashboard-progress-gauge");
    const dashboardProgressPercent = document.getElementById("dashboard-progress-percent");
    const dashboardGaugeTicks = document.querySelector("#dashboard-progress-gauge .gauge-ticks");
    const sessionStatus = document.getElementById("session-status");
    const lectureCode = document.getElementById("lecture-code");
    const showQr = document.getElementById("show-qr");
    const closeQr = document.getElementById("close-qr");
    const qrDialog = document.getElementById("qr-dialog");
    const qrImage = document.getElementById("qr-image");
    const qrCodeText = document.getElementById("qr-code-text");
    const qrUrlText = document.getElementById("qr-url-text");
    const sessionButtons = {
      start: document.querySelector('[data-session-action="start"]'),
      closeScore: document.querySelector('[data-session-action="close-score"]'),
      share: document.querySelector('[data-session-action="share"]'),
      end: document.querySelector('[data-session-action="end"]'),
    };

    function renderCode() {
      lectureCode.textContent = state.sessionCode;
      qrCodeText.textContent = state.sessionCode;
    }

    function participantUrl() {
      const studentUrl = new URL("student.html", window.location.href);
      studentUrl.searchParams.set("api", apiBaseUrl);
      if (state.sessionCode && state.sessionCode !== "준비중") {
        studentUrl.searchParams.set("s", state.sessionCode);
      }
      return studentUrl.href;
    }

    function updateQrImage() {
      const studentUrl = participantUrl();
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(studentUrl)}`;
      qrImage.src = qrSrc;
      qrUrlText.textContent = studentUrl;
    }

    function toParticipantCard(participant) {
      const progress = participant.progressPercent ?? participant.progress ?? 0;
      const status = participant.status === "submitted"
        ? "completed"
        : progress > 0
          ? "in_progress"
          : "not_started";
      return {
        id: participant.id,
        name: participant.nickname || participant.id,
        status,
        progress,
      };
    }

    function renderParticipants(participants = []) {
      const cards = participants.map(toParticipantCard);
      const completedTotal = cards.filter((p) => p.status === "completed").length;
      const total = cards.length;
      const dashboardProgress = total ? Math.round((completedTotal / total) * 100) : 0;
      participantCount.textContent = cards.length;
      completedCount.textContent = completedTotal;
      dashboardProgressGauge.style.setProperty("--progress", `${dashboardProgress}%`);
      dashboardProgressPercent.textContent = `${dashboardProgress}%`;
      dashboardGaugeTicks.innerHTML = Array.from({ length: 21 }, (_, index) => {
        const value = index * 5;
        const angle = -115 + (index * 11.5);
        const isOn = dashboardProgress >= value && (dashboardProgress > 0 || value === 0);
        return `<span class="${isOn ? "is-on" : ""}" style="--tick-angle: ${angle}deg"></span>`;
      }).join("");
      participantList.innerHTML = cards
        .map((participant) => {
          const isCompleted = participant.status === "completed";
          if (isCompleted) {
            return `
              <button class="participant-row participant-result-button is-${participant.status}" data-participant-result="${participant.id}" type="button" aria-label="${participant.name} 결과 보기">
                <strong>${participant.name}</strong>
                <b>${participant.progress}%</b>
              </button>
            `;
          }
          return `
            <article class="participant-row is-${participant.status}">
              <strong>${participant.name}</strong>
              <b>${participant.progress}%</b>
            </article>
          `;
        })
        .join("");
    }

    function renderSessionResults(results = []) {
      if (!results.length) {
        sessionResultStatus.textContent = "결과 취합 전";
        sessionResultList.innerHTML = '<p class="empty-message">입력 종료 후 척도별 점수가 표시됩니다.</p>';
        return;
      }

      sessionResultStatus.textContent = `${results.length}개 척도`;
      const chartHtml = renderSessionResultChart(results);
      const cardsHtml = results
        .map((result) => {
          const score = Math.round(result.score100 ?? 0);
          const avg = Number(result.scoreAvg ?? 0).toFixed(2);
          const levelCode = result.levelCode || "green";
          const levelLabel = result.levelLabel || levelCode;
          const measureName = escapeHtml(result.measureName || result.measureId);
          const categoryName = escapeHtml(result.categoryName || "");
          return `
            <article class="session-result-row is-${levelCode}">
              <div class="session-result-title">
                <strong>${measureName}</strong>
                <span>${categoryName}</span>
              </div>
              <div class="session-result-score">
                <strong>${score}</strong>
                <small>평균 ${avg} · ${levelLabel}</small>
              </div>
              <div class="session-result-bar" aria-label="${measureName} ${score}점">
                <div style="width: ${score}%"></div>
              </div>
            </article>
          `;
        })
        .join("");

      sessionResultList.innerHTML = `
        ${chartHtml}
        <div class="session-result-cards">
          ${cardsHtml}
        </div>
      `;
    }

    function renderSessionResultChart(results = []) {
      const safeResults = results.map((result) => ({
        ...result,
        score: Math.max(0, Math.min(100, Math.round(result.score100 ?? 0))),
        levelCode: result.levelCode || "green",
        measureName: result.measureName || result.measureId,
        categoryName: result.categoryName || "",
      }));
      const categories = [];

      safeResults.forEach((result) => {
        const lastCategory = categories[categories.length - 1];
        if (lastCategory && lastCategory.name === result.categoryName) {
          lastCategory.count += 1;
          return;
        }
        categories.push({ name: result.categoryName, count: 1 });
      });

      const categoryHtml = categories
        .map(
          (category) => `
            <span style="grid-column: span ${category.count}">
              ${escapeHtml(category.name)}
            </span>
          `,
        )
        .join("");

      const barHtml = safeResults
        .map(
          (result) => `
            <div class="session-profile-bar is-${result.levelCode}">
              <span class="session-profile-value">${result.score}</span>
              <div class="session-profile-track">
                <i style="height: ${result.score}%"></i>
              </div>
              <b title="${escapeHtml(result.measureName)}">${escapeHtml(result.measureName)}</b>
            </div>
          `,
        )
        .join("");

      return `
        <div class="session-profile-chart">
          <div class="session-profile-title">검사 프로파일</div>
          <div class="session-profile-categories" style="grid-template-columns: repeat(${safeResults.length}, minmax(30px, 1fr))">
            ${categoryHtml}
          </div>
          <div class="session-profile-plot">
            <div class="session-profile-axis" aria-hidden="true">
              <span>100</span>
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>
            <div class="session-profile-grid" aria-hidden="true"></div>
            <div class="session-profile-bars" style="grid-template-columns: repeat(${safeResults.length}, minmax(30px, 1fr))">
              ${barHtml}
            </div>
          </div>
        </div>
      `;
    }

    function setSessionStatus(nextStatus) {
      state.sessionStatus = nextStatus;
      sessionStatus.textContent = nextStatus;
    }

    function saveInstructorState(extra = {}) {
      if (!state.sessionCode || state.sessionCode === "준비중") {
        return;
      }

      const payload = {
        sessionId: state.sessionId,
        sessionCode: state.sessionCode,
        sessionStatus: state.sessionStatus,
        updatedAt: new Date().toISOString(),
        ...extra,
      };

      try {
        window.localStorage.setItem(instructorStorageKey, JSON.stringify(payload));
      } catch (error) {
        console.warn(error);
      }
    }

    function loadInstructorState() {
      try {
        const stored = window.localStorage.getItem(instructorStorageKey);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn(error);
        return null;
      }
    }

    function clearInstructorState() {
      try {
        window.localStorage.removeItem(instructorStorageKey);
      } catch (error) {
        console.warn(error);
      }
    }

    function setActionState(mode) {
      const isReady = mode === "ready";
      const isRunning = mode === "running";
      const isScored = mode === "scored";

      sessionButtons.start.disabled = !isReady;
      sessionButtons.closeScore.disabled = !isRunning;
      sessionButtons.share.disabled = !isScored;
      sessionButtons.end.disabled = isReady;
    }

    function resetSessionUi(nextStatus = "준비") {
      window.clearInterval(state.pollTimer);
      state.sessionCode = "준비중";
      state.sessionId = "";
      renderCode();
      renderParticipants([]);
      renderSessionResults([]);
      showQr.disabled = true;
      setActionState("ready");
      setSessionStatus(nextStatus);
      clearInstructorState();
    }

    function sessionStatusLabel(status) {
      if (status === "active") {
        return "입력 진행 중";
      }
      if (status === "closed") {
        return "입력 종료";
      }
      if (status === "published") {
        return "결과 공유 중";
      }
      return status || "상태 미확인";
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderOpenSessions(sessions = []) {
      if (!sessions.length) {
        sessionRecovery.classList.add("is-hidden");
        sessionRecoveryList.innerHTML = "";
        return;
      }

      sessionRecovery.classList.remove("is-hidden");
      sessionButtons.start.disabled = true;
      sessionRecoveryList.innerHTML = sessions
        .map((session) => {
          const participantCountValue = session.participantCount ?? 0;
          const submittedCountValue = session.submittedCount ?? 0;
          const title = escapeHtml(session.title || "LectureTCI 체험");
          return `
            <article class="session-recovery-item">
              <div class="session-recovery-meta">
                <strong>${session.sessionCode}</strong>
                <span>${sessionStatusLabel(session.status)}</span>
                <small>${title} · 참여자 ${participantCountValue}명 · 완료 ${submittedCountValue}명</small>
              </div>
              <div class="session-recovery-actions">
                <button class="primary-button" type="button" data-session-continue="${session.sessionCode}">이어가기</button>
                <button class="danger-button" type="button" data-session-cleanup="${session.sessionCode}">정리</button>
              </div>
            </article>
          `;
        })
        .join("");
    }

    async function loadOpenSessions() {
      try {
        const sessions = await apiFetch("/api/sessions/open");
        renderOpenSessions(sessions);
        if (!sessions.length && state.sessionCode === "준비중") {
          setActionState("ready");
        }
        return sessions;
      } catch (error) {
        console.warn(error);
        renderOpenSessions([]);
        return [];
      }
    }

    function applySession(session) {
      state.sessionId = session.id;
      state.sessionCode = session.sessionCode;
      renderCode();
      showQr.disabled = false;

      if (session.status === "active") {
        setSessionStatus("입력 진행 중");
        setActionState("running");
        startPolling();
        saveInstructorState({ backendStatus: session.status });
        return;
      }

      if (session.status === "closed") {
        setSessionStatus("입력 종료 및 결과 취합 완료");
        setActionState("scored");
        startPolling();
        loadSessionResults();
        saveInstructorState({ backendStatus: session.status });
        return;
      }

      if (session.status === "published") {
        setSessionStatus("결과 공유 중");
        setActionState("scored");
        startPolling();
        loadSessionResults();
        saveInstructorState({ backendStatus: session.status });
        return;
      }

      resetSessionUi("준비");
    }

    async function refreshParticipants() {
      if (!state.sessionCode || state.sessionCode === "준비중") {
        renderParticipants([]);
        return;
      }

      const participants = await apiFetch(`/api/sessions/${encodeURIComponent(state.sessionCode)}/participants`);
      renderParticipants(participants);
    }

    async function loadSessionResults() {
      if (!state.sessionCode || state.sessionCode === "준비중") {
        renderSessionResults([]);
        return;
      }

      try {
        const results = await apiFetch(`/api/sessions/${encodeURIComponent(state.sessionCode)}/measure-results`);
        renderSessionResults(results);
      } catch (error) {
        console.warn(error);
        sessionResultStatus.textContent = "조회 실패";
      }
    }

    function startPolling() {
      window.clearInterval(state.pollTimer);
      refreshParticipants().catch((error) => {
        console.warn(error);
      });
      state.pollTimer = window.setInterval(() => {
        refreshParticipants().catch((error) => {
          console.warn(error);
        });
      }, 2000);
    }

    async function restoreInstructorState() {
      const stored = loadInstructorState();
      if (!stored?.sessionCode) {
        return;
      }

      try {
        const session = await apiFetch(`/api/sessions/${encodeURIComponent(stored.sessionCode)}`);
        applySession(session);
      } catch (error) {
        console.warn(error);
        clearInstructorState();
      }
    }

    async function initializeInstructorSessions() {
      const sessions = await loadOpenSessions();
      if (sessions.length) {
        return;
      }
      await restoreInstructorState();
    }

    sessionRecoveryList.addEventListener("click", async (event) => {
      const continueButton = event.target.closest("[data-session-continue]");
      const cleanupButton = event.target.closest("[data-session-cleanup]");
      const targetButton = continueButton || cleanupButton;
      if (!targetButton) {
        return;
      }

      targetButton.disabled = true;

      if (continueButton) {
        try {
          const sessionCode = continueButton.dataset.sessionContinue;
          const session = await apiFetch(`/api/sessions/${encodeURIComponent(sessionCode)}`);
          applySession(session);
          sessionRecovery.classList.add("is-hidden");
        } catch (error) {
          window.alert(error.message);
          targetButton.disabled = false;
        }
        return;
      }

      try {
        const sessionCode = cleanupButton.dataset.sessionCleanup;
        await apiFetch(`/api/sessions/${encodeURIComponent(sessionCode)}/end`, {
          method: "POST",
        });
        if (state.sessionCode === sessionCode) {
          resetSessionUi("체험 종료");
        }
        const sessions = await loadOpenSessions();
        if (!sessions.length && state.sessionCode === "준비중") {
          setActionState("ready");
        }
      } catch (error) {
        window.alert(error.message);
        targetButton.disabled = false;
      }
    });

    document.addEventListener("click", async (event) => {
      const sessionButton = event.target.closest("[data-session-action]");
      if (!sessionButton) {
        return;
      }

      const labels = {
        start: "입력 진행 중",
        "close-score": "입력 종료 및 결과 취합 완료",
        share: "결과 공유 중",
        end: "체험 종료",
      };

      if (sessionButton.dataset.sessionAction === "start") {
        sessionButton.disabled = true;
        try {
          const session = await apiFetch("/api/sessions", {
            method: "POST",
            body: JSON.stringify({
              title: "LectureTCI 체험",
              expectedParticipantCount: 20,
            }),
          });
          state.sessionId = session.id;
          state.sessionCode = session.sessionCode;
          renderCode();
          showQr.disabled = false;
          setSessionStatus(labels.start);
          setActionState("running");
          saveInstructorState({ backendStatus: session.status });
          startPolling();
        } catch (error) {
          window.alert(error.message);
        }
        return;
      }

      if (sessionButton.dataset.sessionAction === "close-score") {
        sessionButton.disabled = true;
        try {
          const session = await apiFetch(`/api/sessions/${encodeURIComponent(state.sessionCode)}/close`, {
            method: "POST",
          });
          setActionState("scored");
          setSessionStatus(labels[sessionButton.dataset.sessionAction]);
          loadSessionResults();
          saveInstructorState({ backendStatus: session.status });
        } catch (error) {
          window.alert(error.message);
          setActionState("running");
        }
        return;
      }

      if (sessionButton.dataset.sessionAction === "share") {
        sessionButton.disabled = true;
        try {
          const session = await apiFetch(`/api/sessions/${encodeURIComponent(state.sessionCode)}/publish`, {
            method: "POST",
          });
          setActionState("scored");
          setSessionStatus(labels[sessionButton.dataset.sessionAction]);
          saveInstructorState({ backendStatus: session.status });
        } catch (error) {
          window.alert(error.message);
        } finally {
          sessionButton.disabled = false;
        }
        return;
      }

      if (sessionButton.dataset.sessionAction === "end") {
        sessionButton.disabled = true;
        try {
          await apiFetch(`/api/sessions/${encodeURIComponent(state.sessionCode)}/end`, {
            method: "POST",
          });
          window.clearInterval(state.pollTimer);
          state.sessionCode = "준비중";
          state.sessionId = "";
          renderCode();
          renderParticipants([]);
          renderSessionResults([]);
          setActionState("ready");
          showQr.disabled = true;
          setSessionStatus(labels[sessionButton.dataset.sessionAction]);
          clearInstructorState();
          loadOpenSessions().catch((error) => {
            console.warn(error);
          });
        } catch (error) {
          window.alert(error.message);
          sessionButton.disabled = false;
        }
        return;
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

    renderParticipants([]);
    renderSessionResults([]);
    renderCode();
    setSessionStatus(state.sessionStatus);
    setActionState("ready");
    initializeInstructorSessions();
  }

  function initStudent() {
    const requestedSessionCode = new URLSearchParams(window.location.search).get("s") || "";
    const sessionCodeInput = document.getElementById("session-code");
    const studentIdInput = document.getElementById("student-id");
    const nicknamePlaceholder = "예: 쟤시켜알바";
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
    const resultSummaryName = document.querySelector(".result-summary strong");

    studentIdInput.addEventListener("focus", () => {
      studentIdInput.placeholder = "";
    });

    studentIdInput.addEventListener("blur", () => {
      if (!studentIdInput.value.trim()) {
        studentIdInput.placeholder = nicknamePlaceholder;
      }
    });

    function saveStudentState(extra = {}) {
      if (!state.studentId || !state.sessionCode || state.sessionCode === "준비중") {
        return;
      }

      const payload = {
        participantId: state.studentId,
        sessionCode: state.sessionCode,
        nickname: studentIdInput.value.trim() || resultSummaryName.textContent,
        isSubmitted: state.isSubmitted,
        questionIndex: state.questionIndex,
        answers: state.answers,
        updatedAt: new Date().toISOString(),
        ...extra,
      };

      try {
        window.localStorage.setItem(studentStorageKey, JSON.stringify(payload));
      } catch (error) {
        console.warn(error);
      }
    }

    function loadStudentState() {
      try {
        const stored = window.localStorage.getItem(studentStorageKey);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn(error);
        return null;
      }
    }

    function clearStudentState() {
      try {
        window.localStorage.removeItem(studentStorageKey);
      } catch (error) {
        console.warn(error);
      }
    }

    function applyStudentSessionState() {
      const isActive = state.sessionBackendStatus === "active";
      const isPublished = state.sessionBackendStatus === "published";

      if (!state.isSubmitted) {
        submitAnswer.disabled = !isActive;
        if (!isActive && state.sessionBackendStatus) {
          submitConfirmMessage.textContent = "입력이 종료되어 더 이상 제출할 수 없습니다.";
        }
      }

      viewResult.disabled = !(state.isSubmitted && isPublished);
      if (state.isSubmitted && isPublished) {
        resultWaitMessage.textContent = "결과보기가 활성화되었습니다.";
      } else if (isPublished) {
        resultWaitMessage.textContent = "제출을 완료한 참여자만 결과보기를 사용할 수 있습니다.";
      } else {
        resultWaitMessage.textContent = "강사의 채점이 끝나면 결과보기가 활성화됩니다.";
      }
    }

    async function refreshSessionStatus() {
      if (!state.sessionCode || state.sessionCode === "준비중") {
        return;
      }

      const session = await apiFetch(`/api/sessions/${encodeURIComponent(state.sessionCode)}`);
      state.sessionBackendStatus = session.status;
      applyStudentSessionState();
    }

    function startStudentPolling() {
      window.clearInterval(state.pollTimer);
      refreshSessionStatus().catch((error) => {
        console.warn(error);
      });
      state.pollTimer = window.setInterval(() => {
        refreshSessionStatus().catch((error) => {
          console.warn(error);
        });
      }, 2000);
    }

    async function restoreStudentState() {
      if (requestedSessionCode) {
        sessionCodeInput.value = requestedSessionCode;
      }

      const stored = loadStudentState();
      if (!stored?.participantId || !stored?.sessionCode) {
        return;
      }

      if (requestedSessionCode && stored.sessionCode !== requestedSessionCode) {
        clearStudentState();
        return;
      }

      let session;
      try {
        session = await apiFetch(`/api/sessions/${encodeURIComponent(stored.sessionCode)}`);
      } catch (error) {
        console.warn(error);
        clearStudentState();
        return;
      }

      if (session.status === "completed") {
        clearStudentState();
        return;
      }

      const questions = await apiFetch("/api/questions");
      state.sessionCode = stored.sessionCode;
      state.studentId = stored.participantId;
      state.isSubmitted = Boolean(stored.isSubmitted);
      state.sessionBackendStatus = session.status;
      state.answers = stored.answers || {};
      state.questions = questions.map(toViewQuestion);
      state.questionIndex = Math.min(
        Number(stored.questionIndex || 0),
        Math.max(state.questions.length - 1, 0),
      );

      sessionCodeInput.value = stored.sessionCode;
      studentIdInput.value = stored.nickname || "";
      resultSummaryName.textContent = stored.nickname || "참여자";
      startStudentPolling();

      if (state.isSubmitted) {
        renderSubmittedWait();
        showView("submit-confirm");
        return;
      }

      renderQuestion();
      showView("student-test");
    }

    function resetSubmitConfirm() {
      submitConfirmTitle.textContent = "제출하시겠습니까?";
      submitConfirmMessage.textContent = "제출 후에는 응답을 수정할 수 없습니다. 이전 화면으로 돌아가 마지막으로 답변을 확인할 수 있습니다.";
      submitActions.classList.remove("is-hidden");
      resultWait.classList.add("is-hidden");
      resultWaitMessage.textContent = "강사의 채점이 끝나면 결과보기가 활성화됩니다.";
      viewResult.disabled = true;
      applyStudentSessionState();
    }

    function renderSubmittedWait() {
      submitConfirmTitle.textContent = "제출되었습니다";
      submitConfirmMessage.textContent = "응답이 정상적으로 저장되었습니다.";
      submitActions.classList.add("is-hidden");
      resultWait.classList.remove("is-hidden");
      resultWaitMessage.textContent = "강사의 채점이 끝나면 결과보기가 활성화됩니다.";
      viewResult.disabled = true;
      applyStudentSessionState();
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

    async function saveAnswers() {
      const answers = Object.entries(state.answers).map(([questionId, answerValue]) => ({
        questionId,
        answerValue,
      }));

      if (!answers.length) {
        return;
      }

      await apiFetch(`/api/participants/${state.studentId}/responses`, {
        method: "PUT",
        body: JSON.stringify({ answers }),
      });
    }

    document.getElementById("enter-test").addEventListener("click", async () => {
      const enterButton = document.getElementById("enter-test");
      const sessionCode = sessionCodeInput.value.trim();
      const nickname = studentIdInput.value.trim();

      if (!sessionCode || !nickname) {
        window.alert("강의 코드와 닉네임을 입력해 주세요.");
        return;
      }

      if (!/^[가-힣A-Za-z0-9_-]{2,10}$/.test(nickname)) {
        window.alert("닉네임은 한글, 영문, 숫자, -, _ 조합 2~10자로 입력해 주세요.");
        return;
      }

      enterButton.disabled = true;
      try {
        const participant = await apiFetch("/api/participants/join", {
          method: "POST",
          body: JSON.stringify({ sessionCode, nickname }),
        });
        const questions = await apiFetch("/api/questions");

        state.sessionCode = participant.sessionCode || sessionCode;
        state.studentId = participant.id;
        state.isSubmitted = participant.status === "submitted";
        state.sessionBackendStatus = "active";
        state.questionIndex = 0;
        state.answers = {};
        state.questions = questions.map(toViewQuestion);
        resultSummaryName.textContent = participant.nickname;
        saveStudentState({ nickname: participant.nickname });
        renderQuestion();
        startStudentPolling();
        showView("student-test");
      } catch (error) {
        window.alert(error.message);
      } finally {
        enterButton.disabled = false;
      }
    });

    document.addEventListener("click", (event) => {
      const choiceButton = event.target.closest("[data-answer]");
      if (choiceButton) {
        const item = currentItems()[state.questionIndex];
        state.answers[item.id] = Number(choiceButton.dataset.answer);
        saveStudentState();
        renderQuestion();
      }
    });

    prevQuestion.addEventListener("click", () => {
      state.questionIndex = Math.max(0, state.questionIndex - 1);
      renderQuestion();
    });

    nextQuestion.addEventListener("click", async () => {
      const items = currentItems();
      const item = items[state.questionIndex];
      if (!state.answers[item.id]) {
        window.alert("답변을 선택해 주세요.");
        return;
      }

      nextQuestion.disabled = true;
      try {
        await saveAnswers();
        saveStudentState();
        if (state.questionIndex === items.length - 1) {
          resetSubmitConfirm();
          showView("submit-confirm");
          refreshSessionStatus().catch((error) => {
            console.warn(error);
          });
          return;
        }
        state.questionIndex += 1;
        saveStudentState();
        renderQuestion();
      } catch (error) {
        window.alert(error.message);
      } finally {
        nextQuestion.disabled = false;
      }
    });

    backToTest.addEventListener("click", () => {
      renderQuestion();
      showView("student-test");
    });

    submitAnswer.addEventListener("click", async () => {
      submitAnswer.disabled = true;
      try {
        await saveAnswers();
        await apiFetch(`/api/participants/${state.studentId}/submit`, {
          method: "POST",
        });
        state.isSubmitted = true;
        saveStudentState({ isSubmitted: true });
        renderSubmittedWait();
        refreshSessionStatus().catch((error) => {
          console.warn(error);
        });
      } catch (error) {
        window.alert(error.message);
      } finally {
        applyStudentSessionState();
      }
    });

    viewResult.addEventListener("click", () => {
      renderResult("student-result-list");
      showView("submitted");
    });

    restoreStudentState().catch((error) => {
      console.warn(error);
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
