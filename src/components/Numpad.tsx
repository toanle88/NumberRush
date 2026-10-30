import { memo } from 'react'
import { createTranslator } from '../utils/i18n'
import type { Translator } from '../utils/i18n'
interface NumpadProps {
  onInput: (val: string) => void
  onClear: () => void
  onSubmit: () => void
  translate?: Translator
}

const Numpad = memo(({ onInput, onClear, onSubmit, translate = createTranslator('en') }: NumpadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓']
  return (
    <div className="numpad" role="group" aria-label={translate('answerKeypad')}>
      {keys.map((key) => {
        const isSubmit = key === '✓'
const isClear = key === 'C'
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (isClear) onClear()
else if (isSubmit) onSubmit()
else onInput(key)
}}
            className={`num-btn ${isClear ? 'clear-btn' : ''} ${isSubmit ? 'submit-btn primary' : ''}`}
            aria-label={isClear ? translate('clearAnswer') : isSubmit ? translate('submitAnswer') : translate('enterDigit', { digit: key })}
          >
            {key}
          </button>
        )
})}
    </div>
  )
})
export default Numpad
