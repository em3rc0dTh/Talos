export interface BpmnXmlVisibleDiff {
  changed: boolean;
  removedLines: string[];
  addedLines: string[];
  unifiedPreview: string;
  truncated: boolean;
}

const MAX_VISIBLE_LINES = 240;

function lines(xml: string): string[] {
  return xml.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

export function buildBpmnXmlVisibleDiff(beforeXml: string, afterXml: string): BpmnXmlVisibleDiff {
  const before = lines(beforeXml);
  const after = lines(afterXml);
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < before.length - prefix
    && suffix < after.length - prefix
    && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix += 1;

  const removed = before.slice(prefix, before.length - suffix);
  const added = after.slice(prefix, after.length - suffix);
  const changed = removed.length > 0 || added.length > 0;
  if (!changed) return { changed: false, removedLines: [], addedLines: [], unifiedPreview: '', truncated: false };

  const previewLines = [
    `@@ line ${prefix + 1} @@`,
    ...removed.map((line) => `- ${line}`),
    ...added.map((line) => `+ ${line}`),
  ];
  const truncated = previewLines.length > MAX_VISIBLE_LINES;
  const visible = truncated
    ? [...previewLines.slice(0, MAX_VISIBLE_LINES), '… diff truncated; full proposed BPMN XML remains available …']
    : previewLines;

  return {
    changed,
    removedLines: removed,
    addedLines: added,
    unifiedPreview: visible.join('\n'),
    truncated,
  };
}
