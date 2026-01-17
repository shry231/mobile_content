// script.js
// Controls progress bar, responds to first user scroll to start,
// provides slow continuous progress with pauses (no extra text),
// reveals posts naturally via user scroll, and runs final syncing/check overlay when posts end.

document.addEventListener('DOMContentLoaded', () => {
  // --- Stage 2 Shift Sequence ---
  const shiftImgs = [
    'features/1stage2.png',
    'features/1bstage2.png',
    'features/2stage2.png',
    'features/2bstage2.png',
    'features/3stage2.png',
    'features/3bstage2.png',
    'features/4stage2.png',
    'features/4bstage2.png',
    'features/5stage2.png',
    'features/5bstage2.png'
  ];
  const syncingImgs = [
    'features/syncing0.png',
    'features/syncing1.png',
    'features/syncing2.png',
    'features/syncing3.png',
    'features/check.png'
  ];
  const shiftImgEl = document.getElementById('shiftImg');
  const nextShiftImgEl = document.getElementById('nextShiftImg');
  const heartOverlay = document.getElementById('heartOverlay');
  let shiftIndex = 0;
  if (shiftImgEl && heartOverlay && nextShiftImgEl) {
    heartOverlay.innerHTML = `<svg viewBox="0 0 100 100"><path d="M50 82s-32-22.7-32-42.7C18 24.6 32.6 18 41.7 27.1L50 35.4l8.3-8.3C67.4 18 82 24.6 82 39.3 82 59.3 50 82 50 82z" fill="#ff91e4"/></svg>`;
    const doubleTapHint = document.getElementById('doubleTapHint');
    const hintText = doubleTapHint ? doubleTapHint.querySelector('.hint-text') : null;
    let lastClick = 0;
    let clickCount = 0;
    // Show double-tap hint on first image: blink twice then remain visible until user interacts
    if (doubleTapHint && hintText) {
      // Show the double-tap hint and keep it visible until the user taps.
      doubleTapHint.classList.add('visible');
    }

    shiftImgEl.addEventListener('click', async () => {
      const now = Date.now();
      lastClick = now;
      if (shiftIndex >= shiftImgs.length - 1) return;
      // Only allow double click on these indices: 0, 2, 4, 6, 8
      if ([0, 2, 4, 6, 8].includes(shiftIndex)) {
        // Show heart instantly
        heartOverlay.classList.add('show');
        // hide double-tap hint once user starts interacting
        if (doubleTapHint) doubleTapHint.classList.remove('visible');
        await wait(350);
        heartOverlay.classList.remove('show');
        // Prevent any further auto-fade or src update after 5bstage2.png
        if (shiftIndex < shiftImgs.length - 1) {
          shiftIndex++;
          // nudge progress on each stage2 interaction so the bar keeps up with clicks
          try { applyClickNudge(1, 'shift'); } catch (e) { /* ignore */ }
          shiftImgEl.src = shiftImgs[shiftIndex];
          // Hide and clear nextShiftImgEl to prevent flicker
          nextShiftImgEl.style.opacity = 0;
          nextShiftImgEl.style.display = 'none';
          nextShiftImgEl.src = '';
          nextShiftImgEl.style.zIndex = 10;
          // Now handle specific auto-fade transitions
          if (shiftIndex === 1) { // 1bstage2.png → 2stage2.png
            await wait(900);
            shiftIndex = 2;
            shiftImgEl.src = shiftImgs[shiftIndex];
          } else if (shiftIndex === 3) { // 2bstage2.png → 3stage2.png
            await wait(900);
            shiftIndex = 4;
            shiftImgEl.src = shiftImgs[shiftIndex];
          } else if (shiftIndex === 5) { // 3bstage2.png → 4stage2.png
            await wait(900);
            shiftIndex = 6;
            shiftImgEl.src = shiftImgs[shiftIndex];
          } else if (shiftIndex === 7) { // 4bstage2.png → 5stage2.png
            await wait(900);
            shiftIndex = 8;
            shiftImgEl.src = shiftImgs[shiftIndex];
          }
        }
        if (shiftIndex === 9) { // 5bstage2.png triggers syncing
          // brief heart feedback then run the shared syncing overlay sequence
          heartOverlay.classList.add('show');
          await wait(1000);
          heartOverlay.classList.remove('show');
          // ensure final image remains visible
          shiftImgEl.src = 'features/5bstage2.png';
          shiftImgEl.style.display = 'block';
          await runFinalSequence('stage3');
        }
      }
    });
  }
  const fillEl = document.getElementById('progressFill');
  const scroller = document.getElementById('scroller');
  const contentEl = document.getElementById('content');
  const overlay = document.getElementById('fullscreenOverlay');
  const overlayImage = document.getElementById('overlayImage');
  const viewport = document.getElementById('viewport');
  const canvasEl = document.getElementById('canvas');
  const topbar = document.getElementById('topbar');
  // Ensure stage3 is hidden until the sequence reveals it
  const stage3El = document.getElementById('stage3Img');
  if (stage3El) stage3El.style.display = 'none';
  // Ensure stage4 is hidden until stage3's syncing reveals it
  const stage4El = document.getElementById('stage4Img');
  if (stage4El) stage4El.style.display = 'none';
  // Flag to note when stage3's syncing flow has completed
  let stage3SyncCompleted = false;
  const stage6El = document.getElementById('stage6Img');
  if (stage6El) stage6El.style.display = 'none';
  const stage7El = document.getElementById('stage7Img');
  if (stage7El) stage7El.style.display = 'none';
  const stage8El = document.getElementById('stage8Img');
  if (stage8El) stage8El.style.display = 'none';

  // Stage7 comments -> reveal stage8 flow
  const commentsImgs2 = [
    'features/comments8.png',
    'features/comments9.png',
    'features/comments10.png',
    'features/comments11.png',
    'features/comments12.png'
  ];
  if (stage7El) {
    stage7El.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (stage7SequenceCompleted) return;
      if (syncingRunning) return;

      // clicking into the stage7 comments should nudge progress
      try { applyClickNudge(1, 'stage7'); } catch (e) { /* ignore */ }

      overlay.classList.add('comments');
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      overlayImage.style.display = 'block';

      let commentsIndex = 0;
      overlayImage.src = commentsImgs2[commentsIndex];

      let commentsHint = document.getElementById('commentsHint');
      if (!commentsHint) {
        commentsHint = document.createElement('div');
        commentsHint.id = 'commentsHint';
        commentsHint.innerHTML = '<div class="hint-text">tap to see more</div>';
        document.body.appendChild(commentsHint);
      } else {
        const ht = commentsHint.querySelector('.hint-text');
        if (ht) ht.textContent = 'tap to see more';
      }
      commentsHint.classList.add('visible');
      const commentsHintText = commentsHint.querySelector('.hint-text');
      if (commentsHintText) {
        commentsHintText.classList.add('blink');
        commentsHintText.addEventListener('animationend', () => {
          commentsHintText.classList.remove('blink');
        }, { once: true });
      }

      const onOverlayClick2 = async (e) => {
        if (e.target === overlayImage) {
          if (commentsIndex < commentsImgs2.length - 1) {
            commentsIndex++;
            overlayImage.src = commentsImgs2[commentsIndex];
            const ch = document.getElementById('commentsHint');
            if (ch) ch.classList.remove('visible');
        try { applyClickNudge(0.75, 'comments2'); } catch (e) { /* ignore */ }
            return;
          }
          // last comment reached: remove spacing immediately, start syncing, then reveal stage8
          overlay.removeEventListener('click', onOverlayClick2);
          window.removeEventListener('keydown', onKeyDown2);
          // remove the spacing now so stage8 can appear closer as soon as sync finishes
          if (stage7El) stage7El.classList.remove('stage4-spaced');
          await runCommentsSync();
          const chAfter = document.getElementById('commentsHint');
          if (chAfter) chAfter.classList.remove('visible');
          overlay.classList.remove('comments');
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          overlayImage.style.display = 'none';
          overlayImage.src = '';
          // reveal stage8 (one-shot)
          if (stage8El) {
            // prepare heart targets for stage8
            HEART_TARGETS = HEART_TARGETS_STAGE8.slice();
            // clear any previous selections and state
            selectedFaces.clear();
            neofaceSyncHasRun = false;
            // reveal stage8 first, then shuffle the visible grid and attach handlers
            stage8El.style.display = 'block';
            // NOTE: do not hide the static bottom decoration on mobile — leave it
            // visible so users can see both the progress bar and the bottom art.
            // (Previously this hid the element; removing that behavior fixes
            // cases where the bottom disappears unexpectedly.)
            // Invalidate any cached measurement now that the real element is visible
            cachedStage8Bottom = null;
            // cancel any pre-stage estimate animation and samples — we'll switch to the normal auto-fill
            try { if (estimateAnim) { cancelAnimationFrame(estimateAnim); estimateAnim = null; } } catch (e) {}
            scrollSamples = [];
            // Do not force progress here; progress is fully controlled by scroll.
            // force reflow so CSS transitions work
            void stage8El.offsetWidth;
            stage8El.classList.add('visible');
            try { shuffleNeofaces(); } catch (e) { /* ignore */ }
            try { setupNeofaceInteractions(); attachDirectHandlers(); } catch (e) { /* ignore */ }
          }
          // mark that stage7's gap has been removed and should not be re-applied
          stage7GapRemoved = true;
          stage7SequenceCompleted = true;
          return;
        }
        // ignore background clicks
        return;
      };

      const onKeyDown2 = (ev2) => {
        if (ev2.key === 'Escape') {
          overlay.removeEventListener('click', onOverlayClick2);
          window.removeEventListener('keydown', onKeyDown2);
          const dblEsc = document.getElementById('doubleTapHint');
          const txtEsc = dblEsc ? dblEsc.querySelector('.hint-text') : null;
              if (dblEsc) dblEsc.classList.remove('visible');
              if (txtEsc && txtEsc.dataset && txtEsc.dataset._orig) txtEsc.textContent = txtEsc.dataset._orig;
          overlay.classList.remove('comments');
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          overlayImage.style.display = 'none';
          overlayImage.src = '';
        }
      };

      overlay.addEventListener('click', onOverlayClick2);
      window.addEventListener('keydown', onKeyDown2);
    });
  }

  // Configuration
  const DEFAULT_TOTAL_FILL_DURATION = 300000; // 5 minutes - steady auto-fill until stage8
  // Auto-fill duration can be adjusted dynamically (we'll slow it after stage2 finishes)
  let autoFillDuration = DEFAULT_TOTAL_FILL_DURATION;
  // Minimum user scroll ratio required before automatic fill is allowed to run
  const AUTO_ALLOW_SCROLL_PCT = 0.45; // 45% through logical content before auto-fill kicks in
  // Pause points (percent, milliseconds). Disabled to keep automatic progress moving.
  const pauses = [];

  // Scroller visual nudge factor (optional small movement to hint at progress)
  const maxScrollPx = 160; // small translate so posts are naturally revealed by user scroll; keep small to let user control
  const scrollFactor = 0.6;

  // State
  let progress = 0;
  let startTime = null;
  let paused = false;
  let pauseUntil = 0;
  let currentPauseIndex = 0;
  let progressStarted = false;
  let howToShown = false; // show the how-to panel once when progress first appears
  let finalSequenceStarted = false;
  let syncingRunning = false;
  let progressFinished = false; // when true, progress stops and stays at 100%
  // Progress is driven entirely by user scroll now (no constant auto-fill).
  // Track recent user interaction so automatic time-based progress doesn't fight user scroll
  let lastUserInteraction = 0; // timestamp (ms) of last scroll/wheel/touch
  const USER_INACTIVITY_TIMEOUT_MS = 5000; // how long to wait after user activity before auto-progress resumes
  // Scroll speed sampling for arrival time estimation
  const SCROLL_SAMPLE_COUNT = 6;
  const MIN_SCROLL_SPEED = 0.01; // px per ms (10 px/s)
  const MIN_ESTIMATE_MS = 500; // 0.5s - allow quicker estimate animations
  const ESTIMATE_SLOWDOWN = 1.6; // multiplier to make estimate animation feel gentler
  const MAX_ESTIMATE_MS = 1000 * 60 * 30; // 30 minutes
  const PRE_STAGE_MAX = 0.35; // allow up to 35% fill before stage8 is seen (faster, more natural)
  // Step size for progress updates from scroll. Each scroll event nudges the bar
  // by at most this amount toward the target ratio. Lower => smaller steps.
  // Default set small so progress moves in subtle ticks.
  const PROGRESS_STEP = 0.00025; // ~0.025% per scroll event
  // Amount to nudge the progress when the user clicks interactive elements.
  // Increased per request so clicks produce a larger visible effect.
  const CLICK_PROGRESS_BOOST = 0.03; // 3% per click (tunable)
  const DOUBLE_CLICK_MS = 400; // ms window to treat repeated clicks as a double-click
  const _lastClickMap = Object.create(null);

  // Apply a click nudge. `mult` scales the base boost. `key` is an optional
  // identifier used to deduplicate rapid repeated clicks (double-clicks) so a
  // double-tap counts as a single nudge for the same target.
  function applyClickNudge(mult = 1, key = 'global') {
    try {
      const now = performance.now();
      if (key) {
        const prev = _lastClickMap[key];
        if (prev && (now - prev) < DOUBLE_CLICK_MS) {
          // ignore double-clicks within the threshold for the same key
          return;
        }
        _lastClickMap[key] = now;
      }
      const amt = CLICK_PROGRESS_BOOST * Math.max(0, mult);
      progress = Math.min(1, progress + amt);
        if (fillEl) fillEl.style.transform = `scaleX(${progress})`;
      lastProgressChangeTime = now;
    } catch (e) { /* ignore */ }
  }
  let scrollSamples = []; // {t, pos}
  let estimateAnim = null;
  // durations used by the short comments syncing animation (ms)
  const COMMENTS_SYNC_FRAMES_TOTAL_MS = 2000;
  const COMMENTS_SYNC_CHECK_MS = 1500;
  let stage3ClickTriggered = false; // ensure stage3 click-trigger runs only once
  let stage4SequenceCompleted = false; // ensure comments flow runs only once fully
  let stage7SequenceCompleted = false;
  // Track per-stage spacing removal so gaps persist only until their own sync removes them
  let stage4GapRemoved = false;
  let stage7GapRemoved = false;
  // Cached measurement of where stage8 would sit when visible (bottom coordinate)
  let cachedStage8Bottom = null;
  // Debug overlay
  let debugOverlay = null;
  let debugEnabled = false;
  let useNativeScroll = false; // toggle to disable custom wheel/touch handlers
  // Watchdog to prevent progress from getting stuck
  let lastProgressChangeTime = null;
  const WATCHDOG_MS = 700; // ms of stagnation before nudging
  const WATCHDOG_STEP = 0.003; // small progress bump per watchdog
  function createDebugOverlay() {
    if (debugOverlay) return;
    debugOverlay = document.createElement('div');
    debugOverlay.id = 'progressDebug';
    debugOverlay.style.position = 'fixed';
    debugOverlay.style.right = '8px';
    debugOverlay.style.bottom = '8px';
    debugOverlay.style.zIndex = 99999;
    debugOverlay.style.background = 'rgba(0,0,0,0.6)';
    debugOverlay.style.color = '#fff';
    debugOverlay.style.padding = '8px 10px';
    debugOverlay.style.fontSize = '12px';
    debugOverlay.style.borderRadius = '8px';
    debugOverlay.style.maxWidth = '320px';
    debugOverlay.style.display = 'none';
    debugOverlay.style.pointerEvents = 'none';
    document.body.appendChild(debugOverlay);
  }
  function updateDebugOverlay() {
    if (!debugOverlay || !debugEnabled) return;
    const now = performance.now();
    const logicalMax = contentEl ? getLogicalMaxScroll() : 0;
    const sc = contentEl ? contentEl.scrollTop : 0;
    const ratioToStage8 = logicalMax > 0 ? (sc / logicalMax) : 0;
    const age = lastUserInteraction ? Math.round(now - lastUserInteraction) : -1;
    const info = [];
    info.push(`scrollTop: ${Math.round(sc)}`);
    info.push(`logicalMax: ${Math.round(logicalMax)}`);
    info.push(`ratioToStage8: ${ratioToStage8.toFixed(3)}`);
    info.push(`progress: ${progress.toFixed(3)}`);
    info.push(`paused: ${paused}`);
    info.push(`resistance: ${resistance}`);
    info.push(`lastInt(ms): ${age}`);
    info.push(`stage8Shown: ${stage8El && stage8El.style.display !== 'none'}`);
    info.push(`stage8InView: ${stage8El ? isStage8InView() : false}`);
    info.push(`cachedStage8Bottom: ${cachedStage8Bottom === null ? 'null' : Math.round(cachedStage8Bottom)}`);
    info.push(`estimateAnim: ${estimateAnim ? 'running' : 'none'}`);
    info.push(`useNativeScroll: ${useNativeScroll}`);
    debugOverlay.innerText = info.join('\n');
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function showTopbar() {
    if (!topbar) return;
    topbar.classList.remove('hidden');
    topbar.classList.add('visible');
  }

  // progress loop
  function step(ts) {
    if (!startTime) startTime = ts;

    // If the progress was just finished, keep the fill pinned and stop updates.
    // Progress itself is now driven directly by `onContentScroll()` which sets
    // `progress` based on scroll position; the RAF loop only updates visuals.
    if (progressFinished) {
      if (fillEl) fillEl.style.transform = 'scaleX(1)';
      return;
    }
    // Ensure no pausing is active; visual updates should always run.
    paused = false;
    pauseUntil = 0;

    // check pauses
    if (currentPauseIndex < pauses.length && progress >= pauses[currentPauseIndex].pct) {
      const p = pauses[currentPauseIndex];
      paused = true;
      pauseUntil = ts + p.ms;
      // exclude pause duration from active time
      startTime += p.ms;
      currentPauseIndex++;
      requestAnimationFrame(step);
      return;
    }

  // update progress fill based on the current `progress` value which is
  // maintained by `onContentScroll()`.
  if (fillEl) fillEl.style.transform = `scaleX(${progress})`;

    // record progress change time for diagnostics
    if (lastProgressChangeTime === null) lastProgressChangeTime = ts;
    const prev = parseFloat(fillEl && fillEl.dataset && fillEl.dataset._lastProgress || '0');
    if (progress > prev + 0.0001) {
      lastProgressChangeTime = ts;
      if (fillEl) fillEl.dataset._lastProgress = progress.toString();
    }

    // subtle scroller nudge so content feels tied to progress but user still controls scrolling
    if (scroller) {
      const scrollerY = -maxScrollPx * Math.min(1, progress * scrollFactor);
      scroller.style.transform = `translateY(${scrollerY}px)`;
    }

    requestAnimationFrame(step);
  }

  // Animate the top progress from its current progress to 100% over `ms` milliseconds.
  // Returns a promise that resolves when the animation completes.
  function animateProgressToFull(ms) {
    if (progressFinished) return Promise.resolve();
    return new Promise((resolve) => {
      const start = performance.now();
      const from = Math.max(0, Math.min(1, progress));
      function tick(now) {
        const raw = Math.min(1, (now - start) / ms);
        // ease-out cubic for a more natural finish
        const t = 1 - Math.pow(1 - raw, 3);
  progress = from + (1 - from) * t;
  if (fillEl) fillEl.style.transform = `scaleX(${progress})`;
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          // finalize to the clipped full width so rounded cap looks correct
          if (fillEl) fillEl.style.transform = 'scaleX(1)';
          resolve();
        }
      }
      requestAnimationFrame(tick);
    });
  }

  // final overlay sequence: show syncing frames then check
  async function runFinalSequence(revealTarget) {
    if (syncingRunning) return;
    // mark that the final overlay has started so observers won't re-run it
    finalSequenceStarted = true;
    syncingRunning = true;
    // Show syncing animation (syncing0, syncing1, syncing3) for 2.5s, then check.png for 2.5s
    const sequence = [
      'features/syncing0.png',
      'features/syncing1.png',
      'features/syncing3.png'
    ];
    const frameDuration = 2500 / sequence.length;
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    for (let i = 0; i < sequence.length; i++) {
      overlayImage.src = sequence[i];
      await wait(frameDuration);
    }
    overlayImage.src = 'features/check.png';
    await wait(2500);
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    // Keep the double-tap hint visible until the user interacts (clicks/taps).
    // It will be removed by the actual interaction handler so users have as
    // long as they need to discover the gesture.
    // Handle reveal targets:
    // - 'stage3' : reveal stage3 (only if we actually progressed through stage2)
    // - 'stage4' : reveal stage4 (triggered after stage3's syncing)
  if (revealTarget === 'stage4') {
      // Reveal stage4 immediately when requested — do not defer.
      const stage4After = document.getElementById('stage4Img');
      if (stage4After) {
        stage4After.style.display = 'block';
        if (stage4After && !stage4GapRemoved) stage4After.classList.add('stage4-spaced');
      }
    } else if (revealTarget === 'stage3') {
      if (shiftIndex >= 9) {
        const stage3After = document.getElementById('stage3Img');
        if (stage3After) stage3After.style.display = 'block';
      }
      // Mark stage3 syncing as completed so other logic can observe it if needed.
      stage3SyncCompleted = true;
      // After the stage2 -> syncing -> stage3 flow completes, make the remaining
      // auto-fill move very slowly and never pause so the progress bar continues
      // to drift forward instead of appearing stuck. Increase autoFillDuration.
      try {
        autoFillDuration = DEFAULT_TOTAL_FILL_DURATION * 6; // ~30 minutes slow drift
        paused = false;
        pauseUntil = 0;
        if (estimateAnim) { cancelAnimationFrame(estimateAnim); estimateAnim = null; }
        lastProgressChangeTime = performance.now();
      } catch (e) { /* ignore */ }
    } else {
      // legacy/no-target behavior: reveal stage3 only when at final stage index
      if (shiftIndex >= 9) {
        const stage3After = document.getElementById('stage3Img');
        if (stage3After) stage3After.style.display = 'block';
      }
    }
  // Do not change the top progress here — only the final stage8 flow should finish the progress.
    syncingRunning = false;
    // No temporary scroll resistance applied here to avoid confusing the progress bar.
  }

  // Allow re-triggering the syncing sequence by clicking stage3 when it's visible
  const stage3Clickable = stage3El;
  if (stage3Clickable) {
    stage3Clickable.addEventListener('click', async () => {
      // avoid re-entering while overlay is active
      if (syncingRunning) return;
  // Only allow the stage3 click to trigger the syncing sequence once
  if (stage3ClickTriggered) return;
  stage3ClickTriggered = true;
  // give the progress bar a meaningful nudge on this explicit user action
  try { applyClickNudge(2, 'stage3'); } catch (e) { /* ignore */ }
  await runFinalSequence('stage4');
    });
  }

  // When stage4 is clicked, open a comments overlay that cycles through
  // comments1..comments7 on image clicks, then runs a syncing sequence
  // and returns to showing stage4.
  const commentsImgs = [
    'features/comments1.png',
    'features/comments2.png',
    'features/comments3.png',
    'features/comments4.png',
    'features/comments5.png',
    'features/comments6.png',
    'features/comments7.png'
  ];
  const stage4Clickable = stage4El;
  if (stage4Clickable) {
    stage4Clickable.addEventListener('click', (ev) => {
      ev.preventDefault();
      // don't allow reopening after the full comments->sync sequence has completed
      if (stage4SequenceCompleted) return;
      if (syncingRunning) return;

      // user clicked to open the comments overlay — nudge progress slightly
      try { applyClickNudge(1, 'stage4'); } catch (e) { /* ignore */ }

      overlay.classList.add('comments');
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      overlayImage.style.display = 'block';

      // comments state
      let commentsIndex = 0;
      overlayImage.src = commentsImgs[commentsIndex];
      // show a 'tap to see more' hint (separate element so it isn't affected by canvas transforms)
      let commentsHint = document.getElementById('commentsHint');
      if (!commentsHint) {
        commentsHint = document.createElement('div');
        commentsHint.id = 'commentsHint';
        commentsHint.innerHTML = '<div class="hint-text">tap to see more</div>';
        document.body.appendChild(commentsHint);
      } else {
        const ht = commentsHint.querySelector('.hint-text');
        if (ht) ht.textContent = 'tap to see more';
      }
      // apply visible + blink
      commentsHint.classList.add('visible');
      const commentsHintText = commentsHint.querySelector('.hint-text');
      if (commentsHintText) {
        commentsHintText.classList.add('blink');
        commentsHintText.addEventListener('animationend', () => {
          commentsHintText.classList.remove('blink');
        }, { once: true });
      }

      // Click handler on overlay: distinguish image clicks vs background
      const onOverlayClick = async (e) => {
        // if user clicked the image, advance sequence
        if (e.target === overlayImage) {
            // advance to next comment if available
            if (commentsIndex < commentsImgs.length - 1) {
            commentsIndex++;
            overlayImage.src = commentsImgs[commentsIndex];
            // hide the tap hint once we move past the first comment
            const ch = document.getElementById('commentsHint');
            if (ch) ch.classList.remove('visible');
            try { applyClickNudge(0.75, 'comments1'); } catch (e) { /* ignore */ }
            return;
          }
          // reached last comment (comments7), run syncing then return to stage4
          overlay.removeEventListener('click', onOverlayClick);
          window.removeEventListener('keydown', onKeyDown);
          await runCommentsSync();
          // After syncing, hide overlay and show stage4 again
          // remove the tap hint if still present
          const chAfter = document.getElementById('commentsHint');
          if (chAfter) chAfter.classList.remove('visible');
          overlay.classList.remove('comments');
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          overlayImage.style.display = 'none';
          overlayImage.src = '';
          // ensure stage4 remains visible
          if (stage4El) {
            stage4El.style.display = 'block';
            // remove the pre-sync spacing so stage6 can sit closer
            stage4El.classList.remove('stage4-spaced');
            stage4GapRemoved = true;
          }
          // reveal stage6 (one-shot) after comments syncing completes
          const stage6El = document.getElementById('stage6Img');
          if (stage6El) {
            // shuffle the faces so each reveal is different
            try { shuffleNeofaces(); } catch (e) { /* ignore */ }
            stage6El.style.display = 'block';
            // add a visible class to trigger any fade-in transition if present
            // force a reflow so transition reliably animates
            void stage6El.offsetWidth;
            stage6El.classList.add('visible');
            // attach click handlers for the neoface tiles
            try { setupNeofaceInteractions(); attachDirectHandlers(); } catch (e) { /* ignore */ }
          }
          // mark completed so it cannot be re-opened
          stage4SequenceCompleted = true;
          return;
    }
    // clicked outside the image -> ignore (do not close). This keeps the comments flow modal until
    // the image sequence completes. No action on background clicks.
    return;
      };

      const onKeyDown = (ev2) => {
        if (ev2.key === 'Escape') {
          overlay.removeEventListener('click', onOverlayClick);
          window.removeEventListener('keydown', onKeyDown);
          // remove the tap hint if still present and restore original text
          const dblEsc = document.getElementById('doubleTapHint');
          const txtEsc = dblEsc ? dblEsc.querySelector('.hint-text') : null;
              if (dblEsc) dblEsc.classList.remove('visible');
              if (txtEsc && txtEsc.dataset && txtEsc.dataset._orig) txtEsc.textContent = txtEsc.dataset._orig;
          overlay.classList.remove('comments');
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          overlayImage.style.display = 'none';
          overlayImage.src = '';
        }
      };

      overlay.addEventListener('click', onOverlayClick);
      window.addEventListener('keydown', onKeyDown);
    });
  }

  // runCommentsSync: small syncing sequence used after comments7
  async function runCommentsSync() {
    if (syncingRunning) return;
    syncingRunning = true;
    const frames = [
      'features/syncing0.png',
      'features/syncing1.png',
      'features/syncing2.png',
      'features/syncing3.png'
    ];
  const frameDuration = COMMENTS_SYNC_FRAMES_TOTAL_MS / frames.length; // shorter overall
    // Ensure the overlay is using the fullscreen syncing style (not the squeezed comments style)
    overlay.classList.remove('comments');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    overlayImage.style.display = 'block';
    // show frames (full-screen)
    for (let i = 0; i < frames.length; i++) {
      overlayImage.src = frames[i];
      await wait(frameDuration);
    }
  overlayImage.src = 'features/check.png';
  await wait(COMMENTS_SYNC_CHECK_MS);
    // hide overlay after the check is shown so UI returns to normal
    overlay.classList.remove('comments');
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    overlayImage.style.display = 'none';
    overlayImage.src = '';
    // spacing removal handled by specific flows (stage4/stage7) so no-op here
    syncingRunning = false;
  }

  // Shuffle the .neoface-grid children in-place (Fisher-Yates)
  function shuffleNeofaces() {
    const grids = Array.from(document.querySelectorAll('.neoface-grid'));
    const grid = grids.find(g => g.offsetParent !== null) || grids[0];
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('.neoface-item'));
    // Fisher-Yates shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // swap items[i] and items[j] by reordering DOM
      const a = items[i];
      const b = items[j];
      // To avoid disrupting the array while appending, we'll swap in array
      [items[i], items[j]] = [items[j], items[i]];
    }
    // Append in new order
    items.forEach(item => grid.appendChild(item));
  }

  // Set up click interactions for the neoface tiles using event delegation.
  let _neofaceHandlersAttached = false;
  const selectedFaces = new Set();
  // HEART_TARGETS is mutable so we can switch target sets between stages
  let HEART_TARGETS = ['neoface2.png', 'neoface4.png', 'neoface6.png'];
  const HEART_TARGETS_STAGE8 = ['neoface7.png', 'neoface8.png', 'neoface9.png', 'neoface2.png'];
  let neofaceSyncHasRun = false; // run only once per stage (we'll reuse/reset if needed)
  function setupNeofaceInteractions() {
    if (_neofaceHandlersAttached) return;
    // Attach a single delegated listener at the document level so it works for any
    // .neoface-grid (stage6 or stage8) without rebinding when grids are swapped.
    document.addEventListener('click', function _neofaceDocHandler(ev) {
      const item = ev.target.closest('.neoface-item');
      if (!item) return;
      // only handle items that are inside a visible neoface-grid
      const grid = item.closest('.neoface-grid');
      if (!grid || grid.offsetParent === null) return; // not visible
      ev.preventDefault();
      processNeofaceClick(item).catch(() => {});
    });
    _neofaceHandlersAttached = true;
  }

  // Fallback: attach direct handlers to each image (helps when delegation misses events)
  function attachDirectHandlers() {
    const grids = Array.from(document.querySelectorAll('.neoface-grid'));
    const grid = grids.find(g => g.offsetParent !== null) || grids[0];
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('.neoface-item'));
    items.forEach(item => {
      const img = item.querySelector('.neoface');
      if (!img) return;
      // ensure pointer events and keyboard focusability on the container
      item.style.pointerEvents = 'auto';
      item.setAttribute('tabindex', '0');
      // avoid double-binding
      if (item._directBound) return;
      const handler = (ev) => {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        processNeofaceClick(item);
      };
      item.addEventListener('click', handler);
      item.addEventListener('touchstart', handler, { passive: false });
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); processNeofaceClick(item); } });
      item._directBound = true;
    });
  }

  // Reveal the slide-down metrics panel under the topbar.
  let _metricsRevealed = false;
  function revealInternalisationMetrics() {
    if (!topbar || _metricsRevealed) return;
    _metricsRevealed = true;
    // create panel if missing
    let panel = document.getElementById('metricsPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'metricsPanel';
      panel.className = 'metrics-panel';
      const inner = document.createElement('div');
      inner.className = 'metrics-inner';
      // build content
  // no title (removed per request)
      const items = [
        ['Aesthetic conformity', 'High'],
        ['Feedback loop', 'Established'],
        ['Self-adjustment', 'Automatic'],
        ['Visibility potential', 'Increased']
      ];
      items.forEach(([label, value]) => {
        const el = document.createElement('div');
        el.className = 'metric-item';
        const strong = document.createElement('strong');
        strong.textContent = label + ':';
        el.appendChild(strong);
        const span = document.createElement('span');
        span.textContent = ' ' + value;
        el.appendChild(span);
        inner.appendChild(el);
      });
      panel.appendChild(inner);
      // hide the metrics-inner until the completion animation finishes
      inner.style.visibility = 'hidden';
      // append panel after the existing topbar content so the pink area extends down
      // while keeping the progress bar visible at the top. We'll calculate the
      // remaining viewport height and expand the panel to fill it.
      topbar.appendChild(panel);
    }

    // sequence: move the title & progress down first, then expand the pink area,
    // then reveal the metric lines one-by-one. This creates the effect of the
    // progress bar descending to reveal the background the text will appear on.
    requestAnimationFrame(() => {
  const baseHeight = topbar.clientHeight - panel.clientHeight;
  // Reserve some space at the bottom so the metrics panel doesn't stretch
  // all the way to the bottom of the viewport. This makes the final view
  // feel more like the web version (content stops a bit earlier).
  const bottomReserve = Math.min(240, Math.round(window.innerHeight * 0.18));
  const targetH = Math.max(0, window.innerHeight - baseHeight - bottomReserve);

      // compute a visual shift for the title & progress track (cap to reasonable px)
      const shiftPx = Math.min(Math.round(targetH * 0.45), 220);
      const titleEl = document.getElementById('title');
      const trackEl = topbar.querySelector('.progress-track');

      try {
        if (titleEl) titleEl.style.transform = `translateY(${shiftPx}px)`;
        if (trackEl) trackEl.style.transform = `translateY(${shiftPx}px)`;
      } catch (e) { /* ignore */ }

      // after a short delay (progress moved first), expand the panel to fill remainder
      const delayBeforeExpand = 320;
      setTimeout(() => {
        panel.style.height = targetH + 'px';
      }, delayBeforeExpand);

      // create and show the big completion message with confetti, then reveal metrics
      const panelTransitionMs = 700; // matches CSS
  const completionDuration = 2200; // show completion message duration (extended)

      // build completion overlay
      const completionWrap = document.createElement('div');
      completionWrap.className = 'completion-wrap';
      completionWrap.innerHTML = `
        <div class="completion-text" id="completionText">Self-Integration Completed</div>
        <div class="confetti" id="confettiContainer"></div>
      `;
      panel.appendChild(completionWrap);

      // after panel expand delay, start the completion animation
      setTimeout(() => {
        // show text
        const compText = document.getElementById('completionText');
        const confetti = document.getElementById('confettiContainer');
        if (compText) compText.classList.add('visible');
        // create confetti pieces
        if (confetti) {
          const pieces = 14;
          for (let i = 0; i < pieces; i++) {
            const p = document.createElement('div');
            p.className = 'piece';
            const left = Math.round(Math.random() * 90 + 5);
            p.style.left = left + '%';
            const delay = Math.round(Math.random() * 300);
            p.style.animationDelay = delay + 'ms';
            const scale = (Math.random() * 0.9) + 0.6;
            p.style.transform = `scale(${scale})`;
            confetti.appendChild(p);
          }
        }
      }, delayBeforeExpand + panelTransitionMs + 60);

      // after completionDuration, remove completion overlay and reveal metrics
      const revealStart = delayBeforeExpand + panelTransitionMs + 60 + completionDuration;
      setTimeout(() => {
        // remove completion elements
        const comp = panel.querySelector('.completion-wrap');
        if (comp) comp.remove();
        // reveal metrics inner and stagger items
        const innerEl = panel.querySelector('.metrics-inner');
        if (innerEl) innerEl.style.visibility = 'visible';
        const items = Array.from(panel.querySelectorAll('.metric-item'));
        items.forEach((it, idx) => {
          setTimeout(() => it.classList.add('visible'), 240 * (idx + 1));
        });
        // after items are scheduled, also add a restart button and show it after the last item
        const lastDelay = 240 * (items.length + 1);
        setTimeout(() => {
          let btn = innerEl.querySelector('.restart-btn');
          if (!btn) {
            btn = document.createElement('button');
            btn.className = 'restart-btn';
            btn.textContent = 'Restart';
            innerEl.appendChild(btn);
            btn.addEventListener('click', () => {
              try { window.location.reload(); } catch (e) { /* fallback */ window.scrollTo(0,0); }
            });
          }
          // show the button with animation
          setTimeout(() => btn.classList.add('visible'), 80);
        }, lastDelay + 180);
      }, revealStart);
    });
  }

  // Centralized click processing so delegation and direct handlers use same logic
  // processNeofaceClick accepts the container item (.neoface-item)
  async function processNeofaceClick(item) {
    if (!item) return;
    if (syncingRunning) return;
    if (item.classList.contains('locked')) return; // prevent interaction after one-shot sync
    const img = item.querySelector('.neoface');
    if (!img) return;
    const src = (img.getAttribute('src') || '').toLowerCase();
    const fileName = src.split('/').pop();
  // find the grid that contains this item
  const grid = item.closest('.neoface-grid');
  if (!grid) return;
    if (HEART_TARGETS.includes(fileName)) {
      const already = selectedFaces.has(fileName);
      if (already) {
        selectedFaces.delete(fileName);
        const existing = item.querySelector('.neoface-heart.persistent[data-face="' + fileName + '"]');
        if (existing) existing.remove();
        img.classList.remove('selected');
        console.debug('[neoface] deselected', fileName, 'selected ->', Array.from(selectedFaces));
        // small nudge on deselect as well to make interactions feel responsive
  try { applyClickNudge(0.25, 'neoface-' + fileName); } catch (e) { /* ignore */ }
      } else {
        selectedFaces.add(fileName);
        const heart = document.createElement('div');
        heart.className = 'neoface-heart persistent visible';
        heart.setAttribute('data-face', fileName);
        // use the nicer heart path and preserve aspect ratio to avoid distortion
        heart.innerHTML = '<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 82s-32-22.7-32-42.7C18 24.6 32.6 18 41.7 27.1L50 35.4l8.3-8.3C67.4 18 82 24.6 82 39.3 82 59.3 50 82 50 82z" fill="#ff91e4"/></svg>';
        item.appendChild(heart);
        img.classList.add('selected');
        console.debug('[neoface] selected', fileName, 'selected ->', Array.from(selectedFaces));
        // bump progress a bit when the user selects a target face
  try { applyClickNudge(1.25, 'neoface-' + fileName); } catch (e) { /* ignore */ }
      }

      if (selectedFaces.size === HEART_TARGETS.length) {
        console.debug('[neoface] all selected, triggering sync');
        // If these targets correspond to the final stage8 set and stage8 is visible,
        // finish the top progress bar so it ends when the final syncing begins.
        try {
          const stage8El = document.getElementById('stage8Img');
          const isStage8Final = Array.isArray(HEART_TARGETS_STAGE8) && HEART_TARGETS_STAGE8.length === HEART_TARGETS.length && HEART_TARGETS_STAGE8.every(f => HEART_TARGETS.includes(f)) && stage8El && stage8El.style.display !== 'none';
          if (isStage8Final) {
            // ensure progress has started and topbar is visible
            progressStarted = true;
            try { showTopbar(); } catch (e) { /* ignore */ }
            // Animate the progress to 100% over the same duration as the comments sync
            const totalSyncMs = COMMENTS_SYNC_FRAMES_TOTAL_MS + COMMENTS_SYNC_CHECK_MS;
            const animPromise = animateProgressToFull(totalSyncMs);
            // run comments sync concurrently with the progress animation
            await Promise.all([animPromise, runCommentsSync()]);
            // ensure final state is locked — set numeric progress to 1 and pin the fill
            progress = 1;
            if (fillEl) fillEl.style.transform = 'scaleX(1)';
            progressFinished = true;
            // After the progress and comments sync complete, reveal the internalisation metrics panel.
            try { revealInternalisationMetrics(); } catch (e) { console.warn('reveal metrics failed', e); }
          } else {
            // Run the sync (runCommentsSync has its own guard). Keep hearts visible during the sync.
            await runCommentsSync();
          }
        } finally {
          // Mark that this one-shot has run and lock the three target tiles so they can't be toggled again.
          neofaceSyncHasRun = true;
          HEART_TARGETS.forEach((fname) => {
            // find the item with this face
            const itemEl = Array.from(grid.querySelectorAll('.neoface-item')).find(it => {
              const im = it.querySelector('.neoface');
              if (!im) return false;
              const s = (im.getAttribute('src') || '').toLowerCase();
              return s.endsWith(fname);
            });
            if (itemEl) {
              itemEl.classList.add('locked');
              itemEl.style.pointerEvents = 'none';
              itemEl.setAttribute('aria-disabled', 'true');
            }
          });
          // keep the heart elements and selected classes visible (no removal)
          // reveal stage7 now that the stage6 sync finished
          const stage7 = document.getElementById('stage7Img');
          if (stage7) {
            stage7.style.display = 'block';
            stage7.classList.add('visible');
            // add spacing so stage7 sits separated from the next stage until its own syncing runs
            if (!stage7GapRemoved) stage7.classList.add('stage4-spaced');
          }
        }

      }
    } else {
      // disappear the image but keep container size
      img.classList.add('removed');
      img.style.pointerEvents = 'none';
    }
  }

  // Reposition persistent hearts (call on resize/scroll)
  function repositionPersistentHearts() {
    // No-op: hearts are centered via CSS inside each .neoface-item container.
    return;
  }

  window.addEventListener('resize', () => { repositionPersistentHearts(); });
  window.addEventListener('scroll', () => { repositionPersistentHearts(); }, { passive: true });
  // Invalidate cached stage8 measurement on resize
  window.addEventListener('resize', () => { cachedStage8Bottom = null; });

  // start progress on first user scroll and show topbar
  function startProgressIfNeeded() {
    if (progressStarted) return;
    progressStarted = true;
    showTopbar();
    // show the one-time how-to panel when the progress first appears
    try { showHowToInteract(); } catch (e) { /* ignore */ }
    requestAnimationFrame((ts) => {
      startTime = ts;
      requestAnimationFrame(step);
    });
  }

  // Show a one-time 'How to interact' slide-down panel that expands under the topbar
  function showHowToInteract() {
    if (!topbar || howToShown) return;
    howToShown = true;
    // create panel
    let panel = document.getElementById('howToPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'howToPanel';
      panel.className = 'howto-panel';
      const inner = document.createElement('div');
      inner.className = 'howto-inner';
      // title centered
      const title = document.createElement('div');
      title.className = 'howto-title';
      title.textContent = 'How to interact';
      inner.appendChild(title);
      // list of instructions (left aligned)
      const ol = document.createElement('ol');
      ol.className = 'howto-list';
      const steps = [
        'Scroll to advance.',
        'Tap pink-highlighted areas to continue.',
        'Some stages disable scrolling.',
        'When scrolling is paused, click to initiate sync.',
        'Repeat inputs until syncing completes.'
      ];
      steps.forEach(txt => {
        const li = document.createElement('li');
        li.textContent = txt;
        ol.appendChild(li);
      });
  // constrain the list inside a centered column so items don't get crunched
  const wrapper = document.createElement('div');
  wrapper.className = 'howto-list-wrapper';
  wrapper.appendChild(ol);
  inner.appendChild(wrapper);
      // Start button (reuse restart-btn style)
      const startBtn = document.createElement('button');
      startBtn.className = 'restart-btn';
      startBtn.textContent = 'Start';
      startBtn.addEventListener('click', () => {
        // close the how-to panel and restore title/track
        try {
          // hide inner content immediately
          const inner = panel.querySelector('.howto-inner');
          if (inner) {
            inner.style.opacity = '0';
            inner.style.visibility = 'hidden';
          }
          const btnInner = panel.querySelector('.howto-inner .restart-btn');
          if (btnInner) btnInner.classList.remove('visible');
          // animate panel collapse
          panel.style.height = '0px';
          // ensure title/track remain in their normal position
          const titleEl = document.getElementById('title');
          const trackEl = topbar.querySelector('.progress-track');
          if (titleEl) titleEl.style.transform = '';
          if (trackEl) trackEl.style.transform = '';
          // after collapse animation remove the panel from layout to avoid any remnant
          setTimeout(() => {
            try { panel.style.display = 'none'; } catch (e) {}
          }, 520);
        } catch (e) {}
      });
      inner.appendChild(startBtn);
      panel.appendChild(inner);
      // insert panel directly after the progress track so the text sits under the bar
      const trackEl = topbar ? topbar.querySelector('.progress-track') : null;
      if (trackEl && trackEl.parentNode) {
        trackEl.parentNode.insertBefore(panel, trackEl.nextSibling);
      } else {
        topbar.appendChild(panel);
      }
      // observe topbar class changes and hide the panel if the topbar is hidden
      try {
        const mo = new MutationObserver(() => {
          if (topbar.classList.contains('hidden')) {
            try {
              const inner = panel.querySelector('.howto-inner');
              if (inner) { inner.style.opacity = '0'; inner.style.visibility = 'hidden'; }
              panel.style.height = '0px';
              panel.style.display = 'none';
            } catch (e) {}
          }
        });
        mo.observe(topbar, { attributes: true, attributeFilter: ['class'] });
      } catch (e) { /* ignore */ }
    }

    // animate: translate title & track down, then expand the panel
    requestAnimationFrame(() => {
      // Use the same calculation as the final metrics reveal so sizing/spacing matches
      const baseHeight = topbar.clientHeight - panel.clientHeight;
      const targetH = Math.max(0, window.innerHeight - baseHeight);

  // Make the how-to panel smaller than the full metrics reveal so gaps are tighter
  const cappedTarget = Math.max(110, Math.min(targetH, Math.round(window.innerHeight * 0.36)));
  const shiftPx = Math.min(Math.round(cappedTarget * 0.35), 140);
      const titleEl = document.getElementById('title');
      const trackEl = topbar.querySelector('.progress-track');

      try {
        // Keep title and track stationary so the title remains visible when the panel expands
        if (titleEl) titleEl.style.transform = '';
        if (trackEl) trackEl.style.transform = '';
      } catch (e) { /* ignore */ }

      const delayBeforeExpand = 320; // match metrics timing
      // ensure panel is visible in layout before starting expand
      panel.style.display = 'flex';
      setTimeout(() => {
        panel.style.height = cappedTarget + 'px';
      }, delayBeforeExpand);

      // fade in inner content slightly after expand begins
      const panelTransitionMs = 420; // shorter for compact howto
      setTimeout(() => {
        const inner = panel.querySelector('.howto-inner');
        if (inner) inner.style.opacity = '1';
        // reveal the Start button visually
        const btn = panel.querySelector('.howto-inner .restart-btn');
        if (btn) btn.classList.add('visible');
      }, delayBeforeExpand + panelTransitionMs - 40);
    });
  }

  // Make progress responsive to how far the user has scrolled through the content.
  // This makes the fill follow the user's scroll position rather than only a time-based progression.
  function onContentScroll() {
    if (!contentEl) return;
    // mark that the user interacted so we can suspend automatic progression briefly
    lastUserInteraction = performance.now();
    if (!progressStarted) startProgressIfNeeded();
    const logicalMax = getLogicalMaxScroll();
    // Map the user's scroll position directly to the progress (0..1) relative
    // to the logical end (which accounts for stage8 when present). This ties the
    // top bar fully to scroll: reaching stage8 should map to progress == 1.
  const ratio = logicalMax > 0 ? Math.min(1, Math.max(0, contentEl.scrollTop / logicalMax)) : 0;
    // Move progress toward the target ratio by a fixed small step so the bar
    // advances in tiny, consistent ticks rather than jumping. Allow moving up
    // or down gradually.
    if (Math.abs(ratio - progress) <= PROGRESS_STEP) {
      progress = ratio;
    } else if (ratio > progress) {
      progress = progress + PROGRESS_STEP;
    } else {
      progress = progress - PROGRESS_STEP;
    }
    if (fillEl) fillEl.style.transform = `scaleX(${progress})`;
  }
  if (contentEl) contentEl.addEventListener('scroll', onContentScroll, { passive: true });

  // Compute a logical max scroll point that treats `stage8El` as the true end of content
  // if it's present. This prevents automatic progress from treating earlier pause points
  // or trailing whitespace as the "end" and jumping to 100% prematurely.
  function getLogicalMaxScroll() {
    if (!contentEl) return 0;
    try {
      // If stage8 is present, try to compute where it will appear even if it's hidden.
      if (stage8El) {
        // If it's currently visible, measure directly.
        if (stage8El.style.display !== 'none') {
          const stage8Bottom = stage8El.offsetTop + stage8El.offsetHeight;
          const logical = Math.max(0, stage8Bottom - contentEl.clientHeight);
          // cache for future calls
          cachedStage8Bottom = stage8Bottom;
          if (logical > 0) return logical;
        }
        // If it's hidden but we have a cached measurement, use that.
        if (cachedStage8Bottom !== null) {
          const logical = Math.max(0, cachedStage8Bottom - contentEl.clientHeight);
          if (logical > 0) return logical;
        }
        // Otherwise, try to measure by inserting a hidden clone into the flow
        try {
          const clone = stage8El.cloneNode(true);
          clone.style.display = 'block';
          clone.style.visibility = 'hidden';
          clone.style.position = 'relative';
          clone.style.pointerEvents = 'none';
          contentEl.appendChild(clone);
          const cloneBottom = clone.offsetTop + clone.offsetHeight;
          contentEl.removeChild(clone);
          cachedStage8Bottom = cloneBottom;
          const logical = Math.max(0, cloneBottom - contentEl.clientHeight);
          if (logical > 0) return logical;
        } catch (e) { /* ignore clone failures */ }
      }
    } catch (e) {
      // fall back
    }
    return Math.max(0, contentEl.scrollHeight - contentEl.clientHeight);
  }

  // Helper: return true when stage8 is meaningfully in the scroller's viewport
  function isStage8InView() {
    if (!stage8El || !contentEl) return false;
    try {
      const stageTop = stage8El.offsetTop;
      const stageBottom = stageTop + stage8El.offsetHeight;
      const viewTop = contentEl.scrollTop;
      const viewBottom = viewTop + contentEl.clientHeight;
      // Consider stage8 'in view' when its top is within the lower part of the viewport
      // (e.g. the last 75% of the view) or when it's fully visible.
      const lowerThreshold = viewTop + contentEl.clientHeight * 0.25;
      if ((stageTop >= viewTop && stageBottom <= viewBottom) || (stageTop >= lowerThreshold && stageTop <= viewBottom)) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  // detect when user has scrolled through the posts area
  if (contentEl) {
    // start on first user scroll
    const onFirstScroll = () => {
      startProgressIfNeeded();
      contentEl.removeEventListener('scroll', onFirstScroll);
    };
    contentEl.addEventListener('scroll', onFirstScroll, { passive: true });

    // listen for reaching the end of the scroller content to fire final sequence
    let overlayPlayed = false;
    // Use IntersectionObserver to trigger after stage1post3.png is fully visible
    const post3 = document.querySelector('img[alt="post3"]');
    if (post3) {
      const observer = new window.IntersectionObserver((entries) => {
        entries.forEach(entry => {
      if (entry.isIntersecting && !overlayPlayed && !finalSequenceStarted && progressStarted) {
        // Only auto-run the final syncing overlay if the user has started
        // interacting (progressStarted). This prevents the overlay from
        // playing immediately on page load when the viewport already
        // includes the observed image.
        overlayPlayed = true;
        runFinalSequence();
          }
        });
      }, { root: contentEl, threshold: 1.0 });
      observer.observe(post3);
    }

  // Add scroll resistance: slow down user scroll by intercepting wheel/touch events
  // To force scrolling to last about 10 seconds, set a much lower resistance
  let resistance = 0.08; // Lower value = slower scroll. Tweak as needed.
  const normalResistance = 0.08;
  // Make the post-overlay resistance less aggressive so transitions feel quicker
  const postStage2Resistance = 0.06; // slightly slower than normal, but not sticky
  const postOverlayResistanceDuration = 300; // ms to keep extra resistance after overlays

    // Wheel handler for desktop
    // Allow only downward scrolling (deltaY > 0). Block upward scroll attempts.
    contentEl.addEventListener('wheel', (ev) => {
      if (useNativeScroll) return; // let browser handle it
      // record user input
      lastUserInteraction = performance.now();
      if (debugOverlay && debugEnabled) updateDebugOverlay();
      if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        // If attempting to scroll up (negative deltaY), block it
        if (ev.deltaY <= 0) {
          ev.preventDefault();
          return;
        }
        ev.preventDefault();
        // ensure a minimum visible step so very small deltas still move the scroller
        const MIN_SCROLL_STEP = 1; // px
        const raw = Math.abs(ev.deltaY) * resistance;
        const amount = Math.max(MIN_SCROLL_STEP, raw);
        const reduced = Math.sign(ev.deltaY) * amount;
        contentEl.scrollBy({ top: reduced, left: 0, behavior: 'auto' });
        if (debugOverlay && debugEnabled) updateDebugOverlay();
      }
    }, { passive: false });

    // Touch handling for mobile
    let touchStartY = null;
    contentEl.addEventListener('touchstart', (ev) => {
      if (useNativeScroll) return; // allow native
      if (ev.touches && ev.touches.length) touchStartY = ev.touches[0].clientY;
      // record user input
      lastUserInteraction = performance.now();
    }, { passive: true });

    contentEl.addEventListener('touchmove', (ev) => {
      if (useNativeScroll) return; // allow native
      // record that the user is actively interacting
      lastUserInteraction = performance.now();
      if (debugOverlay && debugEnabled) updateDebugOverlay();
      if (touchStartY === null) return;
      const y = ev.touches[0].clientY;
      const delta = touchStartY - y;
      // delta > 0 => finger moved up => user is scrolling down (allowed)
      // delta <= 0 => finger moved down => user is scrolling up (block it)
      if (delta <= 0) {
        // update start position to avoid a jump on next move
        touchStartY = y;
        ev.preventDefault();
        return;
      }
      // ensure a minimum step for touch scrolls so the scroller doesn't 'stick'
      const MIN_TOUCH_STEP = 1; // px
      const rawTouch = delta * resistance;
      const touchAmount = Math.max(MIN_TOUCH_STEP, rawTouch);
      contentEl.scrollBy({ top: touchAmount, left: 0, behavior: 'auto' });
      if (debugOverlay && debugEnabled) updateDebugOverlay();
      touchStartY = y;
      ev.preventDefault();
    }, { passive: false });
  }

  // responsive fit (existing code expects viewport and canvas variables)
  function fitToScreen() {
    if (!viewport || !canvasEl) return;
    const origW = parseFloat(getComputedStyle(canvasEl).width) || 428;
    const origH = parseFloat(getComputedStyle(canvasEl).height) || 926;
    const vpW = viewport.clientWidth;
    const vpH = viewport.clientHeight;
    // scale to fit within viewport without rotating
    const scale = Math.min(vpW / origW, vpH / origH, 1);
    // On small screens we let CSS handle responsive layout (no translate)
    if (window.innerWidth <= 600) {
      // reset any inline positioning that may have been applied
      canvasEl.style.transform = '';
      canvasEl.style.left = '';
      canvasEl.style.top = '';
      canvasEl.style.position = '';
      canvasEl.style.margin = '';
      return;
    }
    // otherwise keep centered transform but do not rotate
    canvasEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  window.addEventListener('resize', () => {
    fitToScreen();
  }, { passive: true });

  window.addEventListener('load', () => {
    // ensure layout is measured and fit before user interaction
    fitToScreen();
    // create debug overlay and key toggle (press 'd' to toggle)
    createDebugOverlay();
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        debugEnabled = !debugEnabled;
        if (debugOverlay) debugOverlay.style.display = debugEnabled ? 'block' : 'none';
        if (debugEnabled) updateDebugOverlay();
      }
      if (e.key === 'n' || e.key === 'N') {
        useNativeScroll = !useNativeScroll;
        if (debugOverlay && debugEnabled) updateDebugOverlay();
      }
    });
  });
});

