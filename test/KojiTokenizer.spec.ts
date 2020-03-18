import { expect } from 'chai';
import 'mocha';
import KojiTokenizer from '../src/tokenizers/KojiTokenizer';

describe('First test', () => {
    it('tokenizer', () => {
        const src = "ほげばばば《日次＃abc＊ひげ＊ほげ：あいうえお》ばばばばばｂ..."
        const tokenizer = new KojiTokenizer(src)
        const tokens = tokenizer.tokenize()
        console.log(tokens)
        expect(tokens).to.be.not.null
    });
});