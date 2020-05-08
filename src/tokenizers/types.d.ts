export type TOKEN_TYPE =
	| 'ID'
	| 'CLASS'
	| 'INLINE_START'
	| 'BLOCK_MARK'
	| 'BLOCK_NAME'
	| 'KAERITEN_START'
	| 'OKURIGANA_START'
	| 'KAERITEN'
	| 'OKURIGANA'
	| 'ILLEGIBLE'
	| 'BUG_HOLE'
	| 'QUESTION'
	| 'INLINE_NAME'
	| 'INLINE_SEP'
	| 'COLON'
	| 'INLINE_END'
	| 'FURIGANA_START'
	| 'FURIGANA_END'
	| 'PERSON_START'
	| 'PERSON'
	| 'PERSON_END'
	| 'PLACE_START'
	| 'PLACE'
	| 'PLACE_END'
	| 'DATE_START'
	| 'DATE'
	| 'DATE_END'
	| 'KAERI_START'
	| 'FURIGANA'
	| 'FURIGANA_SEP'
	| 'ANNOTATION'
	| 'ANNO_START'
	| 'ANNO_END'
	| 'TEXT_SEGMENT'
	| 'LB'
	| 'UNKNOWN';

export interface Token {
	type: TOKEN_TYPE;
	value: string;
	start?: number;
	end?: number;
	tokenIndex?: number;
	pairIndex?: number;
	error?: boolean;
	errorMsg?: string;
}

export interface State {
	brackets: Array<Token>;
	errors: Array<number>;
	inInlinePre: boolean;
	inInlineBody: boolean;
	inBlockTag: boolean;
	inFurigana: boolean;
	inPerson: boolean;
	inPlace: boolean;
	inDate: boolean;
	inOkurigana: boolean;
	inKaeriten: boolean;
	inAnno: boolean;
}
