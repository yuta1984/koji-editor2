import BaseComponent from './BaseComponent';
import store from '../store';
import { Token } from '../types';
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

    store.$watch('src', () => this.onSrcChange());
    store.$watch(['selection', 'src', 'focus'], () => {
      this.updateSelecttionRects();
      this.updateCaretPos();
    });
    store.$watch('scroll', () => {
      const offset =
        this.$el.scrollWidth - this.$el.clientWidth - store.state.scroll;
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

  private proposeSelection(e: KeyboardEvent): { start: number; end: number } {
    const text = store.state.src.text;
    const sel = store.currentSelection;
    const { start, end } = store.state.selection;
    switch (e.key) {
      case 'ArrowUp':
        if (start > 0) {
          return e.shiftKey
            ? { start: start - 1, end }
            : { start: start - 1, end: start - 1 };
        }
        break;
      case 'ArrowDown':
        if (end < text.length) {
          return e.shiftKey
            ? { start, end: end + 1 }
            : { start: end + 1, end: end + 1 };
        }
      case 'ArrowRight':
        const nextPosRight = this.proposeNextCaretPos('right');
        return e.shiftKey
          ? { start: nextPosRight, end }
          : { start: nextPosRight, end: nextPosRight };
        break;
      case 'ArrowLeft':
        const nextPosLeft = this.proposeNextCaretPos('left');
        return e.shiftKey
          ? { start, end: nextPosLeft }
          : { start: nextPosLeft, end: nextPosLeft };
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
    text
      .split('\n')
      .slice(0, lineNum)
      .forEach(l => (abspos += l.length + 1));
    abspos += pos;
    return abspos;
  }

  renderLine(text: string): HTMLElement {
    const tokenizer = new KojiTokenizer(text);
    const tokens = tokenizer.tokenize();
    let html = tokens
      .map(t => {
        const chars = this.addCharSpans(t.value);
        return `<span class="token ${t.type}">${chars}</span>`;
      })
      .join('');
    html = this.replaceSymbols(html);
    html += '<span class="koji-editor-lb char"></span>';
    const lineElem = this.h('div', 'koji-editor-line');
    lineElem.innerHTML = html;
    return lineElem;
  }

  private addCharSpans(text: string): string {
    return text
      .split('')
      .map(c => `<span class="char">${c}</span>`)
      .join('');
  }

  private replaceSymbols(text: string): string {
    return text.replace(
      /　/g,
      '<span class="koji-editor-white-space">□</span>'
    );
  }

  private lineAt(num: number) {
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
    this.srcPanel.innerHTML = '';
    store.state.src.text.split('\n').forEach(l => {
      const line = this.renderLine(l);
      this.srcPanel.appendChild(line);
    });
  }

  private getCharElemsAt({
    start,
    end
  }: {
    start: number;
    end: number;
  }): Element[] {
    const chars = this.srcPanel.querySelectorAll('.char');
    return Array.from(chars).slice(start, end);
  }

  updateCaretPos() {
    const { start } = store.state.selection;
    const charElem = this.getCharElemsAt({ start, end: start + 1 })[0];
    const rect = this.createRelativeRect(charElem);
    store.SET_CARET_POS(rect.x, rect.y);
  }

  updateSelecttionRects() {
    const { start, end } = store.state.selection;
    //const rects: DOMRect[] = [];
    const selected = this.getCharElemsAt({ start, end });
    const parentRect = this.srcPanel.getBoundingClientRect();
    const srcPanelWidth = this.srcPanel.clientWidth;
    const offset = srcPanelWidth - this.$el.clientWidth;
    const rects = selected.map(c => {
      const rect = c.getBoundingClientRect();
      rect.x = rect.x - parentRect.x - offset;
      rect.y = rect.y - parentRect.y;
      return rect;
    });
    store.SET_SELETECTED_RECTS(rects);
  }

  absolutePosToInlinePos(pos: number): { pos: number; lineNum: number } {
    const text = store.state.src.text;
    let lineNum = 0;
    let inlinePos = 0;
    for (let i = 0; i < text.length; i++) {
      if (i == pos) return { pos: inlinePos, lineNum: lineNum };
      if (text[i] === '\n') {
        lineNum++;
        inlinePos = 0;
      } else {
        inlinePos++;
      }
    }
    return { pos: inlinePos, lineNum: lineNum };
  }

  createRelativeRect(elem: Element): DOMRect {
    const rect = elem.getBoundingClientRect();
    const parentRect = this.srcPanel.getBoundingClientRect();
    const srcPanelWidth = this.srcPanel.clientWidth;
    const offset = srcPanelWidth - this.$el.clientWidth;
    rect.x = rect.x - parentRect.x - offset;
    rect.y = rect.y - parentRect.y;
    return rect;
  }

  private proposeNextCaretPos(direction: 'right' | 'left'): number {
    type CaretPos = {
      lineNum: number;
      pos: number;
      left: number;
      top: number;
    };
    const sel = store.currentSelection;
    const caret = document.getElementsByClassName('koji-editor-caret')[0];
    let originRect = caret.getBoundingClientRect();
    // if caret is not shown
    if (store.isRegionSelected) {
      const selected = this.getCharElemsAt(store.state.selection);
      originRect =
        direction == 'right'
          ? selected[0].getBoundingClientRect()
          : selected[selected.length - 1].getBoundingClientRect();
    }
    const currLine =
      direction == 'right'
        ? this.lines[sel.start.linenum]
        : this.lines[sel.end.linenum];
    const nextLineNum =
      direction == 'right' ? sel.start.linenum - 1 : sel.end.linenum + 1;
    const nextLine = this.lines[nextLineNum];
    // do nothing if prev line does not exist
    if (!nextLine) return store.state.selection.start;
    const currChars = currLine.getElementsByClassName('char');
    const prevChars = nextLine.getElementsByClassName('char');
    const lineWidth = 22;
    const candidates: CaretPos[] = [];
    // add chars in current line
    for (let i = 0; i < currChars.length; i++) {
      const rect = currChars[i].getBoundingClientRect();
      candidates.push({
        lineNum: sel.start.linenum,
        pos: i,
        left: rect.left,
        top: rect.top
      });
    }
    // add chars in previous line
    for (let i = 0; i < prevChars.length; i++) {
      const rect = prevChars[i].getBoundingClientRect();
      candidates.push({
        lineNum: nextLineNum,
        pos: i,
        left: rect.left,
        top: rect.top
      });
    }
    // find the closest char in visually next line
    let closestDistY = Infinity;
    let candidate: CaretPos | null = null;
    candidates.forEach(c => {
      const distX =
        direction == 'right'
          ? c.left - originRect.left
          : originRect.left - c.left;
      const distY = Math.abs(c.top - originRect.top);
      if (distX == lineWidth && distY < closestDistY) {
        candidate = c;
        closestDistY = distY;
      }
    });
    if (candidate === null) {
      throw new Error();
    } else {
      return this.inlinePosToAbsolutePos(candidate!.lineNum, candidate!.pos);
    }
  }

  onSrcChange() {
    if (!store.state.input.inputEvent) return this.renderAll();
    const inputSelection = store.inputSelection;
    const startLine = inputSelection.start.linenum;
    const endLine = inputSelection.end.linenum;
    switch (store.state.input.inputEvent.inputType) {
      case 'insertText':
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'insertLineBreak':
        const currentSelection = store.currentSelection;
        const cStartLine = currentSelection.start.linenum;
        const cendLine = currentSelection.end.linenum;
        this.deleteLines(startLine, endLine);
        const line1 = store.lines[cStartLine - 1];
        const line2 = store.lines[cStartLine];
        this.insertLineAt(line1, endLine);
        this.insertLineAt(line2, endLine + 1);
        break;
      case 'insertCompositionText':
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'insertFromPaste':
        this.renderAll();
        break;
      case 'insertFromPasteAsQuotation':
        this.renderAll();
        break;
      case 'insertFromDrop':
        this.renderAll();
        break;
      case 'insertReplacementText':
        this.renderAll();
        break;
      case 'insertFromYank':
        this.renderAll();
        break;
      case 'deleteWordBackward':
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteWordForward':
        if (store.nextChar == '\n' && !store.inputHasSelection)
          this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteSoftLineBackward':
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteSoftLineForward':
        if (store.nextChar == '\n' && !store.inputHasSelection)
          this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteEntireSoftLine':
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteHardLineBackward':
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteHardLineForward':
        if (store.nextChar == '\n' && !store.inputHasSelection)
          this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'deleteByDrag':
        this.renderAll();
        break;
      case 'deleteByCut':
        this.renderAll();
        break;
      case 'deleteContent':
        this.renderAll();
        break;
      case 'deleteContentBackward':
        if (inputSelection.start.pos == 0) {
          this.deleteLines(startLine - 1, endLine);
          this.insertLineAt(store.currentLine, startLine - 1);
        } else {
          this.deleteLines(startLine, endLine);
          this.insertLineAt(store.currentLine, startLine);
        }

        break;
      case 'deleteContentForward':
        if (store.nextChar == '\n' && !store.inputHasSelection)
          this.deleteLines(startLine, endLine);
        this.deleteLines(startLine, endLine);
        this.insertLineAt(store.currentLine, endLine);
        break;
      case 'historyUndo':
        this.renderAll();
        break;
      case 'historyRedo':
        this.renderAll();
        break;
    }
  }
}
