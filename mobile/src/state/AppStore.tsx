import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { emptyData, type AppData } from "../domain/schema";
import { validateBackup } from "../domain/backup";
export { validateBackup } from "../domain/backup";

const STORAGE_KEY = "prism.data.v1";
type Store = {
  data: AppData;
  ready: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  coachSeed: string | null;
  setCoachSeed: (message: string | null) => void;
  notify: (message: string) => void;
  commit: (update: (data: AppData) => AppData) => Promise<void>;
  restore: (input: unknown) => Promise<void>;
  retry: () => void;
};
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const [coachSeed, setCoachSeed] = useState<string | null>(null);
  const current = useRef(data),
    queue = useRef(Promise.resolve()),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const load = useCallback(
    () =>
      AsyncStorage.getItem(STORAGE_KEY)
        .then((text) => {
          const next = text ? validateBackup(JSON.parse(text)) : emptyData();
          current.current = next;
          setData(next);
          setReady(true);
        })
        .catch(() => {
          setError(
            "Local data could not be loaded. Your saved file has not been overwritten. Try again or restore a backup.",
          );
        }),
    [],
  );
  useEffect(() => {
    void load();
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [load]);
  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);
  const commit = useCallback((update: (value: AppData) => AppData) => {
    const task = queue.current.then(async () => {
      setSaving(true);
      try {
        const next = validateBackup(update(current.current));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        current.current = next;
        setData(next);
        setError(null);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not save changes.";
        setError(message);
        throw e;
      } finally {
        setSaving(false);
      }
    });
    queue.current = task.catch(() => {});
    return task;
  }, []);
  const restore = useCallback(
    async (input: unknown) => {
      const next = validateBackup(input);
      await commit(() => next);
      setReady(true);
      notify("Backup restored.");
    },
    [commit, notify],
  );
  return (
    <Context.Provider
      value={{
        data,
        ready,
        saving,
        error,
        notice,
        coachSeed,
        setCoachSeed,
        notify,
        commit,
        restore,
        retry: () => {
          setError(null);
          setReady(false);
          void load();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("AppProvider is missing.");
  return store;
}
