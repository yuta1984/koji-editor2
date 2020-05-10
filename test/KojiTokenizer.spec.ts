import { Token } from './../src/tokenizers/types.d';
import { expect } from 'chai';
import 'mocha';
import KojiTokenizer from '../src/tokenizers/KojiTokenizer';

describe('tokenizer', () => {
	it('can tokenize text', () => {
		const src = `
％段落
読めない□文字■
    《日時＃ID＊クラス：令和二年二月12日》ほげほげ
        `;
		const tokenizer = new KojiTokenizer(src);
		const tokens = tokenizer.tokenize();
		//    console.log(tokens);
		expect(tokens).to.be.not.null;
	});

	it('recognize block and id, class', () => {
		const src = `％章#id*class
      章の中身
      ％％小節
      小節の中身
      ％％
      ％
      `;
		const tokenizer = new KojiTokenizer(src);
		const tokens = tokenizer.tokenize();
		//console.log(tokens);
		expect(tokens).to.be.not.null;
		console.log(tokens);
		expect(tokens[0]).to.haveOwnProperty('id', 'id');
	});

	it('recognize inline element', () => {
		const src = '《日時：１月１日》';
		const tokens = new KojiTokenizer(src).tokenize();
		expect(tokens[0].type).to.equal('INLINE_START');
		expect(tokens[1].type).to.equal('INLINE_NAME');
	});

	it('recognize inline element', () => {
		const src = '《日時：１月１日》';
		const tokens = new KojiTokenizer(src).tokenize();
		expect(tokens[0].type).to.equal('INLINE_START');
		expect(tokens[1].type).to.equal('INLINE_NAME');
	});
});
