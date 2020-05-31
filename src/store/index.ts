import { isArray } from 'util';
import { KojiBlockNode, KojiInlineNode, KojiASTNode } from 'koji-lang/lib/KojiAstBuilder';

export type StateName = keyof IState;
function Mutation(state: StateName | StateName[]) {
	return function(target: any, name: string, descriptor: PropertyDescriptor) {
		const method = descriptor.value;
		descriptor.value = function(this: any) {
			this.prevState = this.state;
			method.apply(this, arguments);
			this.$trigger(state);
		};
	};
}

interface ParseResult {
	errors: [];
	ast: {
		inlines: KojiInlineNode[];
		blocks: KojiBlockNode[];
		parens: { start: number; stop: number }[];
		children: KojiASTNode[];
	};
}

export interface IState {
	disabled: boolean;
	initialized: boolean;
	src: {
		text: string;
	};
	requestedSrc: string;
	requestFocus: boolean;
	selection: { start: number; end: number };
	requestedSelection: { start: number; end: number };

	selectedRects: DOMRect[];
	caretPos: { x: number; y: number };
	input: {
		inputEvent?: InputEvent;
		text: string;
		selection: { start: number; end: number };
	};
	focus: boolean;
	editorSize: {
		width: number;
		height: number;
	};
	scrollWidth: number;
	scroll: number;

	compositionActive: boolean;
	compositionText: string;
	compositionRects: DOMRect[];

	keyboardEvent: KeyboardEvent | null;
	proposedCaretPos: number;

	parseResult: ParseResult | null;
	currentNode: KojiBlockNode | KojiInlineNode | null;
	renderingMode: 'html' | 'xml';
	renderedText: string;
}

class Store {
	state: IState = this.initState();
	handlers: { [P in StateName]: Function[] } = this.initHandlers();

	init() {
		this.state = this.initState();
		this.handlers = this.initHandlers();
	}

	initHandlers(): { [P in StateName]: Function[] } {
		return {
			disabled: [],
			initialized: [],
			src: [],
			requestedSrc: [],
			requestFocus: [],
			selection: [],
			requestedSelection: [],
			selectedRects: [],
			input: [],
			focus: [],
			scroll: [],
			scrollWidth: [],
			editorSize: [],
			caretPos: [],
			compositionActive: [],
			compositionText: [],
			compositionRects: [],
			keyboardEvent: [],
			proposedCaretPos: [],
			parseResult: [],
			currentNode: [],
			renderingMode: [],
			renderedText: []
		};
	}

	initState(): IState {
		return {
			disabled: false,
			initialized: false,
			src: {
				text: ''
			},
			requestedSrc: '',
			requestFocus: false,
			selection: {
				start: 0,
				end: 0
			},
			requestedSelection: {
				start: 0,
				end: 0
			},
			selectedRects: [],
			caretPos: { x: 0, y: 0 },
			input: {
				text: '',
				selection: {
					start: 0,
					end: 0
				}
			},
			scroll: 0,
			scrollWidth: 0,
			editorSize: {
				width: 0,
				height: 0
			},
			focus: false,
			compositionActive: false,
			compositionText: '',
			compositionRects: [],

			keyboardEvent: null,
			proposedCaretPos: 0,

			parseResult: null,
			currentNode: null,
			renderingMode: 'html',
			renderedText: ''
		};
	}

	get selectedText() {
		const { start, end } = this.state.selection;
		return this.state.src.text.slice(start, end);
	}

	getSelectionWithLineNum(text: string, sel: { start: number; end: number }) {
		let sline = 0,
			spos = 0,
			eline = 0,
			epos = 0;
		for (let i = 0; i < sel.end; i++) {
			if (i < sel.start) {
				if (text[i] === '\n') {
					sline++;
					spos = 0;
				} else {
					spos++;
				}
			}
			if (i <= sel.end) {
				if (text[i] === '\n') {
					eline++;
					epos = 0;
				} else {
					epos++;
				}
			}
		}
		return { start: { linenum: sline, pos: spos }, end: { linenum: eline, pos: epos } };
	}

	get currentSelection() {
		return this.getSelectionWithLineNum(this.state.src.text, this.state.selection);
	}

	get inputSelection() {
		const input = this.state.input;
		return this.getSelectionWithLineNum(input.text, input.selection);
	}

	// get selectionWithLineNum() {
	//   const { start, end } = this.state.selection;
	//   const text = this.state.src.text;
	//   let sline = 0, spos = 0, eline = 0, epos = 0;
	//   for (let i = 0; i < end; i++) {
	//     if (i < start) {
	//       if (text[i] === "\n") { sline++; spos = 0; }
	//       else { spos++; }
	//     }
	//     if (i <= end) {
	//       if (text[i] === "\n") { eline++; epos = 0; }
	//       else { epos++; }
	//     }
	//   }
	//   return { start: { linenum: sline, pos: spos }, end: { linenum: eline, pos: epos } };
	// }

	get lines(): string[] {
		return this.state.src.text.split('\n');
	}

	// get prevSelectedLines(): { start: number; end: number; } {
	//   let start = 0;
	//   let end = 0;
	//   const text = this.state.input.text;
	//   const selection = this.state.input.selection;
	//   console.log(text);
	//   for (let i = 0; i < selection.end; i++) {
	//     if (text.charAt(i) == "\n") {
	//       if (i <= selection.start) start++;
	//       if (i <= selection.end) end++;
	//     }
	//   }
	//   return { start, end };
	// }

	// get currentSelectedLines(): { start: number; end: number; } {
	//   let start = 0;
	//   let end = 0;
	//   const text = this.state.src.text;
	//   const selection = this.state.selection;
	//   for (let i = 0; i < selection.end; i++) {
	//     if (text.charAt(i) == "\n") {
	//       if (i <= selection.start) start++;
	//       if (i <= selection.end) end++;
	//     }
	//   }
	//   return { start, end };
	// }

	get currentLine(): string {
		const sel = this.getSelectionWithLineNum(this.state.src.text, this.state.selection);
		return this.state.src.text.split('\n')[sel.end.linenum];
	}

	// get currentPos(): { line: number, char: number; } {
	//   const selection = this.state.selection;
	//   const text = this.state.src.text.slice(0, selection.end);
	//   const lines = text.split("\n");
	//   return { line: lines.length - 1, char: lines[lines.length - 1].length };
	// }

	// get prevPos(): { line: number, char: number; } {
	//   const selection = this.state.input.selection;
	//   const text = this.state.input.text.slice(0, selection.end);
	//   const lines = text.split("\n");
	//   if (lines.length == 0) return { line: 0, char: 0 };
	//   return { line: lines.length - 1, char: lines[lines.length - 1].length };
	// }

	get prevLine(): string {
		const current = this.currentSelection;
		return this.state.src.text.split('\n')[current.start.linenum - 1];
	}

	get nextLine(): string {
		const current = this.currentSelection;
		return this.state.src.text.split('\n')[current.end.linenum + 1];
	}

	get isRegionSelected(): boolean {
		return this.state.selection.start != this.state.selection.end;
	}

	get inputHasSelection(): boolean {
		const { start, end } = this.state.input.selection;
		return start != end;
	}

	get nextChar(): string {
		const idx = this.state.input.selection.end;
		return this.state.input.text[idx];
	}

	get prevChar(): string {
		const idx = this.state.input.selection.start;
		return this.state.input.text[idx - 1];
	}

	@Mutation('initialized')
	SET_INITIALIZED(value: boolean) {
		this.state.initialized = value;
	}

	@Mutation('requestedSrc')
	SET_REQUESTED_SRC(value: string) {
		this.state.requestedSrc = value;
	}

	@Mutation('src')
	SET_INPUT(payload: { srcText: string; inputEvent?: InputEvent; selection: { start: number; end: number } }) {
		this.state.input.inputEvent = payload.inputEvent;
		this.state.input.selection = this.state.selection;
		this.state.input.text = this.state.src.text;
		this.state.src.text = payload.srcText;
		this.state.selection = payload.selection;
	}

	@Mutation('focus')
	SET_FOCUS(value: boolean) {
		this.state.focus = value;
	}

	@Mutation('selection')
	SET_SELECTION(sel: { start: number; end: number }) {
		this.state.selection = sel;
	}

	@Mutation('requestedSelection')
	SET_REQUESTED_SELECTION(sel: { start: number; end: number }) {
		this.state.requestedSelection = sel;
	}

	@Mutation('selectedRects')
	SET_SELETECTED_RECTS(value: DOMRect[]) {
		this.state.selectedRects = value;
	}

	@Mutation('scroll')
	SET_SCROLL(value: number) {
		this.state.scroll = value;
	}

	@Mutation('scrollWidth')
	SET_SCROLL_WIDTH(value: number) {
		this.state.scrollWidth = value;
	}

	@Mutation('editorSize')
	SET_EDITOR_SIZE(width: number, height: number) {
		this.state.editorSize = { width, height };
	}

	@Mutation('caretPos')
	SET_CARET_POS(x: number, y: number) {
		this.state.caretPos = { x, y };
	}

	@Mutation('compositionActive')
	SET_COMPOSITION_ACTIVE(value: boolean) {
		this.state.compositionActive = value;
	}

	@Mutation('compositionText')
	SET_COMPOSITION_TEXT(value: string) {
		this.state.compositionText = value;
	}

	@Mutation('compositionRects')
	SET_COMPOSITION_RECTS(value: DOMRect[]) {
		this.state.compositionRects = value;
	}

	@Mutation('keyboardEvent')
	SET_KEYBOARD_EVENT(value: KeyboardEvent | null) {
		this.state.keyboardEvent = value;
	}

	@Mutation('proposedCaretPos')
	SET_PROPOSED_CARET_POS(value: number) {
		this.state.proposedCaretPos = value;
	}

	@Mutation('requestFocus')
	SET_REQUEST_FOCUS(value: boolean) {
		this.state.requestFocus = value;
	}

	@Mutation('parseResult')
	SET_PARSE_RESULT(value: ParseResult) {
		this.state.parseResult = value;
	}

	@Mutation('renderingMode')
	SET_RENDERING_MODE(value: 'html' | 'xml') {
		this.state.renderingMode = value;
	}

	@Mutation('renderedText')
	SET_RENDERED_TEXT(value: string) {
		this.state.renderedText = value;
	}

	@Mutation('currentNode')
	SET_CURRENT_NODE(value: KojiBlockNode | KojiInlineNode | null) {
		this.state.currentNode = value;
	}

	@Mutation('disabled')
	SET_DISABLED(value: boolean) {
		this.state.disabled = value;
	}

	$trigger(state: StateName | StateName[]) {
		if (isArray(state)) {
			state.forEach((s) => {
				this.handlers[s].forEach(function(this: any, h) {
					h.apply(this);
				});
			});
		} else {
			this.handlers[state].forEach(function(this: any, h) {
				h.apply(this);
			});
		}
	}

	$watch(state: StateName | StateName[], handler: () => void) {
		if (isArray(state)) {
			state.forEach((s) => this.handlers[s].push(handler));
		} else {
			this.handlers[state].push(handler);
		}
	}
}
const store = new Store();
(<any>window).store = store;
export default store;
