import { useEffect, useRef, useState } from "react";
import { aiGradingApi } from "../../../api/aiGradingApi";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
} from "../../../components/ui/SharedComponents";
import {
  isTerminalAIGradingJobStatus,
  type AIGradingJobStatus,
  type AIGradingJobSummaryResponse,
  type AIGradingResultResponse,
} from "../../../types/aiGrading";
import type { SubmissionAttemptItemResponse } from "../../../types/submission";
import { AIGradingResultViewer } from "./AIGradingResultViewer";

const AI_GRADING_POLL_INTERVAL_MS = 2_500;
const AI_GRADING_MAX_POLL_DURATION_MS = 2 * 60 * 1_000;

const statusLabel: Record<AIGradingJobStatus, string> = {
  PENDING: "Pending",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const statusVariant: Record<
  AIGradingJobStatus,
  "warning" | "info" | "success" | "error"
> = {
  PENDING: "warning",
  RUNNING: "info",
  COMPLETED: "success",
  FAILED: "error",
};

const statusDescription: Record<AIGradingJobStatus, string> = {
  PENDING: "The grading job is waiting to start.",
  RUNNING: "AI grading is in progress.",
  COMPLETED: "AI grading completed. The result is ready.",
  FAILED: "AI grading failed. Retry will create a new grading job.",
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ?? fallback;

interface AIGradingPanelProps {
  attemptId: number;
  canGrade: boolean;
  hasEssay: boolean;
  items: SubmissionAttemptItemResponse[];
  onResultChange?: (result: AIGradingResultResponse | null) => void;
}

type PendingAction = "start" | "retry" | "refresh" | "result" | null;

export const AIGradingPanel = ({
  attemptId,
  canGrade,
  hasEssay,
  items,
  onResultChange,
}: AIGradingPanelProps) => {
  const { toast } = useToast();
  const [job, setJob] = useState<AIGradingJobSummaryResponse | null>(null);
  const [result, setResult] = useState<AIGradingResultResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isInitializing, setIsInitializing] = useState(
    canGrade && hasEssay,
  );
  const [isResultLoading, setIsResultLoading] = useState(false);
  const [isPollingPaused, setIsPollingPaused] = useState(false);
  const [error, setError] = useState("");
  const pollStartedAtRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onResultChange?.(result);
  }, [onResultChange, result]);

  useEffect(() => {
    let cancelled = false;

    setJob(null);
    setResult(null);
    setError("");
    setIsPollingPaused(false);
    setIsResultLoading(false);
    pollStartedAtRef.current = null;

    if (!canGrade || !hasEssay) {
      setIsInitializing(false);
      return () => {
        cancelled = true;
      };
    }

    setIsInitializing(true);

    const loadLatestJob = async () => {
      try {
        const jobs = await aiGradingApi.listJobs(attemptId);
        const latestJob = jobs[0] ?? null;
        if (!cancelled) {
          setJob(latestJob);
        }

        if (!latestJob || latestJob.status !== "COMPLETED") {
          return;
        }

        const latestResult = await aiGradingApi.getLatestResult(attemptId);
        if (!cancelled) {
          setResult(latestResult);
        }
      } catch (requestError: any) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load the AI grading status.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    loadLatestJob();

    return () => {
      cancelled = true;
    };
  }, [attemptId, canGrade, hasEssay]);

  useEffect(() => {
    if (
      job?.status !== "COMPLETED" ||
      result?.jobId === job.id
    ) {
      return;
    }

    let cancelled = false;
    setIsResultLoading(true);

    const loadCompletedResult = async () => {
      try {
        const latestResult = await aiGradingApi.getLatestResult(attemptId);
        const latestJob =
          latestResult.jobId === job.id
            ? job
            : await aiGradingApi.getJob(latestResult.jobId);
        if (!cancelled) {
          setResult(latestResult);
          setJob(latestJob);
          setError("");
        }
      } catch (requestError: any) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load the AI grading result.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsResultLoading(false);
        }
      }
    };

    loadCompletedResult();

    return () => {
      cancelled = true;
    };
  }, [attemptId, job, result?.jobId]);

  useEffect(() => {
    if (
      !job ||
      isTerminalAIGradingJobStatus(job.status) ||
      isPollingPaused
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const poll = async () => {
      if (cancelled) return;

      const startedAt = pollStartedAtRef.current ?? Date.now();
      pollStartedAtRef.current = startedAt;

      if (
        Date.now() - startedAt >=
        AI_GRADING_MAX_POLL_DURATION_MS
      ) {
        setIsPollingPaused(true);
        toast.warning(
          "Automatic AI grading status checks paused. You can check again manually.",
        );
        return;
      }

      try {
        const updatedJob = await aiGradingApi.getJob(job.id);
        if (cancelled) return;

        setJob(updatedJob);
        setError("");

        if (isTerminalAIGradingJobStatus(updatedJob.status)) {
          pollStartedAtRef.current = null;
          if (updatedJob.status === "COMPLETED") {
            toast.success("AI grading completed.");
          } else {
            toast.error("AI grading failed. You can retry the job.");
          }
          return;
        }
      } catch (requestError: any) {
        if (cancelled) return;
        setError(
          getErrorMessage(
            requestError,
            "Unable to refresh the AI grading status.",
          ),
        );
      }

      timeoutId = window.setTimeout(poll, AI_GRADING_POLL_INTERVAL_MS);
    };

    timeoutId = window.setTimeout(poll, AI_GRADING_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [job, isPollingPaused, toast]);

  const monitorJob = (nextJob: AIGradingJobSummaryResponse) => {
    setJob(nextJob);
    setError("");
    setIsPollingPaused(false);
    pollStartedAtRef.current = isTerminalAIGradingJobStatus(nextJob.status)
      ? null
      : Date.now();
  };

  const startGrading = async () => {
    if (pendingAction || !canGrade || !hasEssay) return;

    try {
      setPendingAction("start");
      const nextJob = await aiGradingApi.startGrading(attemptId);
      if (!isMountedRef.current) return;

      monitorJob(nextJob);

      if (nextJob.status === "COMPLETED") {
        toast.success("AI grading completed.");
      } else if (nextJob.status === "FAILED") {
        toast.error("AI grading failed. You can retry the job.");
      } else {
        toast.success("AI grading started.");
      }
    } catch (requestError: any) {
      if (!isMountedRef.current) return;

      const message = getErrorMessage(
        requestError,
        "Unable to start AI grading.",
      );
      setError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setPendingAction(null);
      }
    }
  };

  const retryGrading = async () => {
    if (pendingAction || job?.status !== "FAILED") return;

    try {
      setPendingAction("retry");
      const nextJob = await aiGradingApi.retryJob(job.id);
      if (!isMountedRef.current) return;

      monitorJob(nextJob);

      if (nextJob.status === "COMPLETED") {
        toast.success("AI grading completed.");
      } else if (nextJob.status === "FAILED") {
        toast.error("AI grading retry failed.");
      } else {
        toast.success("AI grading retry started.");
      }
    } catch (requestError: any) {
      if (!isMountedRef.current) return;

      const message = getErrorMessage(
        requestError,
        "Unable to retry AI grading.",
      );
      setError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setPendingAction(null);
      }
    }
  };

  const refreshStatus = async () => {
    if (pendingAction || !job) return;

    try {
      setPendingAction("refresh");
      const updatedJob = await aiGradingApi.getJob(job.id);
      if (!isMountedRef.current) return;

      monitorJob(updatedJob);
    } catch (requestError: any) {
      if (!isMountedRef.current) return;

      const message = getErrorMessage(
        requestError,
        "Unable to refresh the AI grading status.",
      );
      setError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setPendingAction(null);
      }
    }
  };

  const refreshResult = async () => {
    if (pendingAction || job?.status !== "COMPLETED") return;

    try {
      setPendingAction("result");
      setIsResultLoading(true);
      const latestResult = await aiGradingApi.getLatestResult(attemptId);
      const latestJob =
        latestResult.jobId === job.id
          ? job
          : await aiGradingApi.getJob(latestResult.jobId);
      if (!isMountedRef.current) return;

      setResult(latestResult);
      setJob(latestJob);
      setError("");
      toast.success("AI grading result refreshed.");
    } catch (requestError: any) {
      if (!isMountedRef.current) return;

      const message = getErrorMessage(
        requestError,
        "Unable to refresh the AI grading result.",
      );
      setError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setIsResultLoading(false);
        setPendingAction(null);
      }
    }
  };

  return (
    <div
      className="rounded-card border border-surface-border bg-white p-4"
      aria-busy={
        isInitializing || pendingAction != null || isResultLoading
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">AI Grading</div>
          <div className="mt-1 text-sm text-gray-500">
            AI provides a grading recommendation. Final review remains with the
            teacher.
          </div>
        </div>
        {job ? (
          <Badge variant={statusVariant[job.status]}>
            {statusLabel[job.status]}
          </Badge>
        ) : (
          <Badge>Not Started</Badge>
        )}
      </div>

      <div className="mt-4" role="status" aria-live="polite">
        {isInitializing ? (
          <div className="text-sm text-gray-500">Checking status...</div>
        ) : !hasEssay ? (
          <div className="text-sm text-gray-500">
            This attempt has no essay questions requiring AI grading.
          </div>
        ) : !canGrade ? (
          <div className="text-sm text-gray-500">
            AI grading is available after the attempt is submitted.
          </div>
        ) : job ? (
          <div className="text-sm text-gray-600">
            {statusDescription[job.status]}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Start AI grading for the submitted essay answers.
          </div>
        )}

        {isPollingPaused && (
          <div className="mt-2 text-sm text-amber-700">
            Automatic status checks are paused.
          </div>
        )}

        {error && (
          <div className="mt-3">
            <ErrorBanner message={error} />
          </div>
        )}
      </div>

      {!isInitializing && canGrade && hasEssay && (
        <div className="mt-4 flex flex-wrap gap-2">
          {!job && (
            <Button
              type="button"
              size="sm"
              onClick={startGrading}
              disabled={pendingAction != null}
            >
              {pendingAction === "start"
                ? "Starting..."
                : "Start AI Grading"}
            </Button>
          )}

          {job?.status === "FAILED" && (
            <Button
              type="button"
              size="sm"
              onClick={retryGrading}
              disabled={pendingAction != null}
            >
              {pendingAction === "retry" ? "Retrying..." : "Retry"}
            </Button>
          )}

          {job?.status === "COMPLETED" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={refreshResult}
              disabled={pendingAction != null || isResultLoading}
            >
              {pendingAction === "result"
                ? "Refreshing..."
                : "Refresh Result"}
            </Button>
          )}

          {job &&
            !isTerminalAIGradingJobStatus(job.status) &&
            isPollingPaused && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={refreshStatus}
                disabled={pendingAction != null}
              >
                {pendingAction === "refresh" ? "Checking..." : "Check Status"}
              </Button>
            )}
        </div>
      )}

      {isResultLoading && (
        <div className="mt-5 border-t border-surface-border pt-5 text-sm text-gray-500">
          Loading AI grading result...
        </div>
      )}

      {result && !isResultLoading && (
        <AIGradingResultViewer result={result} items={items} />
      )}
    </div>
  );
};
