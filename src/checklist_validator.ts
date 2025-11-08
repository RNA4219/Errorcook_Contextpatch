export type ChecklistItem = {
  id?: string;
  title: string;
  done: boolean;
};

export type Checklist = {
  items: ChecklistItem[];
};

// Parses a simple Markdown checklist of the form:
// - [x] Completed task
// - [ ] Incomplete task
export function parseChecklistMarkdown(markdown: string): Checklist {
  const lines = markdown.split(/\r?\n/);
  const items: ChecklistItem[] = [];
  for (const line of lines) {
    const m = line.match(/^-\s+\[( |x|X)\]\s+(.*)$/);
    if (m) {
      const done = m[1].toLowerCase() === 'x';
      const title = m[2].trim();
      items.push({ id: undefined, title, done });
    }
  }
  return { items };
}

export function summarizeChecklist(checklist: Checklist): string {
  const total = checklist.items.length;
  const done = checklist.items.filter((it) => it.done).length;
  return `Checklist: ${done}/${total} done`;
}

export function isAllDone(checklist: Checklist): boolean {
  if (checklist.items.length === 0) return false;
  return checklist.items.every((it) => it.done);
}
