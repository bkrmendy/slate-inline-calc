import { Interpreter } from "./Interpreter/Interpreter"

import React, { useState, useMemo } from 'react'
import { createEditor, Descendant, Editor, Range } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react'
import { assertNever, ResultType } from "./Utils"

const createInterpreter = (): Interpreter =>
  Interpreter
    .withBuiltins(bs =>
      bs.infix({
        op: "+",
        precedence: 4,
        interpret: (left, right) => left + right
      }).infix({
        op: "*",
        precedence: 4,
        interpret: (left, right) => left * right
      }).infix({
        op: "-",
        precedence: 4,
        interpret: (left, right) => left - right
      }).infix({
        op: "/",
        precedence: 4,
        interpret: (left, right) => left / right
      }).infix({
        op: "^",
        precedence: 4,
        interpret: (left: number, right: number) => Math.pow(left, right)
      }).prefix({
        op: "sqrt",
        precedence: 5,
        interpret: (operand) => Math.sqrt(operand)
      }).define({
        op: "max",
        nArgs: 2,
        precedence: 6,
        interpret: (ops) => Math.max(...ops)
      }).define({
        op: "min",
        nArgs: 2,
        precedence: 6,
        interpret: (ops) => Math.max(...ops)
      })
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
      { text: 'This is editable plain text, just like a <textarea>!' },
    ],
  },
]

export default App;
