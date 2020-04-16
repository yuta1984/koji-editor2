import "./style.scss";
export { default as Editor } from './components/Editor';

const KojiWorker = require('worker-loader?inline!./koji-lang.worker')
const worker = new KojiWorker()
worker.postMessage({ type: "parse", src: 'ほげ' })

worker.onmessage = (event: any) => {
    console.log(event)
}