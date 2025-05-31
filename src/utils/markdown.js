import { unified } from 'unified';
import parse from 'remark-parse';
import strip from 'strip-markdown';

export async function cleanMarkdown(text) {
  const file = await unified()
    .use(parse)
    .use(strip)
    .process(text);
  return String(file);
}
