import { Interpreter } from "./Interpreter/Interpreter"

import React, { useState, useMemo } from 'react'
import { createEditor, Descendant, Editor, Range } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react'
import { assertNever, ResultType } from "./Utils"

const createInterpreter = (): Interpreter =>
  Interpreter
    .withBuiltins(bs =>
      bs
        .infix("+", 4, (left, right) => left + right)
        .infix("*", 4, (left, right) => left * right)
        .infix("-", 3, (left, right) => left - right)
        .infix("/", 3, (left, right) => left / right)
        .infix("^", 5, (left: number, right: number) => Math.pow(left, right))
  );

const Calculator = () => {
  const interpreter = useMemo(() => createInterpreter(), []);
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

const App = () => {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const editor = useMemo(() => withReact(createEditor()), [])
  return (
    <Slate editor={editor} value={value} onChange={value => setValue(value)}>
      <Calculator />
      <Editable placeholder="Enter some plain text..." />
    </Slate>
  )
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: '4 * 4' },
    ],
  },
]

export default App;
