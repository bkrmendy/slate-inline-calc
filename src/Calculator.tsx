import { assertNever, ResultType } from "./Utils";
import { Interpreter } from "./Interpreter/Interpreter"

import { Editor, Range } from "slate"
import { ReactEditor, useSlate } from "slate-react"

export interface CalculatorProps {
    interpreter: Interpreter
}

export const Calculator = (props: CalculatorProps) => {
    const { interpreter } = props;
    const editor = useSlate();
    const { selection } = editor;

    if (!selection
        || !ReactEditor.isFocused(editor)
        || Range.isCollapsed(selection)
        || Editor.string(editor, selection) == null
        || Editor.string(editor, selection) === ''
    ) {
        return <pre><i> </i></pre>
    } else {
        const selectedText = Editor.string(editor, selection);
        const result = interpreter.interpret(selectedText);
        switch (result.type) {
            case ResultType.OK:
                return <pre>{result.value} = {selectedText}</pre>;
            case ResultType.Error:
                return <pre>Error: {result.error}</pre>;
            default:
                assertNever(result);
        }
        throw new Error("Silence, eslint!")
    }
}