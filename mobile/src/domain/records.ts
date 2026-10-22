import type { AppData } from "./schema";

export function archiveRecord(data: AppData, recordId: string): AppData {
  const archivedAt = new Date().toISOString();
  return {
    ...data,
    records: data.records.map((record) =>
      record.id === recordId && !record.archivedAt
        ? { ...record, archivedAt }
        : record,
    ),
  };
}
