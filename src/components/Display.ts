import BaseComponent from "./BaseComponent";
import store from "../store";
import { Token } from "../types";
import KojiTokenizer from '../tokenizers/KojiTokenizer';
import Overlay from './Overlay';
import { start } from 'repl';

export default class Display extends BaseComponent {
  $el: HTMLElement;
  srcPanel: HTMLElement;

  constructor() {
    super();
    this.$el = this.h('div', 'koji-editor-display');
    this.srcPanel = this.h('div', 'koji-editor-src-panel');
    this.$el.appendChild(this.srcPanel);
    const firstLine = this.h('div', 'koji-editor-line');
    this.srcPanel.appendChild(firstLine);

    this.add(new Overlay());

    store.$watch("src", () => this.onSrcChange());
    store.$watch(['selection', 'src', 'focus'], () => {
      this.updateSelecttionRects();
      this.updateCaretPos();
    });
    store.$watch('scroll', () => {
      const offset =
        this.$el.scrollWidth -
        this.$el.clientWidth -
        store.state.scroll;
      this.$el.scrollTo(offset, 0);
    });
    // store.$watch('compositionActive', () => {
    //   if (store.state.compositionActive) {
    //     const { start } = store.state.selection
    //     const length = store.state.compositionText.length
    //     const rects = this.selectionToRects(start - length, start)
    //     store.SET_COMPOSITION_RECTS(rects)
    //   }
    // })
    store.$watch('keyboardEvent', () => {
      const arrowKeys = ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'];
      const e = store.state.keyboardEvent;
      if (e && arrowKeys.includes(e.key)) {
        store.SET_REQUESTED_SELECTION(this.proposeSelection(e));
        e.preventDefault();
      }
    });

    store.$watch('editorSize', () => {
      const { width, height } = store.state.editorSize;
      this.setSize(width, height);
    });
  }

  get lines() {
    return this.$el.getElementsByClassName('koji-editor-line');
  }

  private proposeSelection(e: KeyboardEvent): { start: number, end: number; } {
    const text = store.state.src.text;
    const sel = store.currentSelection;
    const { start, end } = store.state.selection;
    switch (e.key) {
      case 'ArrowUp':
        if (start > 0) {
          return e.shiftKey ? { start: start - 1, end } : { start: start - 1, end: start - 1 };
        }
        break;
      case 'ArrowDown':
        if (end < text.length) {
          return e.shiftKey ? { start, end: end + 1 } : { start: end + 1, end: end + 1 };
        }
      case 'ArrowRight':
        const prevLine = store.prevLine;
        let rightPos = 0;
        if (prevLine === undefined) return { start, end };
        if (sel.start.pos <= prevLine.length) {
          rightPos = this.inlinePosToAbsolutePos(sel.start.linenum - 1, sel.start.pos);
        } else {
          rightPos = start - sel.end.pos - 1;
        }
        return e.shiftKey ? { start: rightPos, end } : { start: rightPos, end: rightPos };
        break;
      case 'ArrowLeft':
        const nextLine = store.nextLine;
        let leftPos = 0;
        if (nextLine === undefined) return { start, end };
        if (sel.end.pos <= nextLine.length) {
          leftPos = this.inlinePosToAbsolutePos(sel.end.linenum + 1, sel.end.pos);
        } else {
          leftPos = this.inlinePosToAbsolutePos(sel.end.linenum + 1, nextLine.length);
        }
        return e.shiftKey ? { start, end: leftPos } : { start: leftPos, end: leftPos };
        break;
      default:
        break;
    }
    // do nothiing
    return { start, end };
  }

  private inlinePosToAbsolutePos(lineNum: number, pos: number): number {
    const text = store.state.src.text;
    let abspos = 0;
    text.split("\n").slice(0, lineNum).forEach((l) => abspos += l.length + 1);
    abspos += pos;
    return abspos;
  }

  resize(width: number, height: number) {
    this.$el.style.width = width + "px";
    this.$el.style.height = height + "px";
  }

  renderLine(text: string): HTMLElement {
    const tokenizer = new KojiTokenizer(text);
    const tokens = tokenizer.tokenize();
    let html = tokens.map(t => `<span class="token ${t.type}">${t.value}</span>`).join('');
    html = this.replaceSymbols(html);
    html += '<span class="koji-editor-lb"></span>';
    const lineElem = this.h('div', 'koji-editor-line');
    lineElem.innerHTML = html;
    return lineElem;
  }

  private addCharSpans(text: string): string {
    const fill = "</span><span class='char'>";
    text = text.split('').join(fill);
    return text.slice(8, text.length - fill.length - 1);
  }

  private replaceSymbols(text: string): string {
    return text
      .replace(/　/g, '<span class="koji-editor-white-space">□</span>');
  }

  lineAt(num: number) {
    return this.srcPanel.childNodes.item(num);
  }

  deleteLines(start: number, end: number) {
    const children = [];
    for (let i = start; i <= end; i++) {
      children.push(this.lineAt(i));
    }
    for (let child of children) {
      if (child) this.srcPanel.removeChild(child);
    }
  }

  insertLineAt(srcText: string, targetLineNum: number) {
    const line = this.renderLine(srcText);
    const lines = this.srcPanel.getElementsByClassName('koji-editor-line');
    let target;
    if (lines.length == 0) {
      this.srcPanel.appendChild(line);
    } else {
      if (targetLineNum < lines.length) {
        target = lines[targetLineNum];
      } else {
        target = lines[-1];
      }
      this.srcPanel.insertBefore(line, target);
    }
  }

  renderAll() {
    this.srcPanel.innerHTML = "";
    store.state.src.text.split("\n").forEach((l) => {
      const line = this.renderLine(l);
      this.srcPanel.appendChild(line);
    });
  }

  updateCaretPos() {
    const sel = store.currentSelection;
    const lines = this.$el.getElementsByClassName('koji-editor-line');
    const line = lines[sel.start.linenum];
    const parentRect = this.srcPanel.getBoundingClientRect();
    if (line.textContent) {
      const rect = this.createRelativeRect(line, sel.start.pos, sel.end.pos);
      store.SET_CARET_POS(rect.x, rect.y);
    } else {
      const rect = line.getBoundingClientRect();
      store.SET_CARET_POS(rect.x - parentRect.x, rect.y - parentRect.y);
    }
  }

  updateSelecttionRects() {
    const rects: DOMRect[] = [];
    const sel = store.currentSelection;
    const lines = this.$el.getElementsByClassName('koji-editor-line');
    // when selection is within single line
    if (sel.start.linenum == sel.end.linenum) {
      const line = lines[sel.start.linenum];
      if (line.textContent) {
        const rect = this.createRelativeRect(line, sel.start.pos, sel.end.pos);
        rects.push(rect);
      }
    } else {
      // when selection has multiple lines
      const head = lines[sel.start.linenum];
      const tail = lines[sel.end.linenum];
      if (head.textContent)
        rects.push(this.createRelativeRect(head, sel.start.pos, head.textContent.length));
      if (tail.textContent)
        rects.push(this.createRelativeRect(tail, 0, sel.end.pos));
      // lines between head and tail
      for (let i = sel.start.linenum + 1; i < sel.end.linenum; i++) {
        const line = lines[i];
        if (line.textContent) {
          rects.push(this.createRelativeRect(line, 0, line.textContent.length));
        }
      }
    }
    store.SET_SELETECTED_RECTS(rects);
  }

  getLinePos(pos: number): { pos: number, lineNum: number; } {
    const text = store.state.src.text;
    let lineNum = 0;
    let inlinePos = 0;
    for (let i = 0; i < text.length; i++) {
      if (i == pos) return { pos: inlinePos, lineNum: lineNum };
      if (text[i] === "\n") {
        lineNum++;
        inlinePos = 0;
      } else {
        inlinePos++;
      }
    }
    return { pos: inlinePos, lineNum: lineNum };
  }

  selectionToRects(start: number, end: number) {
    const rects: DOMRect[] = [];
    const lines = this.lines;
    const sLinePos = this.getLinePos(start);
    const eLinePos = this.getLinePos(end);
    // single line
    if (sLinePos.lineNum == eLinePos.lineNum) {
      if (sLinePos.pos == eLinePos.pos) return [];
      const line = lines[sLinePos.lineNum];
      const rect = this.createRelativeRect(line, sLinePos.pos, eLinePos.pos);
      rects.push(rect);
    } else {
      // multiline
      const headLine = lines[sLinePos.lineNum];
      const headRect = this.createRelativeRect(headLine, sLinePos.pos, headLine.textContent?.length || 0);
      const tailLine = lines[eLinePos.lineNum];
      const tailRect = this.createRelativeRect(tailLine, 0, eLinePos.pos);
      rects.push(headRect);
      rects.push(tailRect);
      for (let i = sLinePos.lineNum + 1; i < eLinePos.lineNum; i++) {
        let line = lines[i];
        let rect = this.createRelativeRect(line, 0, line.textContent?.length || 0);
        rects.push(rect);
      }
    }
    return rects;
  }

  private walkDOM(node: Node | null, func: (n: Node | null) => void) {
    func(node);
    node = node ? node.firstChild : null;
    while (node) {
      this.walkDOM(node, func);
      node = node.nextSibling;
    }
  }

  createRelativeRect(node: Node, start: number, end: number): DOMRect {
    // create range from selection position
    const range = document.createRange();
    if (node.firstChild == null) throw Error;
    let count = 0;
    let startNode: Node = node;
    let endNode: Node = node;
    let startOffset = 0;
    let endOffset = 0;
    this.walkDOM(node, (n) => {
      if (n && n.nodeType == Node.TEXT_NODE && n.textContent) {
        const chars = n.textContent.split('');
        let offset = 0;
        for (let i = 0; i < chars.length; i++) {
          count++;
          offset++;
          if (count === start) {
            startNode = n;
            startOffset = offset;
          }
          if (count === end) {
            endNode = n;
            endOffset = offset;
          }
        }
      }
    });
    if (!startNode || !endNode) throw Error('node not found');
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    // create rect from the range
    const parentRect = this.srcPanel.getBoundingClientRect();
    const rect = range.getBoundingClientRect();
    rect.x = rect.x - parentRect.x;
    rect.y = rect.y - parentRect.y;
    range.detach();
    return rect;
  }

  onSrcChange() {
    if (!store.state.input.inputEvent) return this.renderAll();
    const inputSelection = store.inputSelection;
    const startLine = inputSelection.start.linenum;
    const endLine = inputSelection.end.linenum;
    switch (store.state.input.inputEvent.inputType) {
      case "insertText":
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "insertLineBreak":
        const currentSelection = store.currentSelection;
        const cStartLine = currentSelection.start.linenum;
        const cendLine = currentSelection.end.linenum;
        this.deleteLines(startLine, endLine);
        const line1 = store.lines[cStartLine - 1];
        const line2 = store.lines[cStartLine];
        this.insertLineAt(line1, endLine);
        this.insertLineAt(line2, endLine + 1);
        break;
      case "insertCompositionText":
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "insertFromPaste":
        this.renderAll();
        break;
      case "insertFromPasteAsQuotation":
        this.renderAll();
        break;
      case "insertFromDrop":
        this.renderAll();
        break;
      case "insertReplacementText":
        this.renderAll();
        break;
      case "insertFromYank":
        this.renderAll();
        break;
      case "deleteWordBackward":
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteWordForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteSoftLineBackward":
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteSoftLineForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteEntireSoftLine":
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteHardLineBackward":
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteHardLineForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "deleteByDrag":
        this.renderAll();
        break;
      case "deleteByCut":
        this.renderAll();
        break;
      case "deleteContent":
        this.renderAll();
        break;
      case "deleteContentBackward":
        if (inputSelection.start.pos == 0) {
          this.deleteLines(startLine - 1, endLine);
          this.insertLineAt(store.currentLine, startLine - 1);
        } else {
          this.deleteLines(startLine, endLine);
          this.insertLineAt(store.currentLine, startLine);
        }

        break;
      case "deleteContentForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case "historyUndo":
        this.renderAll();
        break;
      case "historyRedo":
        this.renderAll();
        break;
    }
  }
}