export type TOKEN_TYPE =
    | 'ID'
    | 'CLASS'
    | 'INLINE_START'
    | 'INLINE_NAME'
    | 'INLINE_SEP'
    | 'COLON'
    | 'INLINE_END'
    | 'FURIGANA_START'
    | 'FURIGANA_END'
    | 'KAERI_START'
    | 'KAERI_END'
    | 'FURIGANA'
    | 'FURIGANA_SEP'
    | 'KAERITEN'
    | 'OKURIGANA'
    | 'OKURIGANA_START'
    | 'OKURIGANA_END'
    | 'ANNOTATION'
    | 'BLOCK_START'
    | 'BLOCK_NAME'
    | 'BLOCK_CLOSING_START'
    | 'BLOCK_END'
    | 'ANNO_START'
    | 'ANNO_END'
    | 'TEXT_SEGMENT'
    | 'LB'
    | 'UNKNOWN';

export interface Token {
    type: string | number;
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
    inKaeriten: boolean;
    inOkurigana: boolean;
    inAnno: boolean;
}
