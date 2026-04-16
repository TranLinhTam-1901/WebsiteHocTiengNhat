import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { resolveLive2dModelUrl } from '../../../constants/tutorLive2d';
import { fetchExtraExpressionIds } from '../../../lib/tutorLive2dExpressionCatalog';
import { fetchTutorMotionCatalog, type TutorMotionCatalog } from '../../../lib/tutorLive2dMotionCatalog';

export type TutorLive2DPhase = 'idle' | 'thinking' | 'speaking';

export type Live2DPanelProps = {
  modelUrl?: string | null;
  /** Id expression Cubism (Thanks, Wrong, Thinking, …). `null` = pose mặc định (không .exp3). */
  expression: string | null;
  /**
   * Mood chữ thường (happy/sad/calm/thinking/...) để chọn motion nhóm TutorReply;
   * tách khỏi `expression` khi id file .exp3 khác với tên mood (vd. Thanks → happy).
   */
  replyMotionMood?: string;
  /** `thinking` chỉ khi LLM đang chờ; không dùng khi chỉ TTS/chuẩn bị giọng. */
  phase: TutorLive2DPhase;
  lip: number;
  /**
   * `ParamMouthOpenY` khi không phát TTS (idle / thinking). Expression Thanks thường cần ~0.5;
   * nếu luôn gán 0 sau khi nói sẽ xóa miệng của .exp3 Thanks.
   */
  lipIdleOpenY?: number;
  scale?: number;
  /** Khi true: không cho tap (đang gửi / TTS). */
  interactionDisabled?: boolean;
  /**
   * Gán 0 cho các `Param…` trước khi áp expression (sau `loadParameters`) — tránh sót morph giữa các .exp3
   * khi không chỉnh được model trong Cubism (vd. Vivian: Param141–143 chỉ có trong Thinking).
   */
  expressionResetParamIds?: readonly string[];
};

declare global {
  interface Window {
    Live2DCubismCore?: unknown;
    PIXI?: typeof PIXI;
  }
}

const MIN_HOST_PX = 64;
const CUBISM_WAIT_MS = 8000;
/** Tránh spam random biểu cảm khi tap liên tục. */
const RANDOM_EXPR_COOLDOWN_MS = 2500;
const JOY_EXPR_DURATION_MS = 4000;

/** Giá trị WeakMap khi không áp expression (.exp3). */
const APPLIED_DEFAULT_KEY = '__default__';

function toAbsoluteModelUrl(resolved: string): string {
  try {
    return new URL(resolved, window.location.href).href;
  } catch {
    return resolved;
  }
}

/** Thư mục chứa file .model3.json (prefix URL) — dùng để xóa texture cache Pixi khi hủy model. */
function live2dModelAssetDirPrefix(absoluteModelJsonUrl: string): string {
  const i = absoluteModelJsonUrl.lastIndexOf('/');
  return i >= 0 ? absoluteModelJsonUrl.slice(0, i + 1) : absoluteModelJsonUrl;
}

function purgePixiTexturesUnderUrlPrefix(prefix: string): void {
  if (!prefix) return;
  const utils = PIXI.utils as typeof PIXI.utils & { TextureCache?: Record<string, { destroy?: (destroyBase?: boolean) => void }> };
  const tc = utils.TextureCache;
  if (!tc) return;
  for (const key of Object.keys(tc)) {
    const decoded = (() => {
      try {
        return decodeURIComponent(key);
      } catch {
        return key;
      }
    })();
    if (!key.startsWith(prefix) && !decoded.startsWith(prefix)) continue;
    try {
      tc[key]?.destroy?.(true);
      delete tc[key];
    } catch {
      /* ignore */
    }
  }
}

function waitForCubismCore(maxMs: number): Promise<boolean> {
  if (window.Live2DCubismCore) return Promise.resolve(true);
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (window.Live2DCubismCore) {
        resolve(true);
        return;
      }
      if (performance.now() - start > maxMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function waitForHostLayout(host: HTMLElement, min: number, maxMs: number): Promise<void> {
  if (host.clientWidth >= min && host.clientHeight >= min) return Promise.resolve();
  return new Promise((resolve) => {
    let finished = false;
    let timer = 0;
    const done = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      ro.disconnect();
      resolve();
    };
    const ro = new ResizeObserver(() => {
      if (finished) return;
      if (host.clientWidth >= min && host.clientHeight >= min) done();
    });
    timer = window.setTimeout(done, maxMs);
    ro.observe(host);
  });
}

/** Chọn motion trong nhóm TutorReply theo biểu cảm (khớp layout huohuo: 0 haoqi, 1 qizi, 2 linghun). */
function replyMotionIndex(expression: string, motionCount: number): number {
  if (motionCount <= 0) return 0;
  const e = expression.toLowerCase();
  const prefer =
    e === 'happy' || e.includes('thanks')
      ? 1
      : e === 'sad' || e === 'cry' || e.includes('wrong') || e.includes('error')
        ? 2
        : e === 'thinking'
          ? 2
          : e === 'surprised' || e === 'angry'
            ? 0
            : 0;
  return prefer % motionCount;
}

type MotionModel = {
  expression?: (n: string | number) => void;
  motion?: (group: string, index?: number, priority?: number) => Promise<boolean>;
  update: (ms: number) => void;
};

type ExpressionInternals = {
  exprMgr: Record<string, unknown> | null;
  queueMgr: Record<string, unknown> | null;
};

/**
 * Tìm ExpressionManager (pixi-live2d-display v0.3.x) và Cubism SDK CubismMotionQueueManager.
 * v0.3.1: model.internalModel.motionManager.expressionManager.queueManager
 */
function findExpressionInternals(model: MotionModel): ExpressionInternals {
  const im = (model as unknown as {
    internalModel?: {
      motionManager?: { expressionManager?: Record<string, unknown> };
      expressionManager?: Record<string, unknown>;
    };
  }).internalModel;
  if (!im) return { exprMgr: null, queueMgr: null };

  const exprMgr =
    (im.motionManager?.expressionManager ?? im.expressionManager ?? null) as Record<string, unknown> | null;
  if (!exprMgr) return { exprMgr: null, queueMgr: null };

  let queueMgr: Record<string, unknown> | null = null;
  for (const key of ['queueManager', '_queueManager', 'motionQueueManager', '_motionQueueManager']) {
    const v = exprMgr[key];
    if (v && typeof v === 'object') {
      queueMgr = v as Record<string, unknown>;
      break;
    }
  }
  return { exprMgr, queueMgr };
}

/**
 * Lấy danh sách CubismMotionQueueEntry từ CubismMotionQueueManager.
 * Cubism 4 SDK: `_motions` (csmVector với `_ptr` array bên trong).
 */
function getQueueEntries(target: Record<string, unknown>): Array<Record<string, unknown>> {
  for (const name of ['_motions', '_motionQueueEntries', '_entries']) {
    const q = target[name];
    if (!q || typeof q !== 'object') continue;
    const ptr = (q as Record<string, unknown>)['_ptr'];
    if (Array.isArray(ptr)) return ptr.filter(Boolean) as Array<Record<string, unknown>>;
    if (Array.isArray(q)) return q.filter(Boolean) as Array<Record<string, unknown>>;
  }
  return [];
}

/** Tránh reapply cùng trạng thái gây flicker. */
const _appliedExpressionMap = new WeakMap<object, string>();

type CoreModelWithParams = {
  setParameterValueById?: (id: string, v: number) => void;
  loadParameters?: () => void;
};

function getCoreModel(model: MotionModel | null): CoreModelWithParams | null {
  return (model as unknown as { internalModel?: { coreModel?: CoreModelWithParams } }).internalModel?.coreModel ?? null;
}

/** Khôi phục tham số core từ buffer mặc định (moc) — thay cho file Neutral.exp3. */
function resetCoreParametersToDefault(model: MotionModel | null): void {
  if (!model) return;
  try {
    const core = getCoreModel(model);
    if (core && typeof core.loadParameters === 'function') {
      core.loadParameters();
    }
  } catch {
    /* ignore */
  }
}

/** Gán 0 cho từng param đã biết — gỡ sót morph giữa các expression (đặc biệt blend Add + .exp3 không giao nhau đủ key). */
function resetKnownDeformationParams(model: MotionModel | null, paramIds: readonly string[] | undefined): void {
  if (!model || !paramIds?.length) return;
  const core = getCoreModel(model);
  const set = core?.setParameterValueById;
  if (!set) return;
  for (const id of paramIds) {
    try {
      set.call(core, id, 0);
    } catch {
      /* ignore */
    }
  }
}

function resetExpressionManagerTracking(exprMgr: Record<string, unknown> | null): void {
  if (!exprMgr) return;
  const defExpr = exprMgr['defaultExpression'];
  if (defExpr !== undefined) {
    exprMgr['currentExpression'] = defExpr;
  }
  if ('reserveExpressionIndex' in exprMgr) {
    (exprMgr as Record<string, number>)['reserveExpressionIndex'] = -1;
  }
}

function stopAndClearExpressionQueue(model: MotionModel | null): { exprMgr: Record<string, unknown> | null; queueMgr: Record<string, unknown> | null } {
  const { exprMgr, queueMgr } = findExpressionInternals(model ?? ({} as MotionModel));

  if (exprMgr) {
    for (const fn of ['stopAllExpressions', 'stopAllMotions', '_stopAllMotions']) {
      if (typeof exprMgr[fn] === 'function') {
        (exprMgr[fn] as () => void)();
        break;
      }
    }
  }
  if (queueMgr && typeof queueMgr['stopAllMotions'] === 'function') {
    (queueMgr['stopAllMotions'] as () => void)();
  }

  if (queueMgr) {
    const entries = getQueueEntries(queueMgr);
    for (const entry of entries) {
      entry['_finished'] = true;
    }
  }

  resetExpressionManagerTracking(exprMgr);
  return { exprMgr, queueMgr };
}

/**
 * Dừng expression queue, loadParameters, reset param tay (tuỳ model), rồi áp `.exp3` hoặc pose mặc định khi `null`.
 */
function applyExpressionToLive2dModel(
  model: MotionModel | null,
  expressionId: string | null,
  expressionResetParamIds?: readonly string[] | null
): void {
  if (!model) return;

  const mapKey = expressionId ?? APPLIED_DEFAULT_KEY;
  if (_appliedExpressionMap.get(model as object) === mapKey) return;
  _appliedExpressionMap.set(model as object, mapKey);

  try {
    stopAndClearExpressionQueue(model);
    resetCoreParametersToDefault(model);
    resetKnownDeformationParams(model, expressionResetParamIds ?? undefined);

    if (expressionId == null || !model.expression) {
      return;
    }

    model.expression(expressionId);
  } catch {
    /* ignore */
  }
}

const FallbackCharacter: React.FC<Pick<Live2DPanelProps, 'expression' | 'phase' | 'lip' | 'lipIdleOpenY'>> = ({
  expression,
  phase,
  lip,
  lipIdleOpenY = 0,
}) => {
  const mouthOpen = phase === 'speaking' ? 0.12 + lip * 0.25 : 0.12 + lipIdleOpenY * 0.25;
  const thinking = phase === 'thinking';
  const e = (expression ?? '').toLowerCase();

  return (
    <div className="relative h-full w-full flex items-end justify-center overflow-hidden rounded-2xl bg-linear-to-b from-violet-100/80 via-white to-[#fafafa] border border-[#f4f0f2]">
      <div
        className={`absolute inset-0 opacity-30 ${thinking ? 'animate-pulse' : ''}`}
        style={{
          background:
            e === 'happy'
              ? 'radial-gradient(circle at 30% 20%, #fde68a, transparent 55%)'
              : e === 'sad' || e === 'cry'
                ? 'radial-gradient(circle at 70% 25%, #c7d2fe, transparent 50%)'
                : e === 'surprised' || e === 'angry'
                  ? 'radial-gradient(circle at 50% 10%, #fbcfe8, transparent 45%)'
                  : 'radial-gradient(circle at 50% 15%, #ddd6fe, transparent 50%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center pb-10 pt-6">
        <div className="relative size-44 rounded-full bg-linear-to-br from-violet-200 to-fuchsia-200 shadow-inner border border-white/70">
          <div className="absolute left-10 top-16 flex gap-8">
            <span
              className={`inline-block size-3 rounded-full bg-[#2b1930] ${e === 'surprised' ? 'scale-y-125' : 'scale-y-100'} transition-transform`}
            />
            <span
              className={`inline-block size-3 rounded-full bg-[#2b1930] ${e === 'surprised' ? 'scale-y-125' : 'scale-y-100'} transition-transform`}
            />
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-10 w-16 rounded-full bg-[#4a2b55]/90 transition-all duration-75"
            style={{ height: `${Math.max(6, mouthOpen * 44)}px`, borderRadius: '9999px' }}
          />
        </div>
      </div>
    </div>
  );
};

const Live2DPanel: React.FC<Live2DPanelProps> = ({
  modelUrl,
  expression,
  replyMotionMood,
  phase,
  lip,
  lipIdleOpenY = 0,
  scale: customScale = 1.8,
  interactionDisabled = false,
  expressionResetParamIds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<MotionModel | null>(null);
  const motionPriorityRef = useRef<{ IDLE: number; NORMAL: number; FORCE: number } | null>(null);
  const [live2dReady, setLive2dReady] = useState(false);
  const [motionCatalog, setMotionCatalog] = useState<TutorMotionCatalog | null>(null);
  const [joyExpressionId, setJoyExpressionId] = useState<string | null>(null);
  const lipRef = useRef(lip);
  const lipIdleOpenRef = useRef(lipIdleOpenY);
  /** Luôn là `expression` từ props (không gồm joy random). */
  const expressionBaseRef = useRef<string | null>(expression);
  const expressionRef = useRef<string | null>(expression);
  const replyMotionMoodRef = useRef('');
  const phaseRef = useRef(phase);
  const lastReplyMotionKey = useRef('');
  const lastTapAt = useRef(0);
  const lastRandomExprTap = useRef(0);
  const extraExprIdsRef = useRef<string[]>([]);
  const joyTimerRef = useRef(0);
  const mountSessionRef = useRef(0);
  const prevPanelPhaseRef = useRef<TutorLive2DPhase>(phase);
  const expressionResetParamIdsRef = useRef(expressionResetParamIds);
  expressionResetParamIdsRef.current = expressionResetParamIds;

  const effectiveExpression = joyExpressionId ?? expression;

  const resolvedModelUrl = useMemo(() => resolveLive2dModelUrl(modelUrl), [modelUrl]);

  lipRef.current = lip;
  lipIdleOpenRef.current = lipIdleOpenY;
  expressionBaseRef.current = expression;
  expressionRef.current = effectiveExpression;
  replyMotionMoodRef.current = String(replyMotionMood ?? expression ?? '').toLowerCase() || 'calm';
  phaseRef.current = phase;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const c = await fetchTutorMotionCatalog(resolvedModelUrl);
      if (!cancelled) setMotionCatalog(c);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedModelUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ids = await fetchExtraExpressionIds(resolvedModelUrl);
      if (!cancelled) extraExprIdsRef.current = ids;
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedModelUrl]);

  useEffect(() => {
    setJoyExpressionId(null);
  }, [expression]);

  useEffect(() => {
    if (phase !== 'idle') {
      window.clearTimeout(joyTimerRef.current);
      joyTimerRef.current = 0;
      setJoyExpressionId(null);
    }
  }, [phase]);

  /** Đổi expression (Thinking → Error, …) phải cho phép motion TutorReply chạy lại, tránh giữ morph cũ. */
  useEffect(() => {
    lastReplyMotionKey.current = '';
  }, [expression]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    const container = containerRef.current;
    if (!mount || !container) {
      setLive2dReady(false);
      return;
    }

    const sessionAtStart = ++mountSessionRef.current;
    const stillHere = () => sessionAtStart === mountSessionRef.current;

    let cancelled = false;
    let app: PIXI.Application | null = null;
    let tickerFn: (() => void) | null = null;

    void (async () => {
      try {
        await waitForHostLayout(container, MIN_HOST_PX, 4000);
        if (cancelled || !stillHere()) return;

        const coreOk = await waitForCubismCore(CUBISM_WAIT_MS);
        if (!coreOk || cancelled || !stillHere()) {
          setLive2dReady(false);
          return;
        }

        window.PIXI = PIXI;

        const cubismMod = await import('pixi-live2d-display');
        const Live2DModel = cubismMod.Live2DModel;
        const MotionPreloadStrategy = cubismMod.MotionPreloadStrategy;
        motionPriorityRef.current = cubismMod.MotionPriority;
        if (!Live2DModel?.from) {
          throw new Error('Live2DModel không load được (thiếu live2d.min.js Cubism trong index.html?)');
        }

        const initialW = Math.max(container.clientWidth, MIN_HOST_PX);
        const initialH = Math.max(container.clientHeight, MIN_HOST_PX);

        app = new PIXI.Application({
          width: initialW,
          height: initialH,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          resizeTo: container,
        });

        if (cancelled || !stillHere()) {
          app.destroy(true);
          return;
        }

        mount.innerHTML = '';
        const canvas = app.view as HTMLCanvasElement;
        canvas.style.display = 'block';
        canvas.style.pointerEvents = 'none';
        mount.appendChild(canvas);

        app.stage.interactive = false;
        app.stage.interactiveChildren = false;

        const absoluteModelUrl = toAbsoluteModelUrl(resolvedModelUrl);

        const fromOpts: Record<string, unknown> = { autoUpdate: false };
        if (MotionPreloadStrategy?.IDLE != null) fromOpts.motionPreload = MotionPreloadStrategy.IDLE;

        const model = (await Live2DModel.from(absoluteModelUrl, fromOpts as Parameters<typeof Live2DModel.from>[1])) as unknown as PIXI.DisplayObject &
          MotionModel & {
            width: number;
            height: number;
            scale: PIXI.ObservablePoint;
            anchor: PIXI.ObservablePoint;
            position: PIXI.ObservablePoint;
          };

        if (cancelled || !stillHere()) {
          app.destroy(true, { children: true, texture: true });
          purgePixiTexturesUnderUrlPrefix(live2dModelAssetDirPrefix(absoluteModelUrl));
          return;
        }

        const layout = () => {
          const mw = Math.max(model.width, 1);
          const mh = Math.max(model.height, 1);
          const baseScale = Math.min(app!.screen.width / mw, app!.screen.height / mh) * customScale;
          model.scale.set(baseScale);
          model.anchor.set(0.5, 0.5);
          model.position.set(app!.screen.width / 2, app!.screen.height * 0.85);
        };
        layout();
        const modelAny = model as PIXI.DisplayObject & { interactive?: boolean; interactiveChildren?: boolean };
        modelAny.interactive = false;
        modelAny.interactiveChildren = false;
        app.stage.addChild(model);
        app.renderer.on('resize', layout);

        modelRef.current = model;

        const applyExpression = () => {
          applyExpressionToLive2dModel(modelRef.current, expressionRef.current, expressionResetParamIdsRef.current);
        };
        applyExpression();

        tickerFn = () => {
          try {
            const coreModel = getCoreModel(model as MotionModel);
            const p = phaseRef.current;
            model.update(app!.ticker.elapsedMS);
            const mouthY = p === 'speaking' ? lipRef.current : p === 'thinking' ? 0 : lipIdleOpenRef.current;
            coreModel?.setParameterValueById?.('ParamMouthOpenY', mouthY);
          } catch {
            /* ignore */
          }
        };

        app.ticker.add(tickerFn);

        if (!stillHere()) {
          app.destroy(true, { children: true, texture: true });
          purgePixiTexturesUnderUrlPrefix(live2dModelAssetDirPrefix(absoluteModelUrl));
          return;
        }

        setLive2dReady(true);
      } catch (err) {
        console.error('[Live2D] Lỗi tải model:', err);
        setLive2dReady(false);
        modelRef.current = null;
        if (app) {
          app.destroy(true, { children: true, texture: true });
          app = null;
        }
        purgePixiTexturesUnderUrlPrefix(live2dModelAssetDirPrefix(toAbsoluteModelUrl(resolvedModelUrl)));
      }
    })();

    return () => {
      window.clearTimeout(joyTimerRef.current);
      joyTimerRef.current = 0;
      cancelled = true;
      mountSessionRef.current += 1;
      if (app && tickerFn) app.ticker.remove(tickerFn);
      const abs = toAbsoluteModelUrl(resolvedModelUrl);
      app?.destroy(true, { children: true, texture: true });
      purgePixiTexturesUnderUrlPrefix(live2dModelAssetDirPrefix(abs));
      app = null;
      modelRef.current = null;
      motionPriorityRef.current = null;
      if (canvasMountRef.current) canvasMountRef.current.innerHTML = '';
      setLive2dReady(false);
    };
  }, [resolvedModelUrl, customScale]);

  useEffect(() => {
    if (!live2dReady) return;
    applyExpressionToLive2dModel(modelRef.current, effectiveExpression, expressionResetParamIdsRef.current);
  }, [effectiveExpression, expressionResetParamIds, live2dReady]);

  /** Khi hết phase thinking: áp lại expression đích (sau reset trong applyExpressionToLive2dModel). */
  useEffect(() => {
    if (!live2dReady) return;
    const prev = prevPanelPhaseRef.current;
    prevPanelPhaseRef.current = phase;
    if (prev !== 'thinking' || phase === 'thinking') return;
    applyExpressionToLive2dModel(modelRef.current, expressionRef.current, expressionResetParamIdsRef.current);
  }, [phase, live2dReady]);

  const tryPlayReplyMotion = useCallback(async () => {
    const m = modelRef.current;
    const MP = motionPriorityRef.current;
    if (!m?.motion || !MP) return;
    const cat = motionCatalog;
    if (!cat?.hasTutorReply) return;
    const p = phaseRef.current;
    if (p !== 'thinking' && p !== 'speaking') return;
    const expr =
      replyMotionMoodRef.current ||
      (typeof expressionRef.current === 'string' ? expressionRef.current : '') ||
      'calm';
    const group = 'TutorReply';
    let count = 3;
    try {
      const defs = (m as unknown as { internalModel?: { motionManager?: { definitions?: { motions?: { TutorReply?: unknown[] } } } } })
        .internalModel?.motionManager?.definitions?.motions?.TutorReply;
      if (Array.isArray(defs)) count = defs.length;
    } catch {
      /* ignore */
    }
    const idx = replyMotionIndex(expr, Math.max(1, count));
    const key = `${p}-${expr}-${idx}`;
    if (lastReplyMotionKey.current === key) return;
    lastReplyMotionKey.current = key;
    try {
      await m.motion(group, idx, MP.FORCE);
    } catch {
      /* ignore */
    }
  }, [motionCatalog]);

  useEffect(() => {
    if (!live2dReady) return;
    if (phase === 'idle') {
      lastReplyMotionKey.current = '';
      return;
    }
    void tryPlayReplyMotion();
  }, [phase, expression, replyMotionMood, live2dReady, tryPlayReplyMotion]);

  const tryPlayTapMotion = useCallback(async () => {
    const m = modelRef.current;
    const MP = motionPriorityRef.current;
    if (!m?.motion || !MP) return;
    if (!motionCatalog?.hasTapBody) return;
    const now = performance.now();
    if (now - lastTapAt.current < 900) return;
    lastTapAt.current = now;
    try {
      await m.motion('TapBody', undefined, MP.FORCE);
    } catch {
      /* ignore */
    }
  }, [motionCatalog]);

  const handleOverlayPointerUp = useCallback(() => {
    if (!live2dReady || interactionDisabled) return;
    if (phaseRef.current !== 'idle') return;
    void (async () => {
      await tryPlayTapMotion();
      const extras = extraExprIdsRef.current;
      if (!extras.length) return;
      const now = performance.now();
      if (now - lastRandomExprTap.current < RANDOM_EXPR_COOLDOWN_MS) return;
      lastRandomExprTap.current = now;
      const pick = extras[Math.floor(Math.random() * extras.length)]!;
      setJoyExpressionId(pick);
      applyExpressionToLive2dModel(modelRef.current, pick, expressionResetParamIdsRef.current);
      window.clearTimeout(joyTimerRef.current);
      joyTimerRef.current = window.setTimeout(() => {
        joyTimerRef.current = 0;
        setJoyExpressionId(null);
        applyExpressionToLive2dModel(modelRef.current, expressionBaseRef.current, expressionResetParamIdsRef.current);
      }, JOY_EXPR_DURATION_MS);
    })();
  }, [live2dReady, interactionDisabled, tryPlayTapMotion]);

  const tapOverlayActive = live2dReady && !interactionDisabled && phase === 'idle';

  return (
    <div className="relative h-full w-full flex-1 min-h-[320px]">
      <div ref={containerRef} className="absolute inset-0 min-h-[280px]">
        <div ref={canvasMountRef} className="absolute inset-0" />
        {live2dReady ? (
          <div
            className={`absolute inset-0 z-3 min-h-[280px] ${tapOverlayActive ? 'cursor-pointer' : 'pointer-events-none'}`}
            style={{ touchAction: 'manipulation' }}
            onPointerUp={handleOverlayPointerUp}
            role={tapOverlayActive ? 'button' : undefined}
            tabIndex={tapOverlayActive ? 0 : undefined}
            onKeyDown={(e) => {
              if (!tapOverlayActive) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOverlayPointerUp();
              }
            }}
          />
        ) : null}
      </div>
      {!live2dReady && (
        <div className="absolute inset-0 pointer-events-none">
          <FallbackCharacter expression={effectiveExpression} phase={phase} lip={lip} lipIdleOpenY={lipIdleOpenY} />
        </div>
      )}
    </div>
  );
};

export default Live2DPanel;
