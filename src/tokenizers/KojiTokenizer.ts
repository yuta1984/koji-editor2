import { InputStream } from './Tokenizer';
import Tokenizer from './Tokenizer';
import { Token, State, TOKEN_TYPE } from './types';

export default class KojiTokenizer extends Tokenizer {
	tokenIndex = 0;
	is: InputStream;
	state: State;
	current: any;
	brackets: { [s: string]: TOKEN_TYPE } = {
		'（': 'FURIGANA_START',
		'）': 'FURIGANA_END',
		'｛': 'PERSON_START',
		'｝': 'PERSON_END',
		'〔': 'PLACE_START',
		'〕': 'PLACE_END',
		'＜': 'DATE_START',
		'＞': 'DATE_END',
		'【': 'ANNO_START',
		'】': 'ANNO_END'
	};
	symbols: { [s: string]: TOKEN_TYPE } = {
		'□': 'ILLEGIBLE',
		'■': 'BUG_HOLE',
		'＿': 'KAERITEN_START',
		'￣': 'OKURIGANA_START',
		'？': 'QUESTION'
	};

	constructor(src: string) {
		super(src);
		this.is = new InputStream(src);
		this.state = {
			brackets: [],
			errors: [],
			inInlinePre: false,
			inInlineBody: false,
			inBlockTag: false,
			inFurigana: false,
			inPerson: false,
			inPlace: false,
			inDate: false,
			inOkurigana: false,
			inKaeriten: false,
			inAnno: false
		};
	}

	isBracket(ch: string): boolean {
		return '（）｛｝【】〔〕＜＞'.indexOf(ch) > -1;
	}

	isColon(ch: string): boolean {
		return ch === '：';
	}

	isSymbol(ch: string): boolean {
		return this.symbols[ch] !== undefined;
	}

	isLetter(ch: string): boolean {
		let regex = [
			/[\u0020-\u007E]/,
			/[\u2000-\u206F]/,
			/[\u4E00-\u9FEA\u3400-\u4DFF]/,
			/[\u3040-\u309F]/,
			/[\u30A0-\u30FF\u31F0-\u31FF]/,
			/[\u1B000-\u1B000\u1B100-\u1B12F]/,
			/[\u3190-\u319F]/,
			/[\u3000-\u3007\u300C-\u300F\u3012-\u3013\u3016-\u303F]/,
			/[\uFF00-\uFF02\uFF04\uFF06\uFF07\uFF0B-\uFF0E\uFF10-\uFF19\uFF1B\uFF1D\uFF20-\uFF3A\uFF3E\uFF40-\uFF5A\uFF5E-\uFFE2\uFFE4\uFFEF]/
		];
		return regex.some((r) => ch.match(r) != null);
	}

	isKaeriten(ch: string): boolean {
		return /^[レ一二三四五六七八九十上中下甲乙丙丁天地人]$/.test(ch);
	}

	isKana(ch: string): boolean {
		const regex = /^[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\u1B000-\u1B000\u1B100-\u1B12F]$/;
		return regex.test(ch);
	}

	isMatchingPair(ch1: string, ch2: string): boolean {
		return (
			(ch1 === '《' && ch2 === '》') ||
			(ch1 === '＜' && ch2 === '＞') ||
			(ch1 === '｛' && ch2 === '｝') ||
			(ch1 === '（' && ch2 === '）') ||
			(ch1 === '【' && ch2 === '】')
		);
	}
	readWhile(predicate: (ch: string) => boolean) {
		let buf = '';
		while (!this.is.eof() && predicate(this.is.peek())) buf += this.is.next();
		return buf;
	}

	readTextSegment(): Token {
		const seg = this.readWhile(this.isLetter);
		if (this.state.inInlinePre) {
			return { type: 'INLINE_NAME', value: seg };
		} else if (this.state.inBlockTag) {
			return { type: 'BLOCK_NAME', value: seg };
		} else if (this.state.inFurigana) {
			return { type: 'FURIGANA', value: seg };
		} else if (this.state.inPerson) {
			return { type: 'PERSON', value: seg };
		} else if (this.state.inPlace) {
			return { type: 'PLACE', value: seg };
		} else if (this.state.inDate) {
			return { type: 'DATE', value: seg };
		} else if (this.state.inAnno) {
			return { type: 'ANNOTATION', value: seg };
		} else {
			return { type: 'TEXT_SEGMENT', value: seg };
		}
	}

	readBracket(): Token {
		const ch = this.is.next();
		let tok: Token;
		if ('（【｛〔＜'.indexOf(ch) > -1) {
			tok = { type: this.brackets[ch], value: ch };
			this.state.brackets.push(tok);
			if (ch === '（') this.state.inFurigana = true;
			if (ch === '｛') this.state.inPerson = true;
			if (ch === '〔') this.state.inPlace = true;
			if (ch === '＜') this.state.inDate = true;
			if (ch === '【') this.state.inAnno = true;
		} else {
			tok = { type: this.brackets[ch], value: ch };
			const pair = this.state.brackets[this.state.brackets.length - 1];
			if (pair && this.isMatchingPair(pair.value, ch)) {
				this.state.brackets.pop();
				pair.pairIndex = this.tokenIndex;
				tok.pairIndex = pair.tokenIndex;
			} else {
				this.state.brackets.push(tok);
				tok.error = true;
				tok.errorMsg = '対応する括弧がありません．';
			}
			if (ch === '）') this.state.inFurigana = false;
			if (ch === '】') this.state.inAnno = false;
			if (ch === '｝') this.state.inPerson = false;
			if (ch === '〕') this.state.inPlace = false;
			if (ch === '＞') this.state.inDate = false;
		}
		return tok;
	}

	readInlineStart(): Token {
		let ch = this.is.next();
		this.state.inInlinePre = true;
		let tok: Token = { type: 'INLINE_START', value: ch };
		this.state.brackets.push(tok);
		return tok;
	}

	readInlineEnd(): Token {
		let ch = this.is.next();
		let tok: Token = { type: 'INLINE_END', value: ch };
		this.state.inInlinePre = false;
		this.state.inInlineBody = false;
		const last = this.state.brackets[this.state.brackets.length - 1];
		if (last && last.type === 'INLINE_START') {
			this.state.brackets.pop();
			last.pairIndex = this.tokenIndex;
			tok.pairIndex = last.tokenIndex;
		} else {
			tok.error = true;
			tok.errorMsg = '対応する括弧がありません．';
		}
		return tok;
	}

	readBlockTag(): Token {
		const tag = this.readWhile((ch) => ch === '％');
		this.state.inBlockTag = true;
		return { type: 'BLOCK_MARK', value: tag };
	}

	readID(): Token {
		let ch = this.is.next();
		const id = this.readWhile(this.isLetter);
		if (this.state.inInlinePre || this.state.inBlockTag) {
			return { type: 'ID', value: ch + id };
		} else {
			return {
				type: 'UNKNOWN',
				value: ch + id,
				error: true,
				errorMsg: 'ここにIDは書けません'
			};
		}
	}

	readClass(): Token {
		let ch = this.is.next();
		const id = this.readWhile(this.isLetter);
		if (this.state.inInlinePre || this.state.inBlockTag) {
			return { type: 'CLASS', value: ch + id };
		} else {
			return {
				type: 'UNKNOWN',
				value: ch + id,
				error: true,
				errorMsg: 'ここにクラスは書けません'
			};
		}
	}

	readColon(): Token {
		if (this.state.inInlinePre) {
			this.state.inInlinePre = false;
			this.state.inInlineBody = true;
		}
		return { type: 'COLON', value: this.is.next() };
	}

	readSep(): Token {
		if (this.state.inInlineBody) {
			return { type: 'INLINE_SEP', value: this.is.next() };
		} else {
			return { type: 'FURIGANA_SEP', value: this.is.next() };
		}
	}

	readLineBreak(): Token {
		const ch = this.is.next();
		if (this.state.inInlinePre || this.state.inAnno) {
			return {
				type: 'LB',
				value: ch,
				error: true,
				errorMsg: 'ここに改行を含めることはできません。'
			};
		} else {
			if (this.state.inBlockTag) this.state.inBlockTag = false;
			return { type: 'LB', value: ch, error: false };
		}
	}

	readSymbol(): Token {
		const ch = this.is.next();
		if (ch === '□') {
			return {
				type: 'ILLEGIBLE',
				value: ch
			};
		} else if (ch === '■') {
			return { type: 'BUG_HOLE', value: ch };
		} else if (ch === '？') {
			return { type: 'QUESTION', value: ch };
		} else if (ch === '＿') {
			const kaetiten = this.readWhile((ch) => this.isKaeriten(ch));
			return {
				type: 'KAERITEN',
				value: ch + kaetiten
			};
		} else if (ch === '￣') {
			const okurigana = this.readWhile((ch) => this.isKana(ch));
			return {
				type: 'OKURIGANA',
				value: ch + okurigana
			};
		} else {
			return { type: 'UNKNOWN', value: 'ch', error: true };
		}
	}

	readNext(): Token | null {
		if (this.is.eof()) return null;
		let ch = this.is.peek();
		let startPos = this.is.pos;
		let tok: Token | null = null;
		if (ch === '《') tok = this.readInlineStart();
		if (ch === '》') tok = this.readInlineEnd();
		if (ch === '％') tok = this.readBlockTag();
		if (ch === '｜') tok = this.readSep();
		if (ch === '＃' || ch === '#') tok = this.readID();
		if (ch === '＊' || ch === '*') tok = this.readClass();
		if (this.isSymbol(ch)) tok = this.readSymbol();
		if (this.isLetter(ch)) tok = this.readTextSegment();
		if (this.isBracket(ch)) tok = this.readBracket();
		if (this.isColon(ch)) tok = this.readColon();
		if (ch === '\n') tok = this.readLineBreak();
		if (!tok) {
			// handle unknown characters
			ch = this.is.next();
			tok = {
				type: 'UNKNOWN',
				value: ch,
				error: true,
				errorMsg: `不正な文字：${ch}`
			};
		}
		tok.start = startPos;
		tok.end = this.is.pos;
		tok.tokenIndex = this.tokenIndex++;
		return tok;
	}

	tokenize(): Array<Token> {
		const buf: Array<Token> = [];
		while (this.peek()) {
			buf.push(<Token>this.next());
		}
		// mark pair errors
		this.state.brackets.forEach((p) => {
			p.error = true;
			p.errorMsg = '対応する括弧がありません．';
		});
		return buf;
	}
}
