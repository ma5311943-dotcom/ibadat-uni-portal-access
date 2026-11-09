import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchStudentDetails,
  isApiConfigured,
  StudentApiError,
} from "../api/studentApi";

const MAX_HISTORY = 8;

const initialState = {
  status: "idle",
  student: null,
  error: null,
  registration: "",
};

function mergeHistory(current, registration) {
  const value = String(registration ?? "").trim();
  if (!value) {
    return current;
  }

  const next = [value, ...current.filter((item) => item !== value)];
  return next.slice(0, MAX_HISTORY);
}

export function useStudentLookup() {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([]);
  const activeControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const search = useCallback(async (rawRegistration) => {
    const registration = String(rawRegistration ?? "").trim();

    if (!registration) {
      setState({
        ...initialState,
        status: "error",
        error: new StudentApiError({
          code: "empty",
          title: "Registration number required",
          message: "Enter a registration number before searching.",
          detail: "For example, REG-12345.",
        }),
      });
      return;
    }

    activeControllerRef.current?.abort();

    const controller = new AbortController();
    activeControllerRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState({
      status: "loading",
      student: null,
      error: null,
      registration,
    });

    try {
      const { student } = await fetchStudentDetails(registration, {
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setHistory((current) => mergeHistory(current, registration));
      setState({
        status: "success",
        student,
        error: null,
        registration,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current || error?.code === "aborted") {
        return;
      }

      const apiError =
        error instanceof StudentApiError
          ? error
          : new StudentApiError({
              code: "unknown",
              title: "Something went wrong",
              message:
                "An unexpected error occurred while fetching the student record.",
              detail: "Please try again.",
            });

      setHistory((current) => mergeHistory(current, registration));
      setState({
        status: "error",
        student: null,
        error: apiError,
        registration,
      });
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  useEffect(
    () => () => {
      activeControllerRef.current?.abort();
    },
    [],
  );

  return {
    ...state,
    history,
    isConfigured: isApiConfigured,
    search,
    clearHistory,
  };
}
