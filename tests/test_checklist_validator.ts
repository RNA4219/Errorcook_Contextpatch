import { parseChecklistMarkdown, summarizeChecklist, isAllDone } from '../src/checklist_validator';

describe('Checklist Validator', () => {
  test('parseMarkdown', () => {
    const md = `- [x] done\n- [ ] todo`;
    const cl = parseChecklistMarkdown(md);
    expect(cl.items.length).toBe(2);
    expect(cl.items[0].title).toBe('done');
    expect(cl.items[0].done).toBe(true);
    expect(cl.items[1].done).toBe(false);
  });

  test('summarize', () => {
    const cl = { items: [ { title: 'a', done: true }, { title: 'b', done: false } ] } as any;
    expect(summarizeChecklist(cl)).toBe('Checklist: 1/2 done');
  });

  test('isAllDone', () => {
    const cl1 = { items: [] } as any;
    const cl2 = { items: [ { title: 'a', done: true } ] } as any;
    expect(isAllDone(cl1)).toBe(false);
    expect(isAllDone(cl2)).toBe(true);
  });
});
