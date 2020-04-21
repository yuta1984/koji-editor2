import * as Koji from 'koji-lang';

const ctx: Worker = self as any;

// Post data to parent thread
//ctx.postMessage({ type: 'initialized' }, "*");

// Respond to message from parent thread
ctx.addEventListener('message', (event) => {
  if (event.data.type === 'parse') {
    const src = event.data.src;
    const result = Koji.parse(src);
    ctx.postMessage({ type: 'parse', result: result });
  } else if (event.data.type === 'convertToHtml') {
    const src = event.data.src;
    const html = Koji.convertToHTML(src);
    ctx.postMessage({ type: 'convertToHtml', html: html });
  }
});

export default ctx;