interface State {
    mode: string;
}
interface Span {
    tokenType: string;
    text: string;
}

function syntax(previsous_state: any, line: string): { states: State[], spans: Span[] } {

    return { states: [], spans: [] }
}