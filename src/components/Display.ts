import BaseComponent from "./BaseComponent";
import store from "../store";
import { Token } from "../types";
import KojiTokenizer from '../tokenizers/KojiTokenizer';
import Overlay from './Overlay';

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

    this.add(new Overlay())

    store.$watch("src", () => this.onSrcChange());
    store.$watch('editorSize', () => {
      this.resize(store.state.editorSize.width, store.state.editorSize.height);
    });
    store.$watch(['selection', 'src', 'focus'], () => {
      this.updateSelecttionRects()
      this.updateCaretPos()
    })
    store.$watch('scroll', () => {
      const offset =
        this.$el.scrollWidth -
        this.$el.clientWidth -
        store.state.scroll;
      this.$el.scrollTo(offset, 0)
    })
  }

  resize(width: number, height: number) {
    this.$el.style.width = width + "px";
    this.$el.style.height = height + "px";
  }

  renderLine(text: string): HTMLElement {
    // const tokenizer = new KojiTokenizer(text)
    // const tokens = tokenizer.tokenize()
    // const html = tokens.map(t => `<span class="token-${t.type}">${t.value}</span>`).join('')
    const lineElem = this.h('div', 'koji-editor-line');
    lineElem.innerHTML = text; //html
    return lineElem;
  }

  lineAt(num: number) {
    return this.srcPanel.childNodes.item(num);
  }

  deleteLines(range: { start: number, end: number; }) {
    const children = [];
    for (let i = range.start; i <= range.end; i++) {
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
    const sel = store.selectionWithLineNum;
    const lines = this.$el.getElementsByClassName('koji-editor-line');
    const line = lines[sel.start.linenum]
    const parentRect = this.srcPanel.getBoundingClientRect()
    if (line.textContent) {
      const rect = this.createRelativeRect(line, sel.start.pos, sel.end.pos)
      store.SET_CARET_POS(rect.x, rect.y)
    } else {
      const rect = line.getBoundingClientRect()
      store.SET_CARET_POS(rect.x - parentRect.x, rect.y - parentRect.y)
    }
  }

  updateSelecttionRects() {
    const rects: DOMRect[] = [];
    const sel = store.selectionWithLineNum;
    const lines = this.$el.getElementsByClassName('koji-editor-line');
    // when selection is within single line
    if (sel.start.linenum == sel.end.linenum) {
      const line = lines[sel.start.linenum]
      if (line.textContent) {
        const rect = this.createRelativeRect(line, sel.start.pos, sel.end.pos)
        rects.push(rect)
      }
    } else {
      // when selection has multiple lines
      const head = lines[sel.start.linenum]
      const tail = lines[sel.end.linenum]
      if (head.textContent)
        rects.push(this.createRelativeRect(head, sel.start.pos, head.textContent.length))
      if (tail.textContent)
        rects.push(this.createRelativeRect(tail, 0, sel.end.pos))
      // lines between head and tail
      for (let i = sel.start.linenum + 1; i < sel.end.linenum; i++) {
        const line = lines[i]
        if (line.textContent) {
          rects.push(this.createRelativeRect(line, 0, line.textContent.length))
        }
      }
    }
    store.SET_SELETECTED_RECTS(rects);
  }

  createRelativeRect(node: Node, start: number, end: number): DOMRect {
    const range = document.createRange();
    if (node.firstChild == null) throw Error
    range.setStart(node.firstChild, start);
    range.setEnd(node.firstChild, end);
    const parentRect = this.srcPanel.getBoundingClientRect()
    const rect = range.getBoundingClientRect();
    rect.x = rect.x - parentRect.x
    rect.y = rect.y - parentRect.y
    range.detach();
    return rect;
  }

  onSrcChange() {
    if (!store.state.input.inputEvent) return;
    switch (store.state.input.inputEvent.inputType) {
      case "insertText":
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "insertLineBreak":
        this.deleteLines(store.prevSelectedLines);
        const line1 = store.lines[store.currentSelectedLines.start - 1];
        const line2 = store.lines[store.currentSelectedLines.start];
        this.insertLineAt(line1, store.prevSelectedLines.end);
        this.insertLineAt(line2, store.prevSelectedLines.end + 1);
        break;
      case "insertCompositionText":
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
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
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "deleteWordForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(store.prevSelectedLines);
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "deleteSoftLineBackward":
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "deleteSoftLineForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(store.prevSelectedLines);
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "deleteEntireSoftLine":
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "deleteHardLineBackward":
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        break;
      case "deleteHardLineForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(store.prevSelectedLines);
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
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
        if (store.prevPos.char == 0) {
          this.deleteLines(store.prevSelectedLines);
        } else {
          this.deleteLines(store.prevSelectedLines);
          this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
        }
        break;
      case "deleteContentForward":
        if (store.nextChar == "\n" && !store.inputHasSelection) this.deleteLines(store.prevSelectedLines);
        this.deleteLines(store.prevSelectedLines);
        this.insertLineAt(store.currentLine, store.prevSelectedLines.end);
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
